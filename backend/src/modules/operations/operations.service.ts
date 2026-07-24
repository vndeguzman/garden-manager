import { Prisma, type ScopeType } from "@prisma/client";
import type { GardenWorkspaceDto, PlantDto, PlotDto } from "@garden/shared";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ValidationError } from "../../utils/errors.js";
import { refreshGardenIncidents } from "./triage.service.js";

export function serialize<T>(value: unknown): T {
  return JSON.parse(
    JSON.stringify(value, (_key, item: unknown) => {
      if (item instanceof Prisma.Decimal) return Number(item);
      return item;
    }),
  ) as T;
}

export async function assertGardenAccess(userId: string, gardenId: string): Promise<void> {
  const garden = await prisma.garden.findFirst({
    where: {
      id: gardenId,
      OR: [{ ownerId: userId }, { careGivers: { some: { userId } } }],
    },
    select: { id: true },
  });
  if (!garden) throw new NotFoundError("Garden");
}

function plotDto(plot: {
  id: string;
  gardenId: string;
  name: string;
  description: string | null;
  areaSqMeters: number;
  soilType: string;
  irrigationType: PlotDto["irrigationType"];
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { plants: number; media: number; tasks: number };
}): PlotDto {
  return {
    id: plot.id,
    gardenId: plot.gardenId,
    name: plot.name,
    description: plot.description,
    areaSqMeters: plot.areaSqMeters,
    soilType: plot.soilType,
    irrigationType: plot.irrigationType,
    latitude: plot.latitude,
    longitude: plot.longitude,
    plantCount: plot._count.plants,
    mediaCount: plot._count.media,
    openTaskCount: plot._count.tasks,
    createdAt: plot.createdAt.toISOString(),
    updatedAt: plot.updatedAt.toISOString(),
  };
}

