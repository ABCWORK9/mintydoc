import { NextResponse } from "next/server";
import { getJobById } from "@/server/db/publishJobs";
import { PRICING } from "@/lib/pricing";
import { keccak256, encodePacked } from "viem";
import { privateKeyToAccount } from "viem/accounts";

type IntentBody = {
  jobId: string;
};

async function getArweavePriceWinston(sizeBytes: number) {
  const base = process.env.ARWEAVE_PRICE_URL ?? "https://arweave.net/price";
  const res = await fetch(`${base}/${sizeBytes}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch Arweave price");
  const text = await res.text();
  return BigInt(text);
}

let cachedArUsd: { value: number; ts: number } | null = null;

async function getArUsd() {
  const now = Date.now();
  if (cachedArUsd && now - cachedArUsd.ts < 30 * 60 * 1000) {
    return cachedArUsd.value;
  }
  const url =
    process.env.AR_USD_PRICE_URL ??
    "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd";
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch AR price");
    const data = await res.json();
    const usd = data?.arweave?.usd;
    if (!usd || typeof usd !== "number") {
      throw new Error("Invalid AR price");
    }
    cachedArUsd = { value: usd, ts: now };
    return usd as number;
  } catch (err) {
    const fallback = process.env.AR_USD_FALLBACK;
    if (fallback) {
      const parsed = Number(fallback);
      if (!Number.isNaN(parsed) && parsed > 0) {
        cachedArUsd = { value: parsed, ts: now };
        return parsed;
      }
    }
    throw err;
  }
}

function toCents(usd: number) {
  return Math.ceil(usd * 100);
}

function generateNonce() {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  let hex = "0x";
  for (const b of buf) {
    hex += b.toString(16).padStart(2, "0");
  }
  return hex;
}

export async function POST(req: Request) {
  try {
    let body: IntentBody;
    try {
      body = (await req.json()) as IntentBody;
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const jobId = body?.jobId?.trim();
    if (!jobId) {
      return NextResponse.json({ error: "invalid_jobId" }, { status: 400 });
    }

    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "job_not_found" }, { status: 404 });
    }

    if (job.uploadStatus !== "uploaded" || job.state !== "awaiting_payment") {
      return NextResponse.json(
        { error: "job_not_ready_for_reserve" },
        { status: 409 }
      );
    }

    if (!job.sha256 || !job.sizeBytes) {
      return NextResponse.json(
        { error: "server_inconsistent_state" },
        { status: 500 }
      );
    }

    const chainId = Number(process.env.CHAIN_ID ?? 0);
    const contractAddress = process.env.DOC_PAY_GO_ADDRESS;
    const signerKey = process.env.SIGNER_PRIVATE_KEY;
    if (!chainId || !contractAddress || !signerKey) {
      return NextResponse.json(
        { error: "server_misconfigured" },
        { status: 500 }
      );
    }

    const sizeBytes = Number(job.sizeBytes);
    const winston = await getArweavePriceWinston(sizeBytes);
    const arUsd = await getArUsd();
    const arCost = Number(winston) / 1e12;
    const arweaveUsd = arCost * arUsd;
    const arweaveCents = toCents(arweaveUsd);

    const rawCents = PRICING.baseFeeCents + arweaveCents;
    const totalCents = rawCents * PRICING.markupMultiplier;
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;
    const nonce = generateNonce();

    const account = privateKeyToAccount(signerKey as `0x${string}`);
    const digest = keccak256(
      encodePacked(
        ["address", "address", "uint64", "uint32", "uint40", "uint256"],
        [
          contractAddress as `0x${string}`,
          job.wallet as `0x${string}`,
          BigInt(sizeBytes),
          BigInt(totalCents),
          BigInt(expiresAt),
          BigInt(nonce),
        ]
      )
    );
    const signature = await account.signMessage({ message: { raw: digest } });

    return NextResponse.json({
      chainId,
      contractAddress,
      functionName: "reservePost",
      args: [
        sizeBytes,
        totalCents,
        expiresAt,
        nonce,
        signature,
      ],
      value: "0",
    });
  } catch {
    return NextResponse.json({ error: "intent_failed" }, { status: 500 });
  }
}
