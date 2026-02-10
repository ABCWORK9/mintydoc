CREATE TYPE "PublishJobState" AS ENUM (
  'pending',
  'reserved',
  'storing',
  'finalized',
  'expired',
  'refunded',
  'failed'
);

CREATE TYPE "UploadStatus" AS ENUM (
  'pending',
  'uploading',
  'uploaded',
  'failed'
);

CREATE TABLE "publish_jobs" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "wallet" text NOT NULL,
  "ip" text,
  "sha256" text NOT NULL,
  "size_bytes" integer NOT NULL,
  "object_key" text NOT NULL,
  "upload_id" text,
  "upload_status" "UploadStatus" NOT NULL,
  "reservation_id" text,
  "reserve_tx_hash" text,
  "reserve_confirmed_at" timestamptz,
  "expires_at" timestamptz,
  "arweave_tx_id" text,
  "finalize_tx_hash" text,
  "finalized_at" timestamptz,
  "state" "PublishJobState" NOT NULL,
  "attempts" integer NOT NULL DEFAULT 0,
  "last_error" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "publish_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "publish_jobs_wallet_idx" ON "publish_jobs"("wallet");
CREATE INDEX "publish_jobs_sha256_idx" ON "publish_jobs"("sha256");
CREATE INDEX "publish_jobs_state_idx" ON "publish_jobs"("state");
CREATE INDEX "publish_jobs_reservation_id_idx" ON "publish_jobs"("reservation_id");
