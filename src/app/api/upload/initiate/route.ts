import { NextResponse } from "next/server";
import { createJob, updateJob } from "@/server/db/publishJobs";
import { initiateMultipartUpload } from "@/server/storage/s3";

type InitiateBody = {
  wallet: string;
  sha256: string;
  sizeBytes: string;
  contentType?: string;
};

const SHA256_RE = /^[0-9a-f]{64}$/;

export async function POST(req: Request) {
  let jobId: string | null = null;
  try {
    let body: InitiateBody;
    try {
      body = (await req.json()) as InitiateBody;
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }
    const wallet = body?.wallet?.trim().toLowerCase();
    if (!wallet) {
      return NextResponse.json({ error: "invalid_wallet" }, { status: 400 });
    }

    const sha256 = body?.sha256?.trim().toLowerCase();
    if (!sha256 || !SHA256_RE.test(sha256)) {
      return NextResponse.json({ error: "invalid_sha256" }, { status: 400 });
    }

    const sizeBytesRaw = body?.sizeBytes?.trim();
    if (!sizeBytesRaw) {
      return NextResponse.json({ error: "invalid_sizeBytes" }, { status: 400 });
    }
    let sizeBytes: bigint;
    try {
      sizeBytes = BigInt(sizeBytesRaw);
    } catch {
      return NextResponse.json({ error: "invalid_sizeBytes" }, { status: 400 });
    }
    if (sizeBytes <= 0n) {
      return NextResponse.json({ error: "invalid_sizeBytes" }, { status: 400 });
    }

    const contentType = body?.contentType?.trim();
    if (contentType && contentType.length > 200) {
      return NextResponse.json(
        { error: "invalid_contentType" },
        { status: 400 }
      );
    }

    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      return NextResponse.json(
        { error: "server_misconfigured" },
        { status: 500 }
      );
    }

    const job = await createJob({ wallet, sha256, sizeBytes, ip: null });
    jobId = job.id;
    const key = `uploads/${job.id}/${sha256}`;
    await updateJob(job.id, { objectKey: key });

    try {
      const { uploadId } = await initiateMultipartUpload({
        bucket,
        key,
        contentType,
      });
      await updateJob(job.id, {
        objectKey: key,
        uploadId,
        uploadStatus: "initiated",
      });

      return NextResponse.json({
        jobId: job.id,
        key,
        uploadId,
      });
    } catch (err) {
      await updateJob(job.id, {
        state: "failed",
        uploadStatus: "failed",
        lastError: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json({ error: "upload_initiation_failed" }, { status: 500 });
    }
  } catch (err) {
    if (jobId) {
      await updateJob(jobId, {
        state: "failed",
        uploadStatus: "failed",
        lastError: err instanceof Error ? err.message : String(err),
      });
    }
    return NextResponse.json(
      { error: "initiate_failed" },
      { status: 500 }
    );
  }
}
