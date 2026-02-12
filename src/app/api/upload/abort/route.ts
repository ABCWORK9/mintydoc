import { NextResponse } from "next/server";
import { getJobById, updateJob } from "@/server/db/publishJobs";
import { abortMultipartUpload } from "@/server/storage/s3";

type AbortBody = {
  jobId: string;
};

const NON_ABORTABLE_STATES = new Set(["finalized", "refunded", "expired"]);

export async function POST(req: Request) {
  try {
    let body: AbortBody;
    try {
      body = (await req.json()) as AbortBody;
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const jobId = body?.jobId?.trim();
    if (!jobId) {
      return NextResponse.json({ error: "invalid_jobId" }, { status: 400 });
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

    if (NON_ABORTABLE_STATES.has(job.state)) {
      return NextResponse.json(
        { error: "job_not_abortable" },
        { status: 409 }
      );
    }

    if (job.uploadStatus === "uploaded") {
      return NextResponse.json(
        { error: "job_not_abortable" },
        { status: 409 }
      );
    }

    try {
      await abortMultipartUpload({
        bucket,
        key: job.objectKey,
        uploadId: job.uploadId,
      });

      await updateJob(job.id, {
        uploadStatus: "aborted",
        state: "failed",
        lastError: "aborted_by_user",
      });

      return NextResponse.json({ ok: true });
    } catch (err) {
      await updateJob(job.id, {
        state: "failed",
        uploadStatus: "failed",
        lastError: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json({ error: "abort_failed" }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: "abort_failed" }, { status: 500 });
  }
}
