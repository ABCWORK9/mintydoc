import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getJobById, updateJob } from "@/server/db/publishJobs";
import { getPriceQuote } from "@/server/pricing/policy";

type IntentBody = {
  jobId: string;
};

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

    const nowSec = Math.floor(Date.now() / 1000);
    const existingExpiresAt = job.reserveExpiresAt
      ? Number(job.reserveExpiresAt)
      : null;
    const hasValidQuote =
      job.reservePriceCents !== null &&
      job.reserveNonce &&
      existingExpiresAt !== null &&
      nowSec <= existingExpiresAt;

    if (!hasValidQuote) {
      const quote = await getPriceQuote({ sizeBytes: Number(job.sizeBytes) });
      const expiresAt = nowSec + 10 * 60;
      const nonce = `0x${randomBytes(32).toString("hex")}`;

      await updateJob(job.id, {
        reservePriceCents: quote.priceCents,
        reserveExpiresAt: BigInt(expiresAt),
        reserveNonce: nonce,
        reserveIntentCreatedAt: new Date(),
      });
    }

    return NextResponse.json(
      { code: "reserve_args_unavailable" },
      { status: 409 }
    );
  } catch {
    return NextResponse.json({ error: "intent_failed" }, { status: 500 });
  }
}
