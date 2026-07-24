import type { CreatePlotInput, PlotDto, UpdatePlotInput } from "@garden/shared";
import { IrrigationType } from "@garden/shared";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../utils/errors.js";
import { assertGardenOwnership } from "../gardens/gardens.service.js";

function toDto(plot: {
  id: string;
  gardenId: string;
  name: string;
  description?: string | null;
  areaSqMeters: number;
  soilType: string;
  irrigationType: string;
  latitude?: number | null;
  longitude?: number | null;
  _count: { plants: number; media: number; tasks: number };
  createdAt: Date;
  updatedAt: Date;
}): PlotDto {
  return {
    id: plot.id,
    gardenId: plot.gardenId,
    name: plot.name,
    description: plot.description ?? null,
    areaSqMeters: plot.areaSqMeters,
    soilType: plot.soilType,
    irrigationType: plot.irrigationType as PlotDto["irrigationType"],
    latitude: plot.latitude ?? null,
    longitude: plot.longitude ?? null,
    plantCount: plot._count.plants,
    mediaCount: plot._count.media,
    openTaskCount: plot._count.tasks,
    createdAt: plot.createdAt.toISOString(),
    updatedAt: plot.updatedAt.toISOString(),
  };
}

export async function listPlots(ownerId: string, gardenId: string): Promise<PlotDto[]> {
  await assertGardenOwnership(ownerId, gardenId);
  const plots = await prisma.plot.findMany({
    where: { gardenId },
    include: { _count: { select: { plants: true, media: true, tasks: { where: { isActive: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  return plots.map(toDto);
}

export async function getPlot(ownerId: string, gardenId: string, plotId: string): Promise<PlotDto> {
  await assertGardenOwnership(ownerId, gardenId);
  const plot = await prisma.plot.findFirst({
    where: { id: plotId, gardenId },
    include: { _count: { select: { plants: true, media: true, tasks: { where: { isActive: true } } } } },
  });
  if (!plot) throw new NotFoundError("Plot");
  return toDto(plot);
}

export async function createPlot(ownerId: string, gardenId: string, input: CreatePlotInput): Promise<PlotDto> {
  await assertGardenOwnership(ownerId, gardenId);
  const plot = await prisma.plot.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      areaSqMeters: input.areaSqMeters,
      soilType: input.soilType,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      gardenId,
      irrigationType: input.irrigationType as keyof typeof IrrigationType,
    },
    include: { _count: { select: { plants: true, media: true, tasks: { where: { isActive: true } } } } },
  });
  return toDto(plot);
}

export async function updatePlot(
  ownerId: string,
  gardenId: string,
  plotId: string,
  input: UpdatePlotInput,
): Promise<PlotDto> {
  await getPlot(ownerId, gardenId, plotId);
  // Filter out undefined properties for exactOptionalPropertyTypes compatibility
  const updateData: {
    name?: string;
    description?: string | null;
    areaSqMeters?: number;
    soilType?: string;
    irrigationType?: keyof typeof IrrigationType;
    latitude?: number | null;
    longitude?: number | null;
  } = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.areaSqMeters !== undefined) updateData.areaSqMeters = input.areaSqMeters;
  if (input.soilType !== undefined) updateData.soilType = input.soilType;
  if (input.irrigationType !== undefined) updateData.irrigationType = input.irrigationType as keyof typeof IrrigationType;
  if (input.description !== undefined) updateData.description = input.description || null;
  if (input.latitude !== undefined) updateData.latitude = input.latitude;
  if (input.longitude !== undefined) updateData.longitude = input.longitude;

  const plot = await prisma.plot.update({
    where: { id: plotId },
    data: updateData,
    include: { _count: { select: { plants: true, media: true, tasks: { where: { isActive: true } } } } },
  });
  return toDto(plot);
}

export async function deletePlot(ownerId: string, gardenId: string, plotId: string): Promise<void> {
  await getPlot(ownerId, gardenId, plotId);
  await prisma.plot.delete({ where: { id: plotId } });
}

/** Used by nested resources (plants) to verify a plot belongs to a garden the caller owns. */
export async function assertPlotOwnership(ownerId: string, plotId: string): Promise<{ gardenId: string }> {
  const plot = await prisma.plot.findFirst({
    where: { id: plotId, garden: { ownerId } },
    select: { gardenId: true },
  });
  if (!plot) throw new NotFoundError("Plot");
  return plot;
}
