import type { CreateMediaInput, UpdateMediaInput } from "@garden/shared";
import { MediaType as PrismaMediaType, type Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../utils/errors.js";

export const careTaskMediaService = {
  async create(data: CreateMediaInput & { careTaskId: string }) {
    if (data.isCover) {
      await prisma.careTaskMedia.updateMany({
        where: { careTaskId: data.careTaskId },
        data: { isCover: false },
      });
    }
    return prisma.careTaskMedia.create({
      data: {
        careTaskId: data.careTaskId,
        type: data.type as PrismaMediaType,
        url: data.url,
        caption: data.caption ?? null,
        capturedAt: data.capturedAt ?? new Date(),
        isCover: data.isCover ?? false,
      },
    });
  },

  async findByTaskId(careTaskId: string) {
    return prisma.careTaskMedia.findMany({
      where: { careTaskId },
      orderBy: [{ isCover: "desc" }, { capturedAt: "desc" }],
    });
  },

  async update(id: string, careTaskId: string, data: UpdateMediaInput) {
    const existing = await prisma.careTaskMedia.findFirst({ where: { id, careTaskId } });
    if (!existing) throw new NotFoundError("Media");
    if (data.isCover) {
      await prisma.careTaskMedia.updateMany({
        where: { careTaskId, id: { not: id } },
        data: { isCover: false },
      });
    }
    const updateData: Prisma.CareTaskMediaUpdateInput = {};
    if (data.type !== undefined) updateData.type = data.type as PrismaMediaType;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.caption !== undefined) updateData.caption = data.caption;
    if (data.capturedAt !== undefined) updateData.capturedAt = data.capturedAt;
    if (data.isCover !== undefined) updateData.isCover = data.isCover;
    return prisma.careTaskMedia.update({
      where: { id },
      data: updateData,
    });
  },

  async delete(id: string, careTaskId: string) {
    const existing = await prisma.careTaskMedia.findFirst({ where: { id, careTaskId } });
    if (!existing) throw new NotFoundError("Media");
    await prisma.careTaskMedia.delete({ where: { id } });
  },
};
