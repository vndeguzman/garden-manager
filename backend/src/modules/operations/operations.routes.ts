import { Router } from "express";
import { z, type ZodTypeAny } from "zod";
import {
  createApplicationSchema,
  createAssessmentSchema,
  createAssetSchema,
  createConnectionSchema,
  createElevationPointSchema,
  createEnvironmentalInfluenceSchema,
  createEntityMediaSchema,
  createFactorSchema,
  createHarvestEventSchema,
  createInstrumentSchema,
  createInventoryLocationSchema,
  createInventoryLotSchema,
  createInventoryTransactionSchema,
  createMapFeatureSchema,
  createMarketPriceSchema,
  createMarketSchema,
  createMaterialSchema,
  createMeasurementSchema,
  createNotificationEndpointSchema,
  createPlantingSchema,
  createRequirementProfileSchema,
  createRequirementRangeSchema,
  createSaleSchema,
  createToolSchema,
  createWorkTaskSchema,
  createZoneSchema,
  mapGeometrySchema,
  updateAssessmentSchema,
  updateAssetSchema,
  updateConnectionSchema,
  updateElevationPointSchema,
  updateEnvironmentalInfluenceSchema,
  updateEntityMediaSchema,
  updateFactorSchema,
  updateGardenMapSchema,
  updateHarvestEventSchema,
  updateIncidentSchema,
  updateInstrumentSchema,
  updateInventoryLocationSchema,
  updateInventoryLotSchema,
  updateMapFeatureSchema,
  updateMarketSchema,
  updateMaterialSchema,
  updateMeasurementSchema,
  updateNotificationEndpointSchema,
  updatePlantingSchema,
  updateRequirementProfileSchema,
  updateRequirementRangeSchema,
  updateSaleSchema,
  updateTaskProgressSchema,
  updateToolSchema,
  updateWorkTaskSchema,
  updateZoneSchema,
} from "@garden/shared";
import type { Prisma, ScopeType } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { validateBody, validateParams } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { NotFoundError, ValidationError } from "../../utils/errors.js";
import {
  dispatchPendingNotifications,
  getVapidPublicKey,
  queueIncidentNotifications,
} from "./notifications.service.js";
import {
  assertGardenAccess,
  completeWorkTask,
  createApplication,
  createInventoryTransaction,
  getWorkspace,
  serialize,
} from "./operations.service.js";
import { refreshGardenIncidents } from "./triage.service.js";

export const operationsRouter = Router({ mergeParams: true });

const gardenParams = z.object({ gardenId: z.string().uuid() });
const resourceParams = gardenParams.extend({ resourceId: z.string().uuid() });
const taskParams = gardenParams.extend({ taskId: z.string().uuid() });
const progressParams = taskParams.extend({ progressId: z.string().uuid() });
const incidentParams = gardenParams.extend({ incidentId: z.string().uuid() });
const lotParams = gardenParams.extend({ lotId: z.string().uuid() });
const profileParams = gardenParams.extend({ profileId: z.string().uuid() });
const marketParams = gardenParams.extend({ marketId: z.string().uuid() });

type CrudHandlers = {
  create: (gardenId: string, body: unknown) => Promise<unknown>;
  update: (gardenId: string, id: string, body: unknown) => Promise<unknown>;
  remove: (gardenId: string, id: string) => Promise<void>;
};

function mountCrud(
  path: string,
  createSchema: ZodTypeAny,
  updateSchema: ZodTypeAny,
  handlers: CrudHandlers,
): void {
  operationsRouter.post(
    path,
    validateParams(gardenParams),
    validateBody(createSchema),
    asyncHandler(async (req, res) => {
      await assertGardenAccess(req.user!.id, req.params.gardenId!);
      const value = await handlers.create(req.params.gardenId!, req.body);
      res.status(201).json(serialize(value));
    }),
  );
  operationsRouter.patch(
    `${path}/:resourceId`,
    validateParams(resourceParams),
    validateBody(updateSchema),
    asyncHandler(async (req, res) => {
      await assertGardenAccess(req.user!.id, req.params.gardenId!);
      const value = await handlers.update(req.params.gardenId!, req.params.resourceId!, req.body);
      res.json(serialize(value));
    }),
  );
  operationsRouter.delete(
    `${path}/:resourceId`,
    validateParams(resourceParams),
    asyncHandler(async (req, res) => {
      await assertGardenAccess(req.user!.id, req.params.gardenId!);
      await handlers.remove(req.params.gardenId!, req.params.resourceId!);
      res.status(204).send();
    }),
  );
}

async function requireOwned(
  query: Promise<{ id: string } | null>,
  resource: string,
): Promise<void> {
  if (!(await query)) throw new NotFoundError(resource);
}

async function requireFactor(gardenId: string, factorId: string): Promise<void> {
  await requireOwned(
    prisma.factorDefinition.findFirst({ where: { id: factorId, gardenId }, select: { id: true } }),
    "Factor in this garden",
  );
}

async function requireMarket(gardenId: string, marketId: string): Promise<void> {
  await requireOwned(
    prisma.market.findFirst({ where: { id: marketId, gardenId }, select: { id: true } }),
    "Market in this garden",
  );
}