function plantDto(plant: {
  id: string;
  plotId: string;
  plantingId: string | null;
  species: string;
  scientificName: string | null;
  variety: string | null;
  plantedAt: Date;
  status: PlantDto["status"];
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
  return {
    id: plant.id,
    plotId: plant.plotId,
    plantingId: plant.plantingId,
    species: plant.species,
    scientificName: plant.scientificName,
    variety: plant.variety,
    plantedAt: plant.plantedAt.toISOString(),
    status: plant.status,
    positionLabel: plant.positionLabel,
    careNotes: plant.careNotes,
    waterRequirement: plant.waterRequirement,
    sunlightRequirement: plant.sunlightRequirement,
    spacingCm: plant.spacingCm,
    expectedYieldKg: plant.expectedYieldKg,
    actualYieldKg: plant.actualYieldKg,
    expectedHarvestAt: plant.expectedHarvestAt?.toISOString() ?? null,
    ageDays: Math.max(0, Math.floor((Date.now() - plant.plantedAt.getTime()) / 86_400_000)),
    openTaskCount: plant._count.careTasks,
    mediaCount: plant._count.media,
    createdAt: plant.createdAt.toISOString(),
    updatedAt: plant.updatedAt.toISOString(),
  };
}

export async function getWorkspace(userId: string, gardenId: string): Promise<GardenWorkspaceDto> {
  await assertGardenAccess(userId, gardenId);
  const map = await prisma.gardenMap.upsert({
    where: { gardenId },
    create: { gardenId },
    update: {},
  });
  await refreshGardenIncidents(gardenId);

  const [
    plots,
    plants,
    features,
    elevationPoints,
    zones,
    plantings,
    assets,
    connections,
    environmentalInfluences,
    tools,
    materials,
    inventoryLocations,
    inventoryLots,
    inventoryTransactions,
    applications,
    factors,
    requirementProfiles,
    instruments,
    measurements,
    assessments,
    tasks,
    incidents,
    notificationEndpoints,
    harvestEvents,
    markets,
    sales,
    media,
  ] = await Promise.all([
    prisma.plot.findMany({
      where: { gardenId },
      include: {
        _count: {
          select: {
            plants: true,
            media: true,
            tasks: { where: { isActive: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.plant.findMany({
      where: { plot: { gardenId } },
      include: {
        _count: {
          select: {
            careTasks: { where: { isActive: true } },
            media: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.mapFeature.findMany({ where: { gardenMapId: map.id }, orderBy: { zIndex: "asc" } }),
    prisma.elevationPoint.findMany({ where: { gardenMapId: map.id }, orderBy: { createdAt: "asc" } }),
    prisma.plotZone.findMany({ where: { plot: { gardenId } }, orderBy: { name: "asc" } }),
    prisma.planting.findMany({
      where: { plot: { gardenId } },
      include: { _count: { select: { plants: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.gardenAsset.findMany({ where: { gardenId }, orderBy: { name: "asc" } }),
    prisma.assetConnection.findMany({
      where: { fromAsset: { gardenId } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.environmentalInfluence.findMany({
      where: {
        OR: [{ asset: { gardenId } }, { mapFeature: { gardenMap: { gardenId } } }],
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tool.findMany({ where: { gardenId }, orderBy: { name: "asc" } }),
    prisma.material.findMany({
      where: { gardenId },
      include: { lots: { select: { currentQuantity: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.inventoryLocation.findMany({ where: { gardenId }, orderBy: { name: "asc" } }),
    prisma.inventoryLot.findMany({
      where: { material: { gardenId } },
      orderBy: [{ expiryDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.inventoryTransaction.findMany({
      where: { lot: { material: { gardenId } } },
      orderBy: { occurredAt: "desc" },
      take: 250,
    }),
    prisma.applicationEvent.findMany({
      where: { gardenId },
      include: { lines: true },
      orderBy: { appliedAt: "desc" },
      take: 100,
    }),
    prisma.factorDefinition.findMany({ where: { gardenId }, orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.requirementProfile.findMany({
      where: { gardenId },
      include: { requirements: true },
      orderBy: { name: "asc" },
    }),
    prisma.instrument.findMany({ where: { gardenId }, orderBy: { name: "asc" } }),
    prisma.measurement.findMany({
      where: { gardenId },
      orderBy: { measuredAt: "desc" },
      take: 250,
    }),
    prisma.factorAssessment.findMany({
      where: { gardenId },
      orderBy: { assessedAt: "desc" },
      take: 150,
    }),
    prisma.workTask.findMany({
      where: { gardenId },
      include: { progress: true },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { dueAt: "asc" }],
    }),
    prisma.incident.findMany({
      where: { gardenId },
      orderBy: [{ status: "asc" }, { priority: "asc" }, { score: "desc" }],
    }),
    prisma.notificationEndpoint.findMany({ where: { gardenId }, orderBy: { createdAt: "asc" } }),
    prisma.harvestEvent.findMany({ where: { gardenId }, orderBy: { harvestedAt: "desc" } }),
    prisma.market.findMany({
      where: { gardenId },
      include: { prices: { orderBy: { observedAt: "desc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.sale.findMany({ where: { gardenId }, orderBy: { soldAt: "desc" } }),
    prisma.entityMedia.findMany({ where: { gardenId }, orderBy: { capturedAt: "desc" } }),
  ]);

  const now = Date.now();
  const thirtyDays = now + 30 * 86_400_000;
  const lowStockLots = inventoryLots.filter(
    (lot) =>
      Number(lot.currentQuantity) <= 0 ||
      Number(lot.currentQuantity) <= Number(lot.initialQuantity) * 0.2,
  ).length;
  const expiringLots = inventoryLots.filter(
    (lot) => lot.expiryDate && lot.expiryDate.getTime() <= thirtyDays,
  ).length;
  const totalInventoryValue = inventoryLots.reduce(
    (sum, lot) => sum + Number(lot.currentQuantity) * Number(lot.unitCost ?? 0),
    0,
  );
  const expectedHarvestValue = harvestEvents.reduce(
    (sum, harvest) => sum + Number(harvest.expectedValue ?? 0),
    0,
  );
  const plantingDtos = plantings.map((planting) => {
    const market = markets.find((item) => item.id === planting.preferredMarketId);
    const commodity = (planting.marketCommodity ?? planting.species).trim().toLowerCase();
    const price = market?.prices.find(
      (item) =>
        item.commodity.trim().toLowerCase() === commodity &&
        (!item.variety ||
          !planting.variety ||
          item.variety.trim().toLowerCase() === planting.variety.trim().toLowerCase()) &&
        item.quantityUnit.trim().toLowerCase() === planting.yieldUnit?.trim().toLowerCase(),
    );
    const estimatedMarketValue =
      price && planting.expectedYieldMax
        ? Number(price.typicalPrice) * Number(planting.expectedYieldMax)
        : null;
    return {
      ...planting,
      individualPlantCount: planting._count.plants,
      estimatedMarketValue,
      estimatedMarketCurrency: price ? market?.currency ?? null : null,
      estimatedMarketPriceId: price?.id ?? null,
      _count: undefined,
    };
  });
  const estimatedPlantingValue = plantingDtos.reduce(
    (sum, planting) => sum + Number(planting.estimatedMarketValue ?? 0),
    0,
  );

  return serialize<GardenWorkspaceDto>({
    map,
    plots: plots.map(plotDto),
    plants: plants.map(plantDto),
    features,
    elevationPoints,
    zones,
    plantings: plantingDtos,
    assets,
    connections,
    environmentalInfluences,
    tools,
    materials: materials.map((material) => ({
      ...material,
      totalQuantity: material.lots.reduce((sum, lot) => sum + Number(lot.currentQuantity), 0),
      lotCount: material.lots.length,
      lots: undefined,
    })),
    inventoryLocations,
    inventoryLots,
    inventoryTransactions,
    applications,
    factors,
    requirementProfiles,
    instruments,
    measurements,
    assessments,
    tasks,
    incidents,
    notificationEndpoints,
    harvestEvents,
    markets,
    sales,
    media,
    summary: {
      openTasks: tasks.filter((task) => task.status === "TODO" || task.status === "IN_PROGRESS").length,
      criticalIncidents: incidents.filter(
        (incident) =>
          (incident.priority === "P0" || incident.priority === "P1") &&
          !["RESOLVED", "DISMISSED"].includes(incident.status),
      ).length,
      lowStockLots,
      expiringLots,
      harvestsDue: plantings.filter(
        (planting) =>
          planting.expectedHarvestEnd &&
          planting.expectedHarvestEnd.getTime() <= now &&
          !["HARVESTED", "REMOVED"].includes(planting.status),
      ).length,
      totalInventoryValue,
      expectedHarvestValue: estimatedPlantingValue || expectedHarvestValue,
    },
  });
}

export async function createInventoryTransaction(
  userId: string,
  gardenId: string,
  lotId: string,
  input: {
    type: "PURCHASE" | "CONSUME" | "TRANSFER" | "ADJUST" | "EXPIRE" | "WASTE" | "RETURN" | "SPLIT" | "MERGE";
    quantity: number;
    unit: string;
    occurredAt?: Date;
    reference?: string | null;
    notes?: string | null;
  },
): Promise<unknown> {
  await assertGardenAccess(userId, gardenId);
  const lot = await prisma.inventoryLot.findFirst({
    where: { id: lotId, material: { gardenId } },
  });
  if (!lot) throw new NotFoundError("Inventory lot");
  if (lot.unit !== input.unit) {
    throw new ValidationError({ unit: [`Transaction unit must match the lot unit (${lot.unit}).`] });
  }

  const negativeTypes = new Set(["CONSUME", "EXPIRE", "WASTE", "TRANSFER", "SPLIT"]);
  const delta = negativeTypes.has(input.type) ? -input.quantity : input.quantity;
  const nextQuantity = Number(lot.currentQuantity) + delta;
  if (nextQuantity < 0) {
    throw new ValidationError({ quantity: ["Transaction would make the stock balance negative."] });
  }

  return prisma.$transaction(async (transaction) => {
    const record = await transaction.inventoryTransaction.create({
      data: {
        lotId,
        type: input.type,
        quantity: input.quantity,
        unit: input.unit,
        ...(input.occurredAt ? { occurredAt: input.occurredAt } : {}),
        ...(input.reference !== undefined ? { reference: input.reference } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });
    await transaction.inventoryLot.update({
      where: { id: lotId },
      data: { currentQuantity: nextQuantity },
    });
    return serialize(record);
  });
}

export async function createApplication(
  userId: string,
  gardenId: string,
  input: {
    title: string;
    targetType: ScopeType;
    targetId: string;
    targetName: string;
    targetSnapshot?: unknown;
    appliedAt?: Date;
    method?: string | null;
    treatedArea?: number | null;
    treatedCount?: number | null;
    weather?: string | null;
    notes?: string | null;
    lines: Array<{
      materialId: string;
      inventoryLotId?: string | null;
      productAmount: number;
      productUnit: string;
      carrierVolume?: number | null;
      carrierUnit?: string | null;
      rateValue?: number | null;
      rateUnit?: string | null;
      notes?: string | null;
    }>;
  },
): Promise<unknown> {
  await assertGardenAccess(userId, gardenId);

  return prisma.$transaction(async (transaction) => {
    for (const line of input.lines) {
      const material = await transaction.material.findFirst({
        where: { id: line.materialId, gardenId },
        select: { id: true },
      });
      if (!material) throw new NotFoundError("Application material");

      if (line.inventoryLotId) {
        const lot = await transaction.inventoryLot.findFirst({
          where: { id: line.inventoryLotId, materialId: line.materialId },
        });
        if (!lot) throw new NotFoundError("Application inventory lot");
        if (lot.unit !== line.productUnit) {
          throw new ValidationError({
            productUnit: [`Application unit must match the inventory lot unit (${lot.unit}).`],
          });
        }
        const balance = Number(lot.currentQuantity) - line.productAmount;
        if (balance < 0) {
          throw new ValidationError({
            productAmount: [`${line.productAmount} ${line.productUnit} exceeds the available lot balance.`],
          });
        }
        await transaction.inventoryLot.update({
          where: { id: lot.id },
          data: { currentQuantity: balance },
        });
      }
    }

    const application = await transaction.applicationEvent.create({
      data: {
        gardenId,
        title: input.title,
        targetType: input.targetType,
        targetId: input.targetId,
        targetName: input.targetName,
        ...(input.targetSnapshot !== undefined
          ? { targetSnapshot: input.targetSnapshot as Prisma.InputJsonValue }
          : {}),
        ...(input.appliedAt ? { appliedAt: input.appliedAt } : {}),
        ...(input.method !== undefined ? { method: input.method } : {}),
        ...(input.treatedArea !== undefined ? { treatedArea: input.treatedArea } : {}),
        ...(input.treatedCount !== undefined ? { treatedCount: input.treatedCount } : {}),
        ...(input.weather !== undefined ? { weather: input.weather } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        lines: {
          create: input.lines.map((line) => ({
            materialId: line.materialId,
            ...(line.inventoryLotId !== undefined ? { inventoryLotId: line.inventoryLotId } : {}),
            productAmount: line.productAmount,
            productUnit: line.productUnit,
            ...(line.carrierVolume !== undefined ? { carrierVolume: line.carrierVolume } : {}),
            ...(line.carrierUnit !== undefined ? { carrierUnit: line.carrierUnit } : {}),
            ...(line.rateValue !== undefined ? { rateValue: line.rateValue } : {}),
            ...(line.rateUnit !== undefined ? { rateUnit: line.rateUnit } : {}),
            ...(line.notes !== undefined ? { notes: line.notes } : {}),
          })),
        },
      },
      include: { lines: true },
    });

    for (const line of application.lines) {
      if (!line.inventoryLotId) continue;
      await transaction.inventoryTransaction.create({
        data: {
          lotId: line.inventoryLotId,
          type: "CONSUME",
          quantity: line.productAmount,
          unit: line.productUnit,
          occurredAt: application.appliedAt,
          reference: `Application ${application.id}`,
          notes: application.title,
        },
      });
    }

    return serialize(application);
  });
}

export async function completeWorkTask(
  userId: string,
  gardenId: string,
  taskId: string,
): Promise<unknown> {
  await assertGardenAccess(userId, gardenId);
  const task = await prisma.workTask.findFirst({ where: { id: taskId, gardenId } });
  if (!task) throw new NotFoundError("Work task");

  const completedAt = new Date();
  if (task.recurrenceDays) {
    const nextDueAt = new Date(completedAt.getTime() + task.recurrenceDays * 86_400_000);
    return serialize(
      await prisma.workTask.update({
        where: { id: task.id },
        data: {
          status: "TODO",
          dueAt: nextDueAt,
          nextDueAt,
          progress: { updateMany: { where: {}, data: { status: "TODO", completedAt: null } } },
        },
        include: { progress: true },
      }),
    );
  }

  return serialize(
    await prisma.workTask.update({
      where: { id: task.id },
      data: {
        status: "DONE",
        progress: {
          updateMany: { where: {}, data: { status: "DONE", completedAt } },
        },
      },
      include: { progress: true },
    }),
  );
}
