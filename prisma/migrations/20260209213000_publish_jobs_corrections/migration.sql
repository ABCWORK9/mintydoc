CREATE TYPE "PublishJobState_new" AS ENUM (
  'awaiting_upload',
  'awaiting_payment',
  'processing',
  'finalized',
  'expired',
  'refunded',
  'failed'
);

CREATE TYPE "UploadStatus_new" AS ENUM (
  'initiated',
  'uploading',
  'uploaded',
  'failed',
  'aborted',
  'expired'
);

ALTER TABLE "publish_jobs"
  ALTER COLUMN "size_bytes" TYPE bigint,
  ALTER COLUMN "object_key" DROP NOT NULL,
  ALTER COLUMN "reservation_id" TYPE bigint USING "reservation_id"::bigint,
  ALTER COLUMN "state" TYPE "PublishJobState_new" USING (
    CASE "state"
      WHEN 'pending' THEN 'awaiting_upload'
      WHEN 'reserved' THEN 'awaiting_payment'
      WHEN 'storing' THEN 'processing'
      WHEN 'finalized' THEN 'finalized'
      WHEN 'expired' THEN 'expired'
      WHEN 'refunded' THEN 'refunded'
      WHEN 'failed' THEN 'failed'
      ELSE 'failed'
    END
  )::"PublishJobState_new",
  ALTER COLUMN "upload_status" TYPE "UploadStatus_new" USING (
    CASE "upload_status"
      WHEN 'pending' THEN 'initiated'
      WHEN 'uploading' THEN 'uploading'
      WHEN 'uploaded' THEN 'uploaded'
      WHEN 'failed' THEN 'failed'
      ELSE 'failed'
    END
  )::"UploadStatus_new";

DROP TYPE "PublishJobState";
ALTER TYPE "PublishJobState_new" RENAME TO "PublishJobState";

DROP TYPE "UploadStatus";
ALTER TYPE "UploadStatus_new" RENAME TO "UploadStatus";

DROP INDEX IF EXISTS "publish_jobs_reservation_id_idx";
CREATE UNIQUE INDEX "publish_jobs_reservation_id_key" ON "publish_jobs"("reservation_id");