async function validatePlantingReferences(
  gardenId: string,
  plotId: string,
  input: {
    zoneId?: string | null;
    requirementProfileId?: string | null;
    preferredMarketId?: string | null;
  },
): Promise<void> {
  if (input.zoneId) {
    await requireOwned(
      prisma.plotZone.findFirst({
        where: { id: input.zoneId, plotId, plot: { gardenId } },
        select: { id: true },
      }),
      "Zone in this plot",
    );
  }
  if (input.requirementProfileId) {
    await requireOwned(
      prisma.requirementProfile.findFirst({
        where: { id: input.requirementProfileId, gardenId },
        select: { id: true },
      }),
      "Requirement profile in this garden",
    );
  }
  if (input.preferredMarketId) await requireMarket(gardenId, input.preferredMarketId);
}

async function validateHarvestReferences(
  gardenId: string,
  input: { plantingId?: string | null; plantId?: string | null },
): Promise<void> {
  if (input.plantingId) {
    await requireOwned(
      prisma.planting.findFirst({
        where: { id: input.plantingId, plot: { gardenId } },
        select: { id: true },
      }),
      "Harvest planting in this garden",
    );
  }
  if (input.plantId) {
    await requireOwned(
      prisma.plant.findFirst({
        where: { id: input.plantId, plot: { gardenId } },
        select: { id: true },
      }),
      "Harvest plant in this garden",
    );
  }
}

operationsRouter.get(
  "/",
  validateParams(gardenParams),
  asyncHandler(async (req, res) => {
    res.json(await getWorkspace(req.user!.id, req.params.gardenId!));
  }),
);

operationsRouter.get(
  "/vapid-public-key",
  validateParams(gardenParams),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    res.json({ publicKey: getVapidPublicKey() });
  }),
);

operationsRouter.patch(
  "/map",
  validateParams(gardenParams),
  validateBody(updateGardenMapSchema),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    const map = await prisma.gardenMap.upsert({
      where: { gardenId: req.params.gardenId! },
      create: {
        gardenId: req.params.gardenId!,
        ...(req.body as Omit<Prisma.GardenMapUncheckedCreateInput, "gardenId">),
      },
      update: req.body as Prisma.GardenMapUncheckedUpdateInput,
    });
    res.json(map);
  }),
);

mountCrud("/features", createMapFeatureSchema, updateMapFeatureSchema, {
  create: async (gardenId, body) => {
    const map = await prisma.gardenMap.upsert({ where: { gardenId }, create: { gardenId }, update: {} });
    return prisma.mapFeature.create({
      data: {
        gardenMapId: map.id,
        ...(body as Omit<Prisma.MapFeatureUncheckedCreateInput, "gardenMapId">),
      },
    });
  },
  update: async (gardenId, id, body) => {
    await requireOwned(
      prisma.mapFeature.findFirst({ where: { id, gardenMap: { gardenId } }, select: { id: true } }),
      "Map feature",
    );
    return prisma.mapFeature.update({ where: { id }, data: body as Prisma.MapFeatureUpdateInput });
  },
  remove: async (gardenId, id) => {
    await requireOwned(
      prisma.mapFeature.findFirst({ where: { id, gardenMap: { gardenId } }, select: { id: true } }),
      "Map feature",
    );
    await prisma.mapFeature.delete({ where: { id } });
  },
});

const batchFeatureSchema = z.object({
  features: z
    .array(
      z.object({
        id: z.string().uuid(),
        geometry: mapGeometrySchema,
        rotation: z.number().finite().optional(),
        zIndex: z.number().int().optional(),
      }),
    )
    .min(1)
    .max(250),
});
operationsRouter.patch(
  "/features",
  validateParams(gardenParams),
  validateBody(batchFeatureSchema),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    const ids = req.body.features.map((feature: { id: string }) => feature.id);
    const ownedCount = await prisma.mapFeature.count({
      where: { id: { in: ids }, gardenMap: { gardenId: req.params.gardenId! } },
    });
    if (ownedCount !== ids.length) throw new NotFoundError("One or more map features");
    const values = await prisma.$transaction(
      req.body.features.map(
        (feature: { id: string; geometry: unknown; rotation?: number; zIndex?: number }) =>
          prisma.mapFeature.update({
            where: { id: feature.id },
            data: {
              geometry: feature.geometry as Prisma.InputJsonValue,
              ...(feature.rotation !== undefined ? { rotation: feature.rotation } : {}),
              ...(feature.zIndex !== undefined ? { zIndex: feature.zIndex } : {}),
            },
          }),
      ),
    );
    res.json(serialize(values));
  }),
);

mountCrud("/elevation", createElevationPointSchema, updateElevationPointSchema, {
  create: async (gardenId, body) => {
    const map = await prisma.gardenMap.upsert({ where: { gardenId }, create: { gardenId }, update: {} });
    return prisma.elevationPoint.create({
      data: {
        gardenMapId: map.id,
        ...(body as Omit<Prisma.ElevationPointUncheckedCreateInput, "gardenMapId">),
      },
    });
  },
  update: async (gardenId, id, body) => {
    await requireOwned(
      prisma.elevationPoint.findFirst({ where: { id, gardenMap: { gardenId } }, select: { id: true } }),
      "Elevation point",
    );
    return prisma.elevationPoint.update({ where: { id }, data: body as Prisma.ElevationPointUpdateInput });
  },
  remove: async (gardenId, id) => {
    await requireOwned(
      prisma.elevationPoint.findFirst({ where: { id, gardenMap: { gardenId } }, select: { id: true } }),
      "Elevation point",
    );
    await prisma.elevationPoint.delete({ where: { id } });
  },
});

