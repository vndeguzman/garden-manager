import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

export const gardenCareGiverService = {
  async addCareGiver(gardenId: string, userId: string) {
    return db.gardenCareGiver.create({
      data: {
        gardenId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  },

  async getCareGivers(gardenId: string) {
    return db.gardenCareGiver.findMany({
      where: { gardenId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getCareGiverById(id: string) {
    return db.gardenCareGiver.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  },

  async removeCareGiver(id: string) {
    try {
      await db.gardenCareGiver.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  },

  async removeCareGiverByGardenAndUser(gardenId: string, userId: string) {
    try {
      await db.gardenCareGiver.deleteMany({
        where: {
          gardenId,
          userId,
        },
      });
      return true;
    } catch {
      return false;
    }
  },
};
