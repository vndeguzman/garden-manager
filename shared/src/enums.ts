// Central place for all domain enums. Both Prisma (backend) and the
// frontend forms/badges read from these so the vocabulary never drifts.

export const UserRole = {
  OWNER: "OWNER",
  STAFF: "STAFF",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const IrrigationType = {
  DRIP: "DRIP",
  SPRINKLER: "SPRINKLER",
  MANUAL: "MANUAL",
  NONE: "NONE",
} as const;
export type IrrigationType = (typeof IrrigationType)[keyof typeof IrrigationType];

export const PlantStatus = {
  SEEDLING: "SEEDLING",
  GROWING: "GROWING",
  FLOWERING: "FLOWERING",
  FRUITING: "FRUITING",
  HARVESTED: "HARVESTED",
  REMOVED: "REMOVED",
} as const;
export type PlantStatus = (typeof PlantStatus)[keyof typeof PlantStatus];

export const CareTaskType = {
  WATER: "WATER",
  FERTILIZE: "FERTILIZE",
  PEST_CONTROL: "PEST_CONTROL",
  PRUNE: "PRUNE",
  HARVEST: "HARVEST",
  OBSERVE: "OBSERVE",
  DRIP_MAINTENANCE: "DRIP_MAINTENANCE",
  WEED: "WEED",
  MULCH: "MULCH",
  TRANSPLANT: "TRANSPLANT",
  TRELLIS: "TRELLIS",
  SOIL_TEST: "SOIL_TEST",
  POLLINATE: "POLLINATE",
} as const;
export type CareTaskType = (typeof CareTaskType)[keyof typeof CareTaskType];

export const PlotTaskType = {
  DRIP_INSPECTION: "DRIP_INSPECTION",
  DRIP_FLUSH: "DRIP_FLUSH",
  FILTER_CLEAN: "FILTER_CLEAN",
  SPRINKLER_INSPECTION: "SPRINKLER_INSPECTION",
  CHECK_MOISTURE: "CHECK_MOISTURE",
  WEED: "WEED",
  MULCH_CHECK: "MULCH_CHECK",
  SOIL_TEST: "SOIL_TEST",
  PEST_SCOUT: "PEST_SCOUT",
  BED_MAINTENANCE: "BED_MAINTENANCE",
} as const;
export type PlotTaskType = (typeof PlotTaskType)[keyof typeof PlotTaskType];

export const HealthStatus = {
  HEALTHY: "HEALTHY",
  DEFICIENCY_SUSPECTED: "DEFICIENCY_SUSPECTED",
  PEST_DAMAGE: "PEST_DAMAGE",
  DISEASE: "DISEASE",
  CRITICAL: "CRITICAL",
} as const;
export type HealthStatus = (typeof HealthStatus)[keyof typeof HealthStatus];

export const MediaType = {
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
} as const;
export type MediaType = (typeof MediaType)[keyof typeof MediaType];