mountCrud("/zones", createZoneSchema, updateZoneSchema, {
  create: async (gardenId, body) => {
    const input = body as Prisma.PlotZoneUncheckedCreateInput;
    await requireOwned(prisma.plot.findFirst({ where: { id: input.plotId, gardenId }, select: { id: true } }), "Plot");
    return prisma.plotZone.create({ data: input });
  },
  update: async (gardenId, id, body) => {
    await requireOwned(prisma.plotZone.findFirst({ where: { id, plot: { gardenId } }, select: { id: true } }), "Plot zone");
    return prisma.plotZone.update({ where: { id }, data: body as Prisma.PlotZoneUpdateInput });
  },
  remove: async (gardenId, id) => {
    await requireOwned(prisma.plotZone.findFirst({ where: { id, plot: { gardenId } }, select: { id: true } }), "Plot zone");
    await prisma.plotZone.delete({ where: { id } });
  },
});

mountCrud("/plantings", createPlantingSchema, updatePlantingSchema, {
  create: async (gardenId, body) => {
    const input = body as Prisma.PlantingUncheckedCreateInput;
    await requireOwned(prisma.plot.findFirst({ where: { id: input.plotId, gardenId }, select: { id: true } }), "Plot");
    await validatePlantingReferences(gardenId, input.plotId, input);
    return prisma.planting.create({ data: input });
  },
  update: async (gardenId, id, body) => {
    const planting = await prisma.planting.findFirst({
      where: { id, plot: { gardenId } },
      select: { id: true, plotId: true },
    });
    if (!planting) throw new NotFoundError("Planting");
    await validatePlantingReferences(
      gardenId,
      planting.plotId,
      body as {
        zoneId?: string | null;
        requirementProfileId?: string | null;
        preferredMarketId?: string | null;
      },
    );
    return prisma.planting.update({ where: { id }, data: body as Prisma.PlantingUpdateInput });
  },
  remove: async (gardenId, id) => {
    await requireOwned(prisma.planting.findFirst({ where: { id, plot: { gardenId } }, select: { id: true } }), "Planting");
    await prisma.planting.delete({ where: { id } });
  },
});

mountCrud("/assets", createAssetSchema, updateAssetSchema, {
  create: (gardenId, body) =>
    prisma.gardenAsset.create({
      data: {
        gardenId,
        ...(body as Omit<Prisma.GardenAssetUncheckedCreateInput, "gardenId">),
      },
    }),
  update: async (gardenId, id, body) => {
    await requireOwned(prisma.gardenAsset.findFirst({ where: { id, gardenId }, select: { id: true } }), "Asset");
    return prisma.gardenAsset.update({ where: { id }, data: body as Prisma.GardenAssetUpdateInput });
  },
  remove: async (gardenId, id) => {
    await requireOwned(prisma.gardenAsset.findFirst({ where: { id, gardenId }, select: { id: true } }), "Asset");
    await prisma.gardenAsset.delete({ where: { id } });
  },
});

mountCrud("/connections", createConnectionSchema, updateConnectionSchema, {
  create: async (gardenId, body) => {
    const input = body as Prisma.AssetConnectionUncheckedCreateInput;
    const count = await prisma.gardenAsset.count({
      where: { id: { in: [input.fromAssetId, input.toAssetId] }, gardenId },
    });
    if (count !== 2 || input.fromAssetId === input.toAssetId) {
      throw new ValidationError({ connection: ["Choose two different assets in this garden."] });
    }
    return prisma.assetConnection.create({ data: input });
  },
  update: async (gardenId, id, body) => {
    await requireOwned(
      prisma.assetConnection.findFirst({ where: { id, fromAsset: { gardenId } }, select: { id: true } }),
      "Asset connection",
    );
    const input = body as { fromAssetId?: string; toAssetId?: string };
    for (const assetId of [input.fromAssetId, input.toAssetId]) {
      if (assetId) {
        await requireOwned(
          prisma.gardenAsset.findFirst({ where: { id: assetId, gardenId }, select: { id: true } }),
          "Connection asset in this garden",
        );
      }
    }
    return prisma.assetConnection.update({ where: { id }, data: body as Prisma.AssetConnectionUpdateInput });
  },
  remove: async (gardenId, id) => {
    await requireOwned(
      prisma.assetConnection.findFirst({ where: { id, fromAsset: { gardenId } }, select: { id: true } }),
      "Asset connection",
    );
    await prisma.assetConnection.delete({ where: { id } });
  },
});

