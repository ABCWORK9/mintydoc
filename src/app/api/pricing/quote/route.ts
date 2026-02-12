import { NextResponse } from "next/server";
import { getPriceQuote } from "@/server/pricing/policy";
import { keccak256, encodePacked } from "viem";
import { privateKeyToAccount } from "viem/accounts";

type QuoteBody = {
  address: string;
  arTx: string;
  sizeBytes: number;
  clientRequestId?: string;
};

type IpLimit = {
  windowStart: number;
  count: number;
};

type WalletLimit = {
  windowStart: number;
  count: number;
  activeReservationId?: string;
  activeExpiresAt?: number;
};

const walletLimits = new Map<string, WalletLimit>();
const recentRequests = new Map<string, Map<string, number>>();
const ipLimits = new Map<string, IpLimit>();
const IP_WINDOW_MS = 10 * 60 * 1000;
const IP_MAX = 20;

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const value = forwarded.split(",")[0]?.trim().toLowerCase();
    return value || null;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim().toLowerCase();
  return null;
}

export async function POST(req: Request) {
  try {
    const now = Date.now();
    const clientIp = getClientIp(req);
    if (!clientIp) {
      console.warn("ip missing; skipping ip rate limit");
    } else {
      const ipState = ipLimits.get(clientIp) ?? { windowStart: now, count: 0 };
      if (now - ipState.windowStart >= IP_WINDOW_MS) {
        ipState.windowStart = now;
        ipState.count = 0;
      }
      if (ipState.count >= IP_MAX) {
        return NextResponse.json(
          {
            error: "ip_rate_limit",
            message: "Too many requests. Please try again later.",
          },
          { status: 429 }
        );
      }
      ipState.count += 1;
      ipLimits.set(clientIp, ipState);
    }

    const body = (await req.json()) as QuoteBody;
    if (!body?.address || !body?.arTx || !body?.sizeBytes) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const walletKey = body.address.toLowerCase();
    const clientRequestId = body.clientRequestId?.trim();
    const requestCache =
      clientRequestId ? recentRequests.get(walletKey) ?? new Map() : null;
    const lastSeen = requestCache?.get(clientRequestId ?? "") ?? 0;
    const isDuplicateRequest =
      Boolean(clientRequestId) && now - lastSeen < 5 * 60 * 1000;
    if (requestCache && clientRequestId) {
      requestCache.set(clientRequestId, now);
      recentRequests.set(walletKey, requestCache);
    }

    const limits = walletLimits.get(walletKey) ?? {
      windowStart: now,
      count: 0,
    };
    const activeExpiresAt = limits.activeExpiresAt ?? 0;
    if (!isDuplicateRequest && limits.activeReservationId && now / 1000 < activeExpiresAt) {
      return NextResponse.json(
        {
          error: "active_reservation_limit",
          message:
            "You already have an active reservation in progress. Please wait for it to finalize or expire.",
        },
        { status: 429 }
      );
    }

    if (!isDuplicateRequest) {
      if (now - limits.windowStart >= 3600 * 1000) {
        limits.windowStart = now;
        limits.count = 0;
      }
      if (limits.count >= 3) {
        return NextResponse.json(
          {
            error: "hourly_reservation_limit",
            message: "Rate limit reached. Please try again later.",
          },
          { status: 429 }
        );
      }
      limits.count += 1;
    }

    const quote = await getPriceQuote({ sizeBytes: body.sizeBytes });

    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;

    const signerKey = process.env.SIGNER_PRIVATE_KEY;
    const contractAddress = process.env.NEXT_PUBLIC_DOC_PAY_GO_ADDRESS;
    if (!signerKey) {
      return NextResponse.json(
        { error: "Server signer not configured" },
        { status: 500 }
      );
    }
    if (!contractAddress) {
      return NextResponse.json(
        { error: "Contract address not configured" },
        { status: 500 }
      );
    }

    const account = privateKeyToAccount(signerKey as `0x${string}`);
    const digest = keccak256(
      encodePacked(
        ["address", "address", "string", "uint256", "uint256", "uint256"],
        [
          contractAddress as `0x${string}`,
          body.address as `0x${string}`,
          body.arTx,
          BigInt(body.sizeBytes),
          BigInt(quote.priceCents),
          BigInt(expiresAt),
        ]
      )
    );
    const signature = await account.signMessage({
      message: { raw: digest },
    });

    limits.activeReservationId = limits.activeReservationId ?? "pending";
    limits.activeExpiresAt = expiresAt;
    walletLimits.set(walletKey, limits);

    return NextResponse.json({
      priceCents: quote.priceCents,
      expiresAt,
      signature,
      breakdown: quote.breakdown,
    });
  } catch (err) {
    console.error("Quote error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Quote failed" },
      { status: 500 }
    );
  }
}
