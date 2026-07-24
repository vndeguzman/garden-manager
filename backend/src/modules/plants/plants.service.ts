import type { CreatePlantInput, PlantDto, UpdatePlantInput } from "@garden/shared";
import { PlantStatus } from "@garden/shared";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../utils/errors.js";
import { assertPlotOwnership } from "../plots/plots.service.js";

function toDto(plant: {
  id: string;
  plotId: string;
  plantingId: string | null;
  species: string;
  scientificName: string | null;
  variety: string | null;
  plantedAt: Date;
  status: string;
  positionLabel: string | null;
  careNotes: string | null;
  waterRequirement: string | null;
  sunlightRequirement: string | null;
  spacingCm: number | null;
  expectedYieldKg: number | null;
  actualYieldKg: number;
  expectedHarvestAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { careTasks: number; media: number };
}): PlantDto {
  const ageDays = Math.max(0, Math.floor((Date.now() - plant.plantedAt.getTime()) / 86_400_000));
  return {
    id: plant.id,
    plotId: plant.plotId,
    plantingId: plant.plantingId,
    species: plant.species,
    scientificName: plant.scientificName,
    variety: plant.variety,
    plantedAt: plant.plantedAt.toISOString(),
    status: plant.status as PlantDto["status"],
    positionLabel: plant.positionLabel,
    careNotes: plant.careNotes,
    waterRequirement: plant.waterRequirement,
    sunlightRequirement: plant.sunlightRequirement,
    spacingCm: plant.spacingCm,
    expectedYieldKg: plant.expectedYieldKg,
    actualYieldKg: plant.actualYieldKg,
    expectedHarvestAt: plant.expectedHarvestAt?.toISOString() ?? null,
    ageDays,
    openTaskCount: plant._count.careTasks,
    mediaCount: plant._count.media,
    createdAt: plant.createdAt.toISOString(),
    updatedAt: plant.updatedAt.toISOString(),
  };
}

const counts = {
  careTasks: { where: { isActive: true } },
  media: true,
} as const;

async function assertPlantingMatchesPlot(plantingId: string, plotId: string): Promise<void> {
  const planting = await prisma.planting.findFirst({
    where: { id: plantingId, plotId },
    select: { id: true },
  });
  if (!planting) throw new NotFoundError("Planting in this plot");
}

export async function listPlants(ownerId: string, plotId: string): Promise<PlantDto[]> {
  await assertPlotOwnership(ownerId, plotId);
  const plants = await prisma.plant.findMany({
    where: { plotId },
    include: { _count: { select: counts } },
    orderBy: { createdAt: "asc" },
  });
  return plants.map(toDto);
}

export async function getPlant(ownerId: string, plotId: string, plantId: string): Promise<PlantDto> {
  await assertPlotOwnership(ownerId, plotId);
  const plant = await prisma.plant.findFirst({
    where: { id: plantId, plotId },
    include: { _count: { select: counts } },
  });
  if (!plant) throw new NotFoundError("Plant");
  return toDto(plant);
}

export async function createPlant(ownerId: string, plotId: string, input: CreatePlantInput): Promise<PlantDto> {
  await assertPlotOwnership(ownerId, plotId);
  if (input.plantingId) await assertPlantingMatchesPlot(input.plantingId, plotId);
  // Build create data, explicitly handling optional fields
  const createData = {
    plotId,
    plantingId: input.plantingId ?? null,
    species: input.species,
    plantedAt: input.plantedAt,
    status: input.status as keyof typeof PlantStatus,
    variety: input.variety ?? null,
    scientificName: input.scientificName ?? null,
    positionLabel: input.positionLabel ?? null,
    careNotes: input.careNotes ?? null,
    waterRequirement: input.waterRequirement ?? null,
    sunlightRequirement: input.sunlightRequirement ?? null,
    spacingCm: input.spacingCm ?? null,
    expectedYieldKg: input.expectedYieldKg ?? null,
    actualYieldKg: input.actualYieldKg ?? 0,
    expectedHarvestAt: input.expectedHarvestAt ?? null,
  };

  const plant = await prisma.plant.create({
    data: createData,
    include: { _count: { select: counts } },
  });
  return toDto(plant);
}

export async function updatePlant(
  ownerId: string,
  plotId: string,
  plantId: string,
  input: UpdatePlantInput,
): Promise<PlantDto> {
  await getPlant(ownerId, plotId, plantId);
  if (input.plantingId) await assertPlantingMatchesPlot(input.plantingId, plotId);
  // Filter out undefined properties for exactOptionalPropertyTypes compatibility
  const updateData: {
    status?: keyof typeof PlantStatus;
    species?: string;
    scientificName?: string | null;
    variety?: string | null;
    plantedAt?: Date;
    positionLabel?: string | null;
    careNotes?: string | null;
    waterRequirement?: string | null;
    sunlightRequirement?: string | null;
    spacingCm?: number | null;
    expectedYieldKg?: number | null;
    actualYieldKg?: number;
    expectedHarvestAt?: Date | null;
    plantingId?: string | null;
  } = {};
  if (input.status !== undefined) updateData.status = input.status as keyof typeof PlantStatus;
  if (input.species !== undefined) updateData.species = input.species;
  if (input.variety !== undefined) updateData.variety = input.variety ?? null;
  if (input.plantedAt !== undefined) updateData.plantedAt = input.plantedAt;
  if (input.scientificName !== undefined) updateData.scientificName = input.scientificName || null;
  if (input.positionLabel !== undefined) updateData.positionLabel = input.positionLabel || null;
  if (input.careNotes !== undefined) updateData.careNotes = input.careNotes || null;
  if (input.waterRequirement !== undefined) updateData.waterRequirement = input.waterRequirement || null;
  if (input.sunlightRequirement !== undefined) updateData.sunlightRequirement = input.sunlightRequirement || null;
  if (input.spacingCm !== undefined) updateData.spacingCm = input.spacingCm;
  if (input.expectedYieldKg !== undefined) updateData.expectedYieldKg = input.expectedYieldKg;
  if (input.actualYieldKg !== undefined) updateData.actualYieldKg = input.actualYieldKg;
  if (input.expectedHarvestAt !== undefined) updateData.expectedHarvestAt = input.expectedHarvestAt;
  if (input.plantingId !== undefined) updateData.plantingId = input.plantingId;

  const plant = await prisma.plant.update({
    where: { id: plantId },
    data: updateData,
    include: { _count: { select: counts } },
  });
  return toDto(plant);
}

export async function deletePlant(ownerId: string, plotId: string, plantId: string): Promise<void> {
  await getPlant(ownerId, plotId, plantId);
  await prisma.plant.delete({ where: { id: plantId } });
}

/** Used by nested resources (care tasks, observations) to verify a plant belongs to the caller. */
export async function assertPlantOwnership(ownerId: string, plantId: string): Promise<void> {
  const plant = await prisma.plant.findFirst({
    where: { id: plantId, plot: { garden: { ownerId } } },
    select: { id: true },
  });
  if (!plant) throw new NotFoundError("Plant");
}
