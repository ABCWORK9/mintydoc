import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let cachedClient: S3Client | null = null;

function getRegion() {
  return process.env.AWS_REGION ?? "us-east-1";
}

function getCredentials() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) return undefined;
  return { accessKeyId, secretAccessKey };
}

export function createS3Client(): S3Client {
  if (cachedClient) return cachedClient;
  cachedClient = new S3Client({
    region: getRegion(),
    credentials: getCredentials(),
  });
  return cachedClient;
}

type MultipartInitInput = {
  bucket: string;
  key: string;
  contentType?: string;
};

export async function initiateMultipartUpload({
  bucket,
  key,
  contentType,
}: MultipartInitInput): Promise<{ uploadId: string }> {
  try {
    const client = createS3Client();
    const res = await client.send(
      new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      })
    );
    if (!res.UploadId) {
      throw new Error("Missing uploadId");
    }
    return { uploadId: res.UploadId };
  } catch (err) {
    throw new Error(
      `S3 initiateMultipartUpload failed for bucket=${bucket} key=${key}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

type PresignedPartInput = {
  bucket: string;
  key: string;
  uploadId: string;
  partNumber: number;
  expiresInSeconds?: number;
};

export async function getPresignedPartUrl({
  bucket,
  key,
  uploadId,
  partNumber,
  expiresInSeconds = 900,
}: PresignedPartInput): Promise<{ url: string }> {
  if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) {
    throw new Error(`Invalid partNumber: ${partNumber}`);
  }
  const expires = Math.min(Math.max(expiresInSeconds, 60), 3600);
  try {
    const client = createS3Client();
    const command = new UploadPartCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });
    const url = await getSignedUrl(client, command, { expiresIn: expires });
    return { url };
  } catch (err) {
    throw new Error(
      `S3 getPresignedPartUrl failed for bucket=${bucket} key=${key}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

type CompleteMultipartInput = {
  bucket: string;
  key: string;
  uploadId: string;
  parts: Array<{ partNumber: number; etag: string }>;
};

export async function completeMultipartUpload({
  bucket,
  key,
  uploadId,
  parts,
}: CompleteMultipartInput): Promise<{ etag?: string; location?: string }> {
  if (parts.length === 0) {
    throw new Error("Missing parts");
  }
  const seen = new Set<number>();
  for (const part of parts) {
    if (
      !Number.isInteger(part.partNumber) ||
      part.partNumber < 1 ||
      part.partNumber > 10000
    ) {
      throw new Error(`Invalid partNumber: ${part.partNumber}`);
    }
    if (!part.etag || typeof part.etag !== "string") {
      throw new Error("Missing etag");
    }
    if (seen.has(part.partNumber)) {
      throw new Error(`Duplicate partNumber: ${part.partNumber}`);
    }
    seen.add(part.partNumber);
  }
  const sorted = [...parts].sort((a, b) => a.partNumber - b.partNumber);
  try {
    const client = createS3Client();
    const res = await client.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: sorted.map((part) => ({
            ETag: part.etag,
            PartNumber: part.partNumber,
          })),
        },
      })
    );
    return { etag: res.ETag, location: res.Location };
  } catch (err) {
    throw new Error(
      `S3 completeMultipartUpload failed for bucket=${bucket} key=${key}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

type AbortMultipartInput = {
  bucket: string;
  key: string;
  uploadId: string;
};

export async function abortMultipartUpload({
  bucket,
  key,
  uploadId,
}: AbortMultipartInput): Promise<void> {
  try {
    const client = createS3Client();
    await client.send(
      new AbortMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
      })
    );
  } catch (err) {
    throw new Error(
      `S3 abortMultipartUpload failed for bucket=${bucket} key=${key}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

type GetObjectInput = {
  bucket: string;
  key: string;
};

export async function getObjectStream({
  bucket,
  key,
}: GetObjectInput): Promise<{
  stream: NodeJS.ReadableStream;
  contentLength?: number;
  contentType?: string;
}> {
  try {
    const client = createS3Client();
    const res = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    if (!res.Body) {
      throw new Error("Missing body");
    }
    return {
      stream: res.Body as unknown as NodeJS.ReadableStream,
      contentLength: res.ContentLength,
      contentType: res.ContentType,
    };
  } catch (err) {
    throw new Error(
      `S3 getObjectStream failed for bucket=${bucket} key=${key}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}
