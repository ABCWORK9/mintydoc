import type { Prisma, PublishJob } from "@prisma/client";
import { prisma } from "./client";

export async function createJob(data: Prisma.PublishJobCreateInput): Promise<PublishJob> {
  return prisma.publishJob.create({ data });
}

export async function getJobById(id: string): Promise<PublishJob | null> {
  return prisma.publishJob.findUnique({ where: { id } });
}

export async function updateJob(
  id: string,
  data: Prisma.PublishJobUpdateInput
): Promise<PublishJob> {
  return prisma.publishJob.update({ where: { id }, data });
}

export async function getJobByReservationId(
  reservationId: string
): Promise<PublishJob | null> {
  return prisma.publishJob.findFirst({ where: { reservationId } });
}