mountCrud(
  "/environmental-influences",
  createEnvironmentalInfluenceSchema,
  updateEnvironmentalInfluenceSchema,
  {
    create: async (gardenId, body) => {
      const input = body as Prisma.EnvironmentalInfluenceUncheckedCreateInput;
      if (!input.assetId && !input.mapFeatureId) {
        throw new ValidationError({
          assetId: ["Choose an asset or map feature as the source of this influence."],
        });
      }
      if (input.assetId) {
        await requireOwned(
          prisma.gardenAsset.findFirst({
            where: { id: input.assetId, gardenId },
            select: { id: true },
          }),
          "Influence asset",
        );
      }
      if (input.mapFeatureId) {
        await requireOwned(
          prisma.mapFeature.findFirst({
            where: { id: input.mapFeatureId, gardenMap: { gardenId } },
            select: { id: true },
          }),
          "Influence map feature",
        );
      }
      return prisma.environmentalInfluence.create({ data: input });
    },
    update: async (gardenId, id, body) => {
      await requireOwned(
        prisma.environmentalInfluence.findFirst({
          where: {
            id,
            OR: [{ asset: { gardenId } }, { mapFeature: { gardenMap: { gardenId } } }],
          },
          select: { id: true },
        }),
        "Environmental influence",
      );
      const input = body as { assetId?: string | null; mapFeatureId?: string | null };
      if (input.assetId) {
        await requireOwned(
          prisma.gardenAsset.findFirst({
            where: { id: input.assetId, gardenId },
            select: { id: true },
          }),
          "Influence asset in this garden",
        );
      }
      if (input.mapFeatureId) {
        await requireOwned(
          prisma.mapFeature.findFirst({
            where: { id: input.mapFeatureId, gardenMap: { gardenId } },
            select: { id: true },
          }),
          "Influence map feature in this garden",
        );
      }
      return prisma.environmentalInfluence.update({
        where: { id },
        data: body as Prisma.EnvironmentalInfluenceUpdateInput,
      });
    },
    remove: async (gardenId, id) => {
      await requireOwned(
        prisma.environmentalInfluence.findFirst({
          where: {
            id,
            OR: [{ asset: { gardenId } }, { mapFeature: { gardenMap: { gardenId } } }],
          },
          select: { id: true },
        }),
        "Environmental influence",
      );
      await prisma.environmentalInfluence.delete({ where: { id } });
    },
  },
);

mountCrud("/tools", createToolSchema, updateToolSchema, {
  create: (gardenId, body) =>
    prisma.tool.create({
      data: { gardenId, ...(body as Omit<Prisma.ToolUncheckedCreateInput, "gardenId">) },
    }),
  update: async (gardenId, id, body) => {
    await requireOwned(prisma.tool.findFirst({ where: { id, gardenId }, select: { id: true } }), "Tool");
    return prisma.tool.update({ where: { id }, data: body as Prisma.ToolUpdateInput });
  },
  remove: async (gardenId, id) => {
    await requireOwned(prisma.tool.findFirst({ where: { id, gardenId }, select: { id: true } }), "Tool");
    await prisma.tool.delete({ where: { id } });
  },
});

mountCrud("/materials", createMaterialSchema, updateMaterialSchema, {
  create: (gardenId, body) =>
    prisma.material.create({
      data: { gardenId, ...(body as Omit<Prisma.MaterialUncheckedCreateInput, "gardenId">) },
    }),
  update: async (gardenId, id, body) => {
    await requireOwned(prisma.material.findFirst({ where: { id, gardenId }, select: { id: true } }), "Material");
    return prisma.material.update({ where: { id }, data: body as Prisma.MaterialUpdateInput });
  },
  remove: async (gardenId, id) => {
    await requireOwned(prisma.material.findFirst({ where: { id, gardenId }, select: { id: true } }), "Material");
    await prisma.material.delete({ where: { id } });
  },
});

mountCrud("/locations", createInventoryLocationSchema, updateInventoryLocationSchema, {
  create: (gardenId, body) =>
    prisma.inventoryLocation.create({
      data: {
        gardenId,
        ...(body as Omit<Prisma.InventoryLocationUncheckedCreateInput, "gardenId">),
      },
    }),
  update: async (gardenId, id, body) => {
    await requireOwned(
      prisma.inventoryLocation.findFirst({ where: { id, gardenId }, select: { id: true } }),
      "Inventory location",
    );
    return prisma.inventoryLocation.update({
      where: { id },
      data: body as Prisma.InventoryLocationUpdateInput,
    });
  },
  remove: async (gardenId, id) => {
    await requireOwned(
      prisma.inventoryLocation.findFirst({ where: { id, gardenId }, select: { id: true } }),
      "Inventory location",
    );
    await prisma.inventoryLocation.delete({ where: { id } });
  },
});

mountCrud("/lots", createInventoryLotSchema, updateInventoryLotSchema, {
  create: async (gardenId, body) => {
    const input = body as Prisma.InventoryLotUncheckedCreateInput;
    await requireOwned(
      prisma.material.findFirst({ where: { id: input.materialId, gardenId }, select: { id: true } }),
      "Material",
    );
    if (input.locationId) {
      await requireOwned(
        prisma.inventoryLocation.findFirst({
          where: { id: input.locationId, gardenId },
          select: { id: true },
        }),
        "Inventory location",
      );
    }
    return prisma.inventoryLot.create({
      data: { ...input, currentQuantity: input.currentQuantity ?? input.initialQuantity },
    });
  },
  update: async (gardenId, id, body) => {
    await requireOwned(
      prisma.inventoryLot.findFirst({ where: { id, material: { gardenId } }, select: { id: true } }),
      "Inventory lot",
    );
    const input = body as { locationId?: string | null };
    if (input.locationId) {
      await requireOwned(
        prisma.inventoryLocation.findFirst({
          where: { id: input.locationId, gardenId },
          select: { id: true },
        }),
        "Inventory location",
      );
    }
    return prisma.inventoryLot.update({ where: { id }, data: body as Prisma.InventoryLotUpdateInput });
  },
  remove: async (gardenId, id) => {
    await requireOwned(
      prisma.inventoryLot.findFirst({ where: { id, material: { gardenId } }, select: { id: true } }),
      "Inventory lot",
    );
    await prisma.inventoryLot.delete({ where: { id } });
  },
});

