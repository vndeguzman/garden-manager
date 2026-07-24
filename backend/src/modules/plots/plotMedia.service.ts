import type { CreateMediaInput, UpdateMediaInput } from "@garden/shared";
import { MediaType as PrismaMediaType, type Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../utils/errors.js";

export async function listPlotMedia(plotId: string) {
  return prisma.plotMedia.findMany({
    where: { plotId },
    orderBy: [{ isCover: "desc" }, { capturedAt: "desc" }],
  });
}

export async function createPlotMedia(plotId: string, input: CreateMediaInput) {
  if (input.isCover) {
    await prisma.plotMedia.updateMany({ where: { plotId }, data: { isCover: false } });
  }
  return prisma.plotMedia.create({
    data: {
      plotId,
      type: input.type as PrismaMediaType,
      url: input.url,
      caption: input.caption ?? null,
      capturedAt: input.capturedAt ?? new Date(),
      isCover: input.isCover ?? false,
    },
  });
}

export async function updatePlotMedia(
  plotId: string,
  mediaId: string,
  input: UpdateMediaInput,
) {
  const existing = await prisma.plotMedia.findFirst({ where: { id: mediaId, plotId } });
  if (!existing) throw new NotFoundError("Media");
  if (input.isCover) {
    await prisma.plotMedia.updateMany({
      where: { plotId, id: { not: mediaId } },
      data: { isCover: false },
    });
  }
  const data: Prisma.PlotMediaUpdateInput = {};
  if (input.type !== undefined) data.type = input.type as PrismaMediaType;
  if (input.url !== undefined) data.url = input.url;
  if (input.caption !== undefined) data.caption = input.caption;
  if (input.capturedAt !== undefined) data.capturedAt = input.capturedAt;
  if (input.isCover !== undefined) data.isCover = input.isCover;
  return prisma.plotMedia.update({ where: { id: mediaId }, data });
}

export async function deletePlotMedia(plotId: string, mediaId: string): Promise<void> {
  const existing = await prisma.plotMedia.findFirst({ where: { id: mediaId, plotId } });
  if (!existing) throw new NotFoundError("Media");
  await prisma.plotMedia.delete({ where: { id: mediaId } });
}
