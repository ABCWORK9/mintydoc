import type { PublishJob } from "@prisma/client";
import { prisma } from "./client";

type CreateJobInput = {
  wallet: string;
  sha256: string;
  sizeBytes: bigint;
  ip?: string | null;
};

export async function createJob(input: CreateJobInput): Promise<PublishJob> {
  return prisma.publishJob.create({
    data: {
      wallet: input.wallet,
      sha256: input.sha256,
      sizeBytes: input.sizeBytes,
      ip: input.ip ?? null,
      state: "awaiting_upload",
      uploadStatus: "initiated",
      attempts: 0,
    },
  });
}

export async function updateJob(
  id: string,
  data: Parameters<typeof prisma.publishJob.update>[0]["data"]
): Promise<PublishJob> {
  return prisma.publishJob.update({ where: { id }, data });
}

export async function getJobById(id: string): Promise<PublishJob | null> {
  return prisma.publishJob.findUnique({ where: { id } });
}

export async function getJobByReservationId(
  reservationId: bigint
): Promise<PublishJob | null> {
  return prisma.publishJob.findFirst({ where: { reservationId } });
}