operationsRouter.post(
  "/lots/:lotId/transactions",
  validateParams(lotParams),
  validateBody(createInventoryTransactionSchema),
  asyncHandler(async (req, res) => {
    const value = await createInventoryTransaction(
      req.user!.id,
      req.params.gardenId!,
      req.params.lotId!,
      req.body,
    );
    res.status(201).json(value);
  }),
);

operationsRouter.post(
  "/applications",
  validateParams(gardenParams),
  validateBody(createApplicationSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createApplication(req.user!.id, req.params.gardenId!, req.body));
  }),
);
operationsRouter.patch(
  "/applications/:resourceId",
  validateParams(resourceParams),
  validateBody(createApplicationSchema.omit({ lines: true }).partial()),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    await requireOwned(
      prisma.applicationEvent.findFirst({
        where: { id: req.params.resourceId!, gardenId: req.params.gardenId! },
        select: { id: true },
      }),
      "Application",
    );
    const value = await prisma.applicationEvent.update({
      where: { id: req.params.resourceId! },
      data: req.body,
      include: { lines: true },
    });
    res.json(serialize(value));
  }),
);
operationsRouter.delete(
  "/applications/:resourceId",
  validateParams(resourceParams),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    await requireOwned(
      prisma.applicationEvent.findFirst({
        where: { id: req.params.resourceId!, gardenId: req.params.gardenId! },
        select: { id: true },
      }),
      "Application",
    );
    await prisma.applicationEvent.delete({ where: { id: req.params.resourceId! } });
    res.status(204).send();
  }),
);

mountCrud("/factors", createFactorSchema, updateFactorSchema, {
  create: (gardenId, body) =>
    prisma.factorDefinition.create({
      data: {
        gardenId,
        ...(body as Omit<Prisma.FactorDefinitionUncheckedCreateInput, "gardenId">),
      },
    }),
  update: async (gardenId, id, body) => {
    await requireOwned(
      prisma.factorDefinition.findFirst({ where: { id, gardenId }, select: { id: true } }),
      "Factor",
    );
    return prisma.factorDefinition.update({
      where: { id },
      data: body as Prisma.FactorDefinitionUpdateInput,
    });
  },
  remove: async (gardenId, id) => {
    await requireOwned(
      prisma.factorDefinition.findFirst({ where: { id, gardenId }, select: { id: true } }),
      "Factor",
    );
    await prisma.factorDefinition.delete({ where: { id } });
  },
});

mountCrud(
  "/requirement-profiles",
  createRequirementProfileSchema,
  updateRequirementProfileSchema,
  {
    create: (gardenId, body) =>
      prisma.requirementProfile.create({
        data: {
          gardenId,
          ...(body as Omit<Prisma.RequirementProfileUncheckedCreateInput, "gardenId">),
        },
      }),
    update: async (gardenId, id, body) => {
      await requireOwned(
        prisma.requirementProfile.findFirst({ where: { id, gardenId }, select: { id: true } }),
        "Requirement profile",
      );
      return prisma.requirementProfile.update({
        where: { id },
        data: body as Prisma.RequirementProfileUpdateInput,
      });
    },
    remove: async (gardenId, id) => {
      await requireOwned(
        prisma.requirementProfile.findFirst({ where: { id, gardenId }, select: { id: true } }),
        "Requirement profile",
      );
      await prisma.requirementProfile.delete({ where: { id } });
    },
  },
);

operationsRouter.post(
  "/requirement-profiles/:profileId/ranges",
  validateParams(profileParams),
  validateBody(createRequirementRangeSchema),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    await requireOwned(
      prisma.requirementProfile.findFirst({
        where: { id: req.params.profileId!, gardenId: req.params.gardenId! },
        select: { id: true },
      }),
      "Requirement profile",
    );
    await requireFactor(req.params.gardenId!, req.body.factorId);
    const value = await prisma.requirementRange.create({
      data: {
        profileId: req.params.profileId!,
        ...(req.body as Omit<Prisma.RequirementRangeUncheckedCreateInput, "profileId">),
      },
    });
    res.status(201).json(serialize(value));
  }),
);
operationsRouter.post(
  "/requirement-ranges",
  validateParams(gardenParams),
  validateBody(createRequirementRangeSchema.extend({ profileId: z.string().uuid() })),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    await requireOwned(
      prisma.requirementProfile.findFirst({
        where: { id: req.body.profileId, gardenId: req.params.gardenId! },
        select: { id: true },
      }),
      "Requirement profile",
    );
    await requireFactor(req.params.gardenId!, req.body.factorId);
    const value = await prisma.requirementRange.create({ data: req.body });
    res.status(201).json(serialize(value));
  }),
);
operationsRouter.patch(
  "/requirement-ranges/:resourceId",
  validateParams(resourceParams),
  validateBody(updateRequirementRangeSchema),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    await requireOwned(
      prisma.requirementRange.findFirst({
        where: { id: req.params.resourceId!, profile: { gardenId: req.params.gardenId! } },
        select: { id: true },
      }),
      "Requirement range",
    );
    if (req.body.factorId) await requireFactor(req.params.gardenId!, req.body.factorId);
    res.json(
      serialize(
        await prisma.requirementRange.update({
          where: { id: req.params.resourceId! },
          data: req.body,
        }),
      ),
    );
  }),
);
operationsRouter.delete(
  "/requirement-ranges/:resourceId",
  validateParams(resourceParams),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    await requireOwned(
      prisma.requirementRange.findFirst({
        where: { id: req.params.resourceId!, profile: { gardenId: req.params.gardenId! } },
        select: { id: true },
      }),
      "Requirement range",
    );
    await prisma.requirementRange.delete({ where: { id: req.params.resourceId! } });
    res.status(204).send();
  }),
);

