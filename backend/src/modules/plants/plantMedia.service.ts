import type { CreateMediaInput, UpdateMediaInput } from "@garden/shared";
import { MediaType as PrismaMediaType, type Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../utils/errors.js";

export async function listPlantMedia(plantId: string) {
  return prisma.plantMedia.findMany({
    where: { plantId },
    orderBy: [{ isCover: "desc" }, { capturedAt: "desc" }],
  });
}

export async function createPlantMedia(plantId: string, input: CreateMediaInput) {
  if (input.isCover) {
    await prisma.plantMedia.updateMany({ where: { plantId }, data: { isCover: false } });
  }
  return prisma.plantMedia.create({
    data: {
      plantId,
      type: input.type as PrismaMediaType,
      url: input.url,
      caption: input.caption ?? null,
      capturedAt: input.capturedAt ?? new Date(),
      isCover: input.isCover ?? false,
    },
  });
}

export async function updatePlantMedia(
  plantId: string,
  mediaId: string,
  input: UpdateMediaInput,
) {
  const existing = await prisma.plantMedia.findFirst({ where: { id: mediaId, plantId } });
  if (!existing) throw new NotFoundError("Media");
  if (input.isCover) {
    await prisma.plantMedia.updateMany({
      where: { plantId, id: { not: mediaId } },
      data: { isCover: false },
    });
  }
  const data: Prisma.PlantMediaUpdateInput = {};
  if (input.type !== undefined) data.type = input.type as PrismaMediaType;
  if (input.url !== undefined) data.url = input.url;
  if (input.caption !== undefined) data.caption = input.caption;
  if (input.capturedAt !== undefined) data.capturedAt = input.capturedAt;
  if (input.isCover !== undefined) data.isCover = input.isCover;
  return prisma.plantMedia.update({ where: { id: mediaId }, data });
}

export async function deletePlantMedia(plantId: string, mediaId: string): Promise<void> {
  const existing = await prisma.plantMedia.findFirst({ where: { id: mediaId, plantId } });
  if (!existing) throw new NotFoundError("Media");
  await prisma.plantMedia.delete({ where: { id: mediaId } });
}
