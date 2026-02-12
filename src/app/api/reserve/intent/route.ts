import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { keccak256, encodePacked } from "viem";
import { getJobById, updateJob } from "@/server/db/publishJobs";
import { getPriceQuote } from "@/server/pricing/policy";
import { signReserveDigest } from "@/server/signer/localSigner";

type IntentBody = {
  jobId: string;
  payer: `0x${string}`;
};

const EXPIRES_IN_SECONDS = 10 * 60;

function isHexAddress(value: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
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

    const payerRaw = body?.payer;
    if (!payerRaw?.trim() || !isHexAddress(payerRaw)) {
      return NextResponse.json({ error: "invalid_payer" }, { status: 400 });
    }
    const payer = payerRaw.toLowerCase() as `0x${string}`;

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
    const contractAddress = process.env.DOC_PAY_GO_ADDRESS as
      | `0x${string}`
      | undefined;
    if (!chainId || !contractAddress) {
      return NextResponse.json(
        { error: "server_misconfigured" },
        { status: 500 }
      );
    }

    if (job.reservePayer && job.reservePayer.toLowerCase() !== payer) {
      return NextResponse.json(
        { code: "reserve_payer_mismatch" },
        { status: 409 }
      );
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const existingExpiresAt = job.reserveExpiresAt
      ? Number(job.reserveExpiresAt)
      : null;
    const hasValidQuote =
      job.reservePriceCents !== null &&
      job.reserveNonce &&
      existingExpiresAt !== null &&
      nowSec <= existingExpiresAt;

    let priceCents = job.reservePriceCents ?? null;
    let expiresAt = existingExpiresAt ?? null;
    let nonceHex = job.reserveNonce ?? null;

    if (!hasValidQuote) {
      const quote = await getPriceQuote({ sizeBytes: Number(job.sizeBytes) });
      priceCents = quote.priceCents;
      expiresAt = nowSec + EXPIRES_IN_SECONDS;
      nonceHex = `0x${randomBytes(32).toString("hex")}`;

      await updateJob(job.id, {
        reservePayer: payer,
        reservePriceCents: priceCents,
        reserveExpiresAt: BigInt(expiresAt),
        reserveNonce: nonceHex,
        reserveIntentCreatedAt: new Date(),
      });
    } else if (!job.reservePayer) {
      await updateJob(job.id, { reservePayer: payer });
    }

    if (priceCents === null || expiresAt === null || !nonceHex) {
      return NextResponse.json(
        { error: "server_inconsistent_state" },
        { status: 500 }
      );
    }

    if (!job.sizeBytes) {
      return NextResponse.json(
        { error: "server_inconsistent_state" },
        { status: 500 }
      );
    }

    const nonceBigInt = BigInt(nonceHex);
    const sizeBytesBigInt = BigInt(job.sizeBytes);
    const maxUint64 = (1n << 64n) - 1n;
    const maxUint32 = 0xffffffff;
    const maxUint40 = Number((1n << 40n) - 1n);

    if (sizeBytesBigInt <= 0n || sizeBytesBigInt > maxUint64) {
      return NextResponse.json(
        { error: "quote_out_of_range" },
        { status: 500 }
      );
    }
    if (priceCents <= 0 || priceCents > maxUint32) {
      return NextResponse.json(
        { error: "quote_out_of_range" },
        { status: 500 }
      );
    }
    if (expiresAt <= 0 || expiresAt > maxUint40) {
      return NextResponse.json(
        { error: "quote_out_of_range" },
        { status: 500 }
      );
    }

    const reservationId = keccak256(
      encodePacked(
        ["address", "address", "uint64", "uint32", "uint40", "uint256"],
        [
          contractAddress,
          payer,
          sizeBytesBigInt,
          BigInt(priceCents),
          BigInt(expiresAt),
          nonceBigInt,
        ]
      )
    );

    if (job.reserveReservationId && job.reserveReservationId !== reservationId) {
      return NextResponse.json(
        { code: "reserve_reservation_id_mismatch" },
        { status: 409 }
      );
    }

    if (!job.reserveReservationId) {
      await updateJob(job.id, { reserveReservationId: reservationId });
    }

    const signature = await signReserveDigest({
      contractAddress,
      payer,
      sizeBytes: sizeBytesBigInt,
      priceCents,
      expiresAt,
      nonce: nonceBigInt,
    });

    const nonceDecimal = nonceBigInt.toString();

    return NextResponse.json({
      chainId,
      contractAddress,
      functionName: "reservePost",
      args: [
        sizeBytesBigInt.toString(),
        priceCents,
        String(expiresAt),
        nonceDecimal,
        signature,
      ],
      value: "0",
    });
  } catch {
    return NextResponse.json({ error: "intent_failed" }, { status: 500 });
  }
}
