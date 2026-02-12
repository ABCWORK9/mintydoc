ALTER TABLE "publish_jobs"
  ADD COLUMN "reserve_payer" TEXT,
  ADD COLUMN "reserve_nonce" VARCHAR(66),
  ADD COLUMN "reserve_expires_at" BIGINT,
  ADD COLUMN "reserve_price_cents" INTEGER,
  ADD COLUMN "reserve_signature" TEXT,
  ADD COLUMN "reserve_reservation_id" VARCHAR(66),
  ADD COLUMN "reserve_intent_created_at" TIMESTAMPTZ;

CREATE INDEX "publish_jobs_reserve_payer_idx" ON "publish_jobs" ("reserve_payer");
CREATE INDEX "publish_jobs_reserve_reservation_id_idx" ON "publish_jobs" ("reserve_reservation_id");
CREATE INDEX "publish_jobs_reserve_payer_reserve_expires_at_idx" ON "publish_jobs" ("reserve_payer", "reserve_expires_at");
