import type { CreateGardenInput, GardenDto, UpdateGardenInput } from "@garden/shared";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../utils/errors.js";

function toDto(garden: {
  id: string;
  name: string;
  location: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { plots: number };
}): GardenDto {
  return {
    id: garden.id,
    name: garden.name,
    location: garden.location,
    description: garden.description,
    latitude: garden.latitude,
    longitude: garden.longitude,
    ownerId: garden.ownerId,
    plotCount: garden._count.plots,
    createdAt: garden.createdAt.toISOString(),
    updatedAt: garden.updatedAt.toISOString(),
  };
}

export async function listGardens(ownerId: string): Promise<GardenDto[]> {
  const gardens = await prisma.garden.findMany({
    where: { ownerId },
    include: { _count: { select: { plots: true } } },
    orderBy: { createdAt: "desc" },
  });
  return gardens.map(toDto);
}

export async function getGarden(ownerId: string, gardenId: string): Promise<GardenDto> {
  const garden = await prisma.garden.findFirst({
    where: { id: gardenId, ownerId },
    include: { _count: { select: { plots: true } } },
  });
  if (!garden) throw new NotFoundError("Garden");
  return toDto(garden);
}

export async function createGarden(ownerId: string, input: CreateGardenInput): Promise<GardenDto> {
  const garden = await prisma.garden.create({
    data: {
      name: input.name,
      location: input.location,
      description: input.description ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      ownerId,
    },
    include: { _count: { select: { plots: true } } },
  });
  return toDto(garden);
}

export async function updateGarden(
  ownerId: string,
  gardenId: string,
  input: UpdateGardenInput,
): Promise<GardenDto> {
  await getGarden(ownerId, gardenId); // throws NotFoundError if missing/not owned
  // Filter out undefined properties for exactOptionalPropertyTypes compatibility
  const updateData: {
    name?: string;
    location?: string;
    description?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.location !== undefined) updateData.location = input.location;
  if (input.description !== undefined) updateData.description = input.description || null;
  if (input.latitude !== undefined) updateData.latitude = input.latitude;
  if (input.longitude !== undefined) updateData.longitude = input.longitude;

  const garden = await prisma.garden.update({
    where: { id: gardenId },
    data: updateData,
    include: { _count: { select: { plots: true } } },
  });
  return toDto(garden);
}

export async function deleteGarden(ownerId: string, gardenId: string): Promise<void> {
  await getGarden(ownerId, gardenId);
  await prisma.garden.delete({ where: { id: gardenId } });
}

/** Used by nested resources (plots, plants, tasks) to verify a garden belongs to the caller. */
export async function assertGardenOwnership(ownerId: string, gardenId: string): Promise<void> {
  const garden = await prisma.garden.findFirst({ where: { id: gardenId, ownerId }, select: { id: true } });
  if (!garden) throw new NotFoundError("Garden");
}
