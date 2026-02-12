import { NextResponse } from "next/server";
import { getJobById, updateJob } from "@/server/db/publishJobs";
import { completeMultipartUpload } from "@/server/storage/s3";

type CompleteBody = {
  jobId: string;
  parts: Array<{ partNumber: number; etag: string }>;
};

const TERMINAL_STATES = new Set(["failed", "finalized", "expired", "refunded"]);

export async function POST(req: Request) {
  try {
    let body: CompleteBody;
    try {
      body = (await req.json()) as CompleteBody;
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const jobId = body?.jobId?.trim();
    if (!jobId) {
      return NextResponse.json({ error: "invalid_jobId" }, { status: 400 });
    }

    if (!Array.isArray(body?.parts) || body.parts.length === 0) {
      return NextResponse.json({ error: "invalid_parts" }, { status: 400 });
    }

    const seen = new Set<number>();
    for (const part of body.parts) {
      if (
        !Number.isInteger(part?.partNumber) ||
        part.partNumber < 1 ||
        part.partNumber > 10000
      ) {
        return NextResponse.json({ error: "invalid_parts" }, { status: 400 });
      }
      if (!part?.etag || typeof part.etag !== "string") {
        return NextResponse.json({ error: "invalid_parts" }, { status: 400 });
      }
      if (seen.has(part.partNumber)) {
        return NextResponse.json({ error: "invalid_parts" }, { status: 400 });
      }
      seen.add(part.partNumber);
    }

    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      return NextResponse.json(
        { error: "server_misconfigured" },
        { status: 500 }
      );
    }

    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "job_not_found" }, { status: 404 });
    }

    if (!job.objectKey) {
      return NextResponse.json(
        { error: "job_missing_objectKey" },
        { status: 409 }
      );
    }

    if (!job.uploadId) {
      return NextResponse.json(
        { error: "job_missing_uploadId" },
        { status: 409 }
      );
    }

    if (TERMINAL_STATES.has(job.state)) {
      return NextResponse.json(
        { error: "job_not_completable" },
        { status: 409 }
      );
    }

    try {
      await completeMultipartUpload({
        bucket,
        key: job.objectKey,
        uploadId: job.uploadId,
        parts: body.parts,
      });

      await updateJob(job.id, {
        uploadStatus: "uploaded",
        state: "awaiting_payment",
        lastError: null,
      });

      return NextResponse.json({ ok: true });
    } catch (err) {
      await updateJob(job.id, {
        state: "failed",
        uploadStatus: "failed",
        lastError: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json({ error: "complete_failed" }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: "complete_failed" }, { status: 500 });
  }
}