mountCrud("/instruments", createInstrumentSchema, updateInstrumentSchema, {
  create: (gardenId, body) =>
    prisma.instrument.create({
      data: {
        gardenId,
        ...(body as Omit<Prisma.InstrumentUncheckedCreateInput, "gardenId">),
      },
    }),
  update: async (gardenId, id, body) => {
    await requireOwned(prisma.instrument.findFirst({ where: { id, gardenId }, select: { id: true } }), "Instrument");
    return prisma.instrument.update({ where: { id }, data: body as Prisma.InstrumentUpdateInput });
  },
  remove: async (gardenId, id) => {
    await requireOwned(prisma.instrument.findFirst({ where: { id, gardenId }, select: { id: true } }), "Instrument");
    await prisma.instrument.delete({ where: { id } });
  },
});

mountCrud("/measurements", createMeasurementSchema, updateMeasurementSchema, {
  create: async (gardenId, body) => {
    const input = body as Prisma.MeasurementUncheckedCreateInput;
    await requireFactor(gardenId, input.factorId);
    if (input.instrumentId) {
      await requireOwned(
        prisma.instrument.findFirst({
          where: { id: input.instrumentId, gardenId },
          select: { id: true },
        }),
        "Instrument in this garden",
      );
    }
    return prisma.measurement.create({
      data: {
        gardenId,
        ...(body as Omit<Prisma.MeasurementUncheckedCreateInput, "gardenId">),
      },
    });
  },
  update: async (gardenId, id, body) => {
    await requireOwned(prisma.measurement.findFirst({ where: { id, gardenId }, select: { id: true } }), "Measurement");
    const input = body as { factorId?: string; instrumentId?: string | null };
    if (input.factorId) await requireFactor(gardenId, input.factorId);
    if (input.instrumentId) {
      await requireOwned(
        prisma.instrument.findFirst({
          where: { id: input.instrumentId, gardenId },
          select: { id: true },
        }),
        "Instrument in this garden",
      );
    }
    return prisma.measurement.update({ where: { id }, data: body as Prisma.MeasurementUpdateInput });
  },
  remove: async (gardenId, id) => {
    await requireOwned(prisma.measurement.findFirst({ where: { id, gardenId }, select: { id: true } }), "Measurement");
    await prisma.measurement.delete({ where: { id } });
  },
});

mountCrud("/assessments", createAssessmentSchema, updateAssessmentSchema, {
  create: async (gardenId, body) => {
    const input = body as Prisma.FactorAssessmentUncheckedCreateInput;
    await requireFactor(gardenId, input.factorId);
    return prisma.factorAssessment.create({
      data: {
        gardenId,
        ...(body as Omit<Prisma.FactorAssessmentUncheckedCreateInput, "gardenId">),
      },
    });
  },
  update: async (gardenId, id, body) => {
    await requireOwned(
      prisma.factorAssessment.findFirst({ where: { id, gardenId }, select: { id: true } }),
      "Factor assessment",
    );
    const input = body as { factorId?: string };
    if (input.factorId) await requireFactor(gardenId, input.factorId);
    return prisma.factorAssessment.update({
      where: { id },
      data: body as Prisma.FactorAssessmentUpdateInput,
    });
  },
  remove: async (gardenId, id) => {
    await requireOwned(
      prisma.factorAssessment.findFirst({ where: { id, gardenId }, select: { id: true } }),
      "Factor assessment",
    );
    await prisma.factorAssessment.delete({ where: { id } });
  },
});

