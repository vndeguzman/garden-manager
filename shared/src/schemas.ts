import { z } from "zod";
import {
  CareTaskType,
  HealthStatus,
  IrrigationType,
  MediaType,
  PlantStatus,
  PlotTaskType,
  UserRole,
} from "./enums";

// ---------------------------------------------------------------------------
// Pattern note for Vic: these zod schemas are the single source of truth.
// Backend uses them to validate request bodies. Frontend uses `z.infer<>`
// (a conditional-type-driven utility type) to get compile-time types for
// free, so the API contract can never silently drift between client/server.
// ---------------------------------------------------------------------------

const zEnum = <T extends Record<string, string>>(e: T) =>
  z.enum(Object.values(e) as [string, ...string[]]);

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(120),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const createGardenSchema = z.object({
  name: z.string().min(1).max(120),
  location: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});
export type CreateGardenInput = z.infer<typeof createGardenSchema>;

export const updateGardenSchema = createGardenSchema.partial();
export type UpdateGardenInput = z.infer<typeof updateGardenSchema>;

export const createPlotSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  areaSqMeters: z.number().positive(),
  soilType: z.string().min(1).max(80),
  irrigationType: zEnum(IrrigationType),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});
export type CreatePlotInput = z.infer<typeof createPlotSchema>;

export const updatePlotSchema = createPlotSchema.partial();
export type UpdatePlotInput = z.infer<typeof updatePlotSchema>;

export const createPlantSchema = z.object({
  species: z.string().min(1).max(120),
  scientificName: z.string().max(160).nullable().optional(),
  variety: z.string().max(120).nullable().optional(),
  plotId: z.string().uuid(),
  plantingId: z.string().uuid().nullable().optional(),
  plantedAt: z.coerce.date(),
  status: zEnum(PlantStatus).default(PlantStatus.SEEDLING),
  positionLabel: z.string().max(120).nullable().optional(),
  careNotes: z.string().max(2000).nullable().optional(),
  waterRequirement: z.string().max(500).nullable().optional(),
  sunlightRequirement: z.string().max(500).nullable().optional(),
  spacingCm: z.number().positive().nullable().optional(),
  expectedYieldKg: z.number().nonnegative().nullable().optional(),
  actualYieldKg: z.number().nonnegative().optional(),
  expectedHarvestAt: z.coerce.date().nullable().optional(),
});
export type CreatePlantInput = z.infer<typeof createPlantSchema>;

export const updatePlantSchema = createPlantSchema
  .omit({ plotId: true })
  .partial();
export type UpdatePlantInput = z.infer<typeof updatePlantSchema>;

// Discriminated union: each care task type carries slightly different
// metadata. Zod mirrors this with `discriminatedUnion`, and the inferred
// TS type comes out as a real discriminated union you can narrow with a
// switch on `type` — the same shape you've been practicing in the
// exercises, just applied to a real form payload instead of a katas.
const baseCareTaskFields = {
  plantId: z.string().uuid(),
  intervalDays: z.number().int().positive(),
  notes: z.string().max(500).optional(),
  nextDueAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
};

export const createCareTaskSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(CareTaskType.WATER),
    waterAmountLiters: z.number().positive(),
    ...baseCareTaskFields,
  }),
  z.object({
    type: z.literal(CareTaskType.FERTILIZE),
    fertilizerName: z.string().min(1).max(120),
    ...baseCareTaskFields,
  }),
  z.object({
    type: z.literal(CareTaskType.PEST_CONTROL),
    method: z.string().min(1).max(120),
    ...baseCareTaskFields,
  }),
  z.object({
    type: z.literal(CareTaskType.PRUNE),
    ...baseCareTaskFields,
  }),
  z.object({
    type: z.literal(CareTaskType.HARVEST),
    ...baseCareTaskFields,
  }),
  z.object({
    type: z.literal(CareTaskType.OBSERVE),
    ...baseCareTaskFields,
  }),
  z.object({
    type: z.literal(CareTaskType.DRIP_MAINTENANCE),
    waterIntakeMM: z.number().nonnegative().optional(),
    method: z.string().max(120).optional(),
    ...baseCareTaskFields,
  }),
  z.object({
    type: z.literal(CareTaskType.WEED),
    ...baseCareTaskFields,
  }),
  z.object({
    type: z.literal(CareTaskType.MULCH),
    ...baseCareTaskFields,
  }),
  z.object({
    type: z.literal(CareTaskType.TRANSPLANT),
    ...baseCareTaskFields,
  }),
  z.object({
    type: z.literal(CareTaskType.TRELLIS),
    ...baseCareTaskFields,
  }),
  z.object({
    type: z.literal(CareTaskType.SOIL_TEST),
    method: z.string().max(120).optional(),
    ...baseCareTaskFields,
  }),
  z.object({
    type: z.literal(CareTaskType.POLLINATE),
    method: z.string().max(120).optional(),
    ...baseCareTaskFields,
  }),
]);
export type CreateCareTaskInput = z.infer<typeof createCareTaskSchema>;

export const updateCareTaskSchema = z.object({
  type: zEnum(CareTaskType).optional(),
  intervalDays: z.number().int().positive().optional(),
  nextDueAt: z.coerce.date().optional(),
  notes: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
  waterAmountLiters: z.number().positive().nullable().optional(),
  waterIntakeMM: z.number().nonnegative().nullable().optional(),
  fertilizerName: z.string().max(120).nullable().optional(),
  method: z.string().max(120).nullable().optional(),
  harvestQuantityKg: z.number().nonnegative().nullable().optional(),
  harvestQualityDesc: z.string().max(500).nullable().optional(),
});
export type UpdateCareTaskInput = z.infer<typeof updateCareTaskSchema>;

export const completeCareTaskSchema = z.object({
  completedAt: z.coerce.date().default(() => new Date()),
  note: z.string().max(500).optional(),
});
export type CompleteCareTaskInput = z.infer<typeof completeCareTaskSchema>;

export const createObservationSchema = z.object({
  plantId: z.string().uuid(),
  healthStatus: zEnum(HealthStatus),
  note: z.string().min(1).max(1000),
});
export type CreateObservationInput = z.infer<typeof createObservationSchema>;

export const updateObservationSchema = createObservationSchema
  .omit({ plantId: true })
  .partial();
export type UpdateObservationInput = z.infer<typeof updateObservationSchema>;

export const createMediaSchema = z.object({
  type: zEnum(MediaType),
  url: z.string().url().max(4000),
  caption: z.string().max(500).optional(),
  capturedAt: z.coerce.date().optional(),
  isCover: z.boolean().default(false),
});
export const updateMediaSchema = createMediaSchema.partial();
export type CreateMediaInput = z.infer<typeof createMediaSchema>;
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;

export const createPlotTaskSchema = z.object({
  type: zEnum(PlotTaskType),
  title: z.string().min(1).max(160),
  intervalDays: z.number().int().positive(),
  nextDueAt: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});
export const updatePlotTaskSchema = createPlotTaskSchema.partial();
export type CreatePlotTaskInput = z.infer<typeof createPlotTaskSchema>;
export type UpdatePlotTaskInput = z.infer<typeof updatePlotTaskSchema>;

export const registerUserRoleSchema = zEnum(UserRole);
