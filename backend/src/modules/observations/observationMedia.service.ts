import type { CreateMediaInput, UpdateMediaInput } from "@garden/shared";
import { MediaType as PrismaMediaType, type Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../utils/errors.js";

export const observationMediaService = {
  async create(data: CreateMediaInput & { observationId: string }) {
    if (data.isCover) {
      await prisma.observationMedia.updateMany({
        where: { observationId: data.observationId },
        data: { isCover: false },
      });
    }
    return prisma.observationMedia.create({
      data: {
        observationId: data.observationId,
        type: data.type as PrismaMediaType,
        url: data.url,
        caption: data.caption ?? null,
        capturedAt: data.capturedAt ?? new Date(),
        isCover: data.isCover ?? false,
      },
    });
  },

  async findByObservationId(observationId: string) {
    return prisma.observationMedia.findMany({
      where: { observationId },
      orderBy: [{ isCover: "desc" }, { capturedAt: "desc" }],
    });
  },

  async update(id: string, observationId: string, data: UpdateMediaInput) {
    const existing = await prisma.observationMedia.findFirst({ where: { id, observationId } });
    if (!existing) throw new NotFoundError("Media");
    if (data.isCover) {
      await prisma.observationMedia.updateMany({
        where: { observationId, id: { not: id } },
        data: { isCover: false },
      });
    }
    const updateData: Prisma.ObservationMediaUpdateInput = {};
    if (data.type !== undefined) updateData.type = data.type as PrismaMediaType;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.caption !== undefined) updateData.caption = data.caption;
    if (data.capturedAt !== undefined) updateData.capturedAt = data.capturedAt;
    if (data.isCover !== undefined) updateData.isCover = data.isCover;
    return prisma.observationMedia.update({
      where: { id },
      data: updateData,
    });
  },

  async delete(id: string, observationId: string) {
    const existing = await prisma.observationMedia.findFirst({ where: { id, observationId } });
    if (!existing) throw new NotFoundError("Media");
    await prisma.observationMedia.delete({ where: { id } });
  },
};