operationsRouter.post(
  "/tasks",
  validateParams(gardenParams),
  validateBody(createWorkTaskSchema),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    const { affectedTargets = [], ...task } = req.body;
    if (task.incidentId) {
      await requireOwned(
        prisma.incident.findFirst({
          where: { id: task.incidentId, gardenId: req.params.gardenId! },
          select: { id: true },
        }),
        "Incident in this garden",
      );
    }
    const value = await prisma.workTask.create({
      data: {
        gardenId: req.params.gardenId!,
        ...task,
        affectedSnapshot: task.affectedSnapshot as Prisma.InputJsonValue | undefined,
        requiredTools: task.requiredTools as Prisma.InputJsonValue | undefined,
        requiredMaterials: task.requiredMaterials as Prisma.InputJsonValue | undefined,
        progress: {
          create: affectedTargets.map(
            (target: { targetType: ScopeType; targetId: string; targetName: string }) => target,
          ),
        },
      },
      include: { progress: true },
    });
    res.status(201).json(serialize(value));
  }),
);
operationsRouter.patch(
  "/tasks/:taskId",
  validateParams(taskParams),
  validateBody(updateWorkTaskSchema),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    await requireOwned(
      prisma.workTask.findFirst({
        where: { id: req.params.taskId!, gardenId: req.params.gardenId! },
        select: { id: true },
      }),
      "Work task",
    );
    if (req.body.incidentId) {
      await requireOwned(
        prisma.incident.findFirst({
          where: { id: req.body.incidentId, gardenId: req.params.gardenId! },
          select: { id: true },
        }),
        "Incident in this garden",
      );
    }
    const value = await prisma.workTask.update({
      where: { id: req.params.taskId! },
      data: req.body,
      include: { progress: true },
    });
    res.json(serialize(value));
  }),
);
operationsRouter.delete(
  "/tasks/:taskId",
  validateParams(taskParams),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    await requireOwned(
      prisma.workTask.findFirst({
        where: { id: req.params.taskId!, gardenId: req.params.gardenId! },
        select: { id: true },
      }),
      "Work task",
    );
    await prisma.workTask.delete({ where: { id: req.params.taskId! } });
    res.status(204).send();
  }),
);
operationsRouter.post(
  "/tasks/:taskId/complete",
  validateParams(taskParams),
  asyncHandler(async (req, res) => {
    res.json(await completeWorkTask(req.user!.id, req.params.gardenId!, req.params.taskId!));
  }),
);
operationsRouter.patch(
  "/tasks/:taskId/progress/:progressId",
  validateParams(progressParams),
  validateBody(updateTaskProgressSchema),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    await requireOwned(
      prisma.workTaskProgress.findFirst({
        where: {
          id: req.params.progressId!,
          taskId: req.params.taskId!,
          task: { gardenId: req.params.gardenId! },
        },
        select: { id: true },
      }),
      "Task progress",
    );
    const progress = await prisma.workTaskProgress.update({
      where: { id: req.params.progressId! },
      data: req.body,
    });
    const incomplete = await prisma.workTaskProgress.count({
      where: { taskId: req.params.taskId!, status: { not: "DONE" } },
    });
    if (incomplete === 0) {
      await prisma.workTask.update({ where: { id: req.params.taskId! }, data: { status: "DONE" } });
    }
    res.json(serialize(progress));
  }),
);

operationsRouter.post(
  "/triage",
  validateParams(gardenParams),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    const changed = await refreshGardenIncidents(req.params.gardenId!);
    res.json({ changed });
  }),
);
operationsRouter.patch(
  "/incidents/:incidentId",
  validateParams(incidentParams),
  validateBody(updateIncidentSchema),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    await requireOwned(
      prisma.incident.findFirst({
        where: { id: req.params.incidentId!, gardenId: req.params.gardenId! },
        select: { id: true },
      }),
      "Incident",
    );
    const value = await prisma.incident.update({
      where: { id: req.params.incidentId! },
      data: req.body,
    });
    res.json(serialize(value));
  }),
);
operationsRouter.post(
  "/incidents/:incidentId/notify",
  validateParams(incidentParams),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    await requireOwned(
      prisma.incident.findFirst({
        where: { id: req.params.incidentId!, gardenId: req.params.gardenId! },
        select: { id: true },
      }),
      "Incident",
    );
    const queued = await queueIncidentNotifications(req.params.incidentId!);
    const dispatched = await dispatchPendingNotifications();
    res.json({ queued, dispatched });
  }),
);

mountCrud(
  "/notification-endpoints",
  createNotificationEndpointSchema,
  updateNotificationEndpointSchema,
  {
    create: (gardenId, body) =>
      prisma.notificationEndpoint.create({
        data: {
          gardenId,
          ...(body as Omit<Prisma.NotificationEndpointUncheckedCreateInput, "gardenId">),
        },
      }),
    update: async (gardenId, id, body) => {
      await requireOwned(
        prisma.notificationEndpoint.findFirst({ where: { id, gardenId }, select: { id: true } }),
        "Notification endpoint",
      );
      return prisma.notificationEndpoint.update({
        where: { id },
        data: body as Prisma.NotificationEndpointUpdateInput,
      });
    },
    remove: async (gardenId, id) => {
      await requireOwned(
        prisma.notificationEndpoint.findFirst({ where: { id, gardenId }, select: { id: true } }),
        "Notification endpoint",
      );
      await prisma.notificationEndpoint.delete({ where: { id } });
    },
  },
);
operationsRouter.post(
  "/notifications/dispatch",
  validateParams(gardenParams),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    res.json({ processed: await dispatchPendingNotifications() });
  }),
);

