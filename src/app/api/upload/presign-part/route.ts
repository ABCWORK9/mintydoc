import { NextResponse } from "next/server";
import { getJobById, updateJob } from "@/server/db/publishJobs";
import { getPresignedPartUrl } from "@/server/storage/s3";

type PresignBody = {
  jobId: string;
  partNumber: number;
  expiresInSeconds?: number;
};

const TERMINAL_STATES = new Set(["failed", "finalized", "expired", "refunded"]);

export async function POST(req: Request) {
  try {
    let body: PresignBody;
    try {
      body = (await req.json()) as PresignBody;
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const jobId = body?.jobId?.trim();
    if (!jobId) {
      return NextResponse.json({ error: "invalid_jobId" }, { status: 400 });
    }

    const partNumber = body?.partNumber;
    if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) {
      return NextResponse.json(
        { error: "invalid_partNumber" },
        { status: 400 }
      );
    }

    let expiresInSeconds: number | undefined;
    if (body?.expiresInSeconds !== undefined) {
      if (!Number.isInteger(body.expiresInSeconds)) {
        return NextResponse.json(
          { error: "invalid_expiresInSeconds" },
          { status: 400 }
        );
      }
      expiresInSeconds = Math.min(Math.max(body.expiresInSeconds, 60), 3600);
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
      return NextResponse.json({ error: "job_not_uploadable" }, { status: 409 });
    }

    const { url } = await getPresignedPartUrl({
      bucket,
      key: job.objectKey,
      uploadId: job.uploadId,
      partNumber,
      expiresInSeconds,
    });

    if (job.uploadStatus === "initiated") {
      await updateJob(job.id, { uploadStatus: "uploading" });
    }

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "presign_failed" }, { status: 500 });
  }
}