mountCrud("/harvests", createHarvestEventSchema, updateHarvestEventSchema, {
  create: async (gardenId, body) => {
    await validateHarvestReferences(
      gardenId,
      body as { plantingId?: string | null; plantId?: string | null },
    );
    return prisma.harvestEvent.create({
      data: {
        gardenId,
        ...(body as Omit<Prisma.HarvestEventUncheckedCreateInput, "gardenId">),
      },
    });
  },
  update: async (gardenId, id, body) => {
    await requireOwned(prisma.harvestEvent.findFirst({ where: { id, gardenId }, select: { id: true } }), "Harvest");
    await validateHarvestReferences(
      gardenId,
      body as { plantingId?: string | null; plantId?: string | null },
    );
    return prisma.harvestEvent.update({ where: { id }, data: body as Prisma.HarvestEventUpdateInput });
  },
  remove: async (gardenId, id) => {
    await requireOwned(prisma.harvestEvent.findFirst({ where: { id, gardenId }, select: { id: true } }), "Harvest");
    await prisma.harvestEvent.delete({ where: { id } });
  },
});

mountCrud("/markets", createMarketSchema, updateMarketSchema, {
  create: (gardenId, body) =>
    prisma.market.create({
      data: { gardenId, ...(body as Omit<Prisma.MarketUncheckedCreateInput, "gardenId">) },
    }),
  update: async (gardenId, id, body) => {
    await requireOwned(prisma.market.findFirst({ where: { id, gardenId }, select: { id: true } }), "Market");
    return prisma.market.update({ where: { id }, data: body as Prisma.MarketUpdateInput });
  },
  remove: async (gardenId, id) => {
    await requireOwned(prisma.market.findFirst({ where: { id, gardenId }, select: { id: true } }), "Market");
    await prisma.market.delete({ where: { id } });
  },
});
operationsRouter.post(
  "/markets/:marketId/prices",
  validateParams(marketParams),
  validateBody(createMarketPriceSchema),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    await requireOwned(
      prisma.market.findFirst({
        where: { id: req.params.marketId!, gardenId: req.params.gardenId! },
        select: { id: true },
      }),
      "Market",
    );
    const value = await prisma.marketPrice.create({
      data: { ...req.body, marketId: req.params.marketId! },
    });
    res.status(201).json(serialize(value));
  }),
);
operationsRouter.post(
  "/market-prices",
  validateParams(gardenParams),
  validateBody(createMarketPriceSchema.extend({ marketId: z.string().uuid() })),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    await requireOwned(
      prisma.market.findFirst({
        where: { id: req.body.marketId, gardenId: req.params.gardenId! },
        select: { id: true },
      }),
      "Market",
    );
    res.status(201).json(serialize(await prisma.marketPrice.create({ data: req.body })));
  }),
);
operationsRouter.delete(
  "/market-prices/:resourceId",
  validateParams(resourceParams),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    await requireOwned(
      prisma.marketPrice.findFirst({
        where: { id: req.params.resourceId!, market: { gardenId: req.params.gardenId! } },
        select: { id: true },
      }),
      "Market price",
    );
    await prisma.marketPrice.delete({ where: { id: req.params.resourceId! } });
    res.status(204).send();
  }),
);
operationsRouter.patch(
  "/market-prices/:resourceId",
  validateParams(resourceParams),
  validateBody(createMarketPriceSchema.partial()),
  asyncHandler(async (req, res) => {
    await assertGardenAccess(req.user!.id, req.params.gardenId!);
    await requireOwned(
      prisma.marketPrice.findFirst({
        where: { id: req.params.resourceId!, market: { gardenId: req.params.gardenId! } },
        select: { id: true },
      }),
      "Market price",
    );
    res.json(
      serialize(
        await prisma.marketPrice.update({
          where: { id: req.params.resourceId! },
          data: req.body,
        }),
      ),
    );
  }),
);

mountCrud("/sales", createSaleSchema, updateSaleSchema, {
  create: async (gardenId, body) => {
    const input = body as Prisma.SaleUncheckedCreateInput;
    if (input.marketId) await requireMarket(gardenId, input.marketId);
    return prisma.sale.create({
      data: { gardenId, ...(body as Omit<Prisma.SaleUncheckedCreateInput, "gardenId">) },
    });
  },
  update: async (gardenId, id, body) => {
    await requireOwned(prisma.sale.findFirst({ where: { id, gardenId }, select: { id: true } }), "Sale");
    const input = body as { marketId?: string | null };
    if (input.marketId) await requireMarket(gardenId, input.marketId);
    return prisma.sale.update({ where: { id }, data: body as Prisma.SaleUpdateInput });
  },
  remove: async (gardenId, id) => {
    await requireOwned(prisma.sale.findFirst({ where: { id, gardenId }, select: { id: true } }), "Sale");
    await prisma.sale.delete({ where: { id } });
  },
});

mountCrud("/media", createEntityMediaSchema, updateEntityMediaSchema, {
  create: (gardenId, body) =>
    prisma.entityMedia.create({
      data: {
        gardenId,
        ...(body as Omit<Prisma.EntityMediaUncheckedCreateInput, "gardenId">),
      },
    }),
  update: async (gardenId, id, body) => {
    await requireOwned(prisma.entityMedia.findFirst({ where: { id, gardenId }, select: { id: true } }), "Media");
    return prisma.entityMedia.update({ where: { id }, data: body as Prisma.EntityMediaUpdateInput });
  },
  remove: async (gardenId, id) => {
    await requireOwned(prisma.entityMedia.findFirst({ where: { id, gardenId }, select: { id: true } }), "Media");
    await prisma.entityMedia.delete({ where: { id } });
  },
});
