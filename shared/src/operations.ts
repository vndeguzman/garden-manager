import { z } from "zod";
import type { MediaType, PlantStatus } from "./enums";
import type { PlantDto, PlotDto } from "./api-types";

const values = <T extends Record<string, string>>(value: T) =>
  z.enum(Object.values(value) as [string, ...string[]]);

export const ScopeType = {
  GARDEN: "GARDEN",
  PLOT: "PLOT",
  PLOT_ZONE: "PLOT_ZONE",
  PLANTING: "PLANTING",
  PLANT: "PLANT",
  ASSET: "ASSET",
  TOOL: "TOOL",
  WATER_SOURCE: "WATER_SOURCE",
  MEDIUM_BATCH: "MEDIUM_BATCH",
  HARVEST_LOT: "HARVEST_LOT",
} as const;
export type ScopeType = (typeof ScopeType)[keyof typeof ScopeType];

export const MapGeometryType = {
  POINT: "POINT",
  LINE: "LINE",
  POLYGON: "POLYGON",
  RECTANGLE: "RECTANGLE",
  CIRCLE: "CIRCLE",
} as const;
export type MapGeometryType = (typeof MapGeometryType)[keyof typeof MapGeometryType];

export const MapEntityType = {
  PLOT: "PLOT",
  PLOT_ZONE: "PLOT_ZONE",
  PLANTING: "PLANTING",
  PLANT: "PLANT",
  TREE: "TREE",
  ASSET: "ASSET",
  TOOL: "TOOL",
  ELEVATION: "ELEVATION",
  CUSTOM: "CUSTOM",
} as const;
export type MapEntityType = (typeof MapEntityType)[keyof typeof MapEntityType];

export const AssetCategory = {
  WATER: "WATER",
  IRRIGATION: "IRRIGATION",
  STRUCTURE: "STRUCTURE",
  ENVIRONMENT: "ENVIRONMENT",
  INSTRUMENT: "INSTRUMENT",
  STORAGE: "STORAGE",
  OTHER: "OTHER",
} as const;
export type AssetCategory = (typeof AssetCategory)[keyof typeof AssetCategory];

export const AssetStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  DAMAGED: "DAMAGED",
  MAINTENANCE: "MAINTENANCE",
  RETIRED: "RETIRED",
} as const;
export type AssetStatus = (typeof AssetStatus)[keyof typeof AssetStatus];

export const ToolStatus = {
  AVAILABLE: "AVAILABLE",
  RESERVED: "RESERVED",
  IN_USE: "IN_USE",
  LOANED: "LOANED",
  MAINTENANCE_DUE: "MAINTENANCE_DUE",
  UNDER_REPAIR: "UNDER_REPAIR",
  DAMAGED: "DAMAGED",
  MISSING: "MISSING",
  RETIRED: "RETIRED",
} as const;
export type ToolStatus = (typeof ToolStatus)[keyof typeof ToolStatus];

export const WorkTaskCategory = {
  CARE: "CARE",
  OBSERVATION: "OBSERVATION",
  MEASUREMENT: "MEASUREMENT",
  IRRIGATION: "IRRIGATION",
  APPLICATION: "APPLICATION",
  HARVEST: "HARVEST",
  REPAIR: "REPAIR",
  IMPROVEMENT: "IMPROVEMENT",
  INVENTORY: "INVENTORY",
  SAFETY: "SAFETY",
  CALIBRATION: "CALIBRATION",
  DATA_QUALITY: "DATA_QUALITY",
} as const;
export type WorkTaskCategory = (typeof WorkTaskCategory)[keyof typeof WorkTaskCategory];

export const WorkTaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  SNOOZED: "SNOOZED",
  CANCELLED: "CANCELLED",
} as const;
export type WorkTaskStatus = (typeof WorkTaskStatus)[keyof typeof WorkTaskStatus];

export const TaskCompletionMode = {
  WHOLE_SCOPE: "WHOLE_SCOPE",
  PER_TARGET: "PER_TARGET",
  QUANTITY_BASED: "QUANTITY_BASED",
  CHECKLIST: "CHECKLIST",
} as const;
export type TaskCompletionMode = (typeof TaskCompletionMode)[keyof typeof TaskCompletionMode];

export const MaterialCategory = {
  FERTILIZER: "FERTILIZER",
  AMENDMENT: "AMENDMENT",
  GROWING_MEDIUM: "GROWING_MEDIUM",
  SEED: "SEED",
  PROPAGATION: "PROPAGATION",
  PESTICIDE: "PESTICIDE",
  BIOLOGICAL: "BIOLOGICAL",
  ENZYME: "ENZYME",
  HORMONE: "HORMONE",
  CONSUMABLE: "CONSUMABLE",
  OTHER: "OTHER",
} as const;
export type MaterialCategory = (typeof MaterialCategory)[keyof typeof MaterialCategory];

export const InventoryTransactionType = {
  PURCHASE: "PURCHASE",
  CONSUME: "CONSUME",
  TRANSFER: "TRANSFER",
  ADJUST: "ADJUST",
  EXPIRE: "EXPIRE",
  WASTE: "WASTE",
  RETURN: "RETURN",
  SPLIT: "SPLIT",
  MERGE: "MERGE",
} as const;
export type InventoryTransactionType =
  (typeof InventoryTransactionType)[keyof typeof InventoryTransactionType];

export const FactorValueType = {
  NUMERIC: "NUMERIC",
  NUMERIC_RANGE: "NUMERIC_RANGE",
  ORDINAL: "ORDINAL",
  CATEGORY: "CATEGORY",
  BOOLEAN: "BOOLEAN",
  PRESENCE_ABSENCE: "PRESENCE_ABSENCE",
  TEXT: "TEXT",
} as const;
export type FactorValueType = (typeof FactorValueType)[keyof typeof FactorValueType];

export const ObservationMode = {
  AUTOMATIC_SENSOR: "AUTOMATIC_SENSOR",
  MANUAL_INSTRUMENT: "MANUAL_INSTRUMENT",
  TEST_KIT: "TEST_KIT",
  LAB_RESULT: "LAB_RESULT",
  MANUAL_NUMERIC: "MANUAL_NUMERIC",
  QUALITATIVE_OBSERVATION: "QUALITATIVE_OBSERVATION",
  USER_ESTIMATE: "USER_ESTIMATE",
  DERIVED_CALCULATION: "DERIVED_CALCULATION",
  IMPORTED_DATA: "IMPORTED_DATA",
} as const;
export type ObservationMode = (typeof ObservationMode)[keyof typeof ObservationMode];

export const EvidenceQuality = {
  LAB_CONFIRMED: "LAB_CONFIRMED",
  CALIBRATED_INSTRUMENT: "CALIBRATED_INSTRUMENT",
  UNCALIBRATED_INSTRUMENT: "UNCALIBRATED_INSTRUMENT",
  TEST_KIT: "TEST_KIT",
  REPEATED_MANUAL_OBSERVATION: "REPEATED_MANUAL_OBSERVATION",
  SINGLE_MANUAL_OBSERVATION: "SINGLE_MANUAL_OBSERVATION",
  DERIVED_ESTIMATE: "DERIVED_ESTIMATE",
  UNKNOWN: "UNKNOWN",
} as const;
export type EvidenceQuality = (typeof EvidenceQuality)[keyof typeof EvidenceQuality];

export const AssessmentStatus = {
  UNKNOWN: "UNKNOWN",
  OPTIMAL: "OPTIMAL",
  WATCH: "WATCH",
  LOW: "LOW",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
  POSSIBLE_DEFICIENCY: "POSSIBLE_DEFICIENCY",
  PROJECTED_DEFICIENCY: "PROJECTED_DEFICIENCY",
  CONFIRMED_DEFICIENCY: "CONFIRMED_DEFICIENCY",
  POSSIBLE_EXCESS: "POSSIBLE_EXCESS",
  PROJECTED_EXCESS: "PROJECTED_EXCESS",
  CONFIRMED_EXCESS: "CONFIRMED_EXCESS",
} as const;
export type AssessmentStatus = (typeof AssessmentStatus)[keyof typeof AssessmentStatus];

export const IncidentPriority = {
  P0: "P0",
  P1: "P1",
  P2: "P2",
  P3: "P3",
  P4: "P4",
} as const;
export type IncidentPriority = (typeof IncidentPriority)[keyof typeof IncidentPriority];

export const IncidentStatus = {
  NEW: "NEW",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  IN_PROGRESS: "IN_PROGRESS",
  SNOOZED: "SNOOZED",
  RESOLVED: "RESOLVED",
  DISMISSED: "DISMISSED",
} as const;
export type IncidentStatus = (typeof IncidentStatus)[keyof typeof IncidentStatus];

export const NotificationChannel = {
  WEB_PUSH: "WEB_PUSH",
  EMAIL: "EMAIL",
  SPEAKER: "SPEAKER",
} as const;
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const MarketType = {
  INPUT_SUPPLIER: "INPUT_SUPPLIER",
  FARMGATE: "FARMGATE",
  WHOLESALE: "WHOLESALE",
  RETAIL: "RETAIL",
  CONTRACT: "CONTRACT",
  ONLINE: "ONLINE",
  INTERNAL: "INTERNAL",
} as const;
export type MarketType = (typeof MarketType)[keyof typeof MarketType];

export const DispositionType = {
  WHOLESALE: "WHOLESALE",
  RETAIL: "RETAIL",
  CONTRACT_BUYER: "CONTRACT_BUYER",
  ONLINE: "ONLINE",
  PERSONAL_USE: "PERSONAL_USE",
  DONATION: "DONATION",
  SEED_SAVING: "SEED_SAVING",
  ANIMAL_FEED: "ANIMAL_FEED",
  COMPOST: "COMPOST",
  WASTE: "WASTE",
} as const;
export type DispositionType = (typeof DispositionType)[keyof typeof DispositionType];

export interface MapGeometry {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: Array<{ x: number; y: number }>;
}

export interface GardenMapDto {
  id: string;
  gardenId: string;
  width: number;
  height: number;
  unit: string;
  gridSize: number;
  backgroundImageUrl: string | null;
  backgroundOpacity: number;
  showContours: boolean;
  contourInterval: number;
  createdAt: string;
  updatedAt: string;
}

export interface MapFeatureDto {
  id: string;
  gardenMapId: string;
  entityType: MapEntityType;
  entityId: string | null;
  label: string;
  geometryType: MapGeometryType;
  geometry: MapGeometry;
  rotation: number;
  zIndex: number;
  locked: boolean;
  hidden: boolean;
  style: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ElevationPointDto {
  id: string;
  gardenMapId: string;
  x: number;
  y: number;
  elevation: number;
  unit: string;
  datum: string;
  source: string;
  accuracy: number | null;
  measuredAt: string;
  confidence: number;
  notes: string | null;
}

export interface PlotZoneDto {
  id: string;
  plotId: string;
  name: string;
  kind: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlantingDto {
  id: string;
  plotId: string;
  zoneId: string | null;
  requirementProfileId: string | null;
  preferredMarketId: string | null;
  marketCommodity: string | null;
  name: string;
  species: string;
  scientificName: string | null;
  variety: string | null;
  plantedAt: string;
  quantity: number;
  trackingMode: string;
  status: PlantStatus;
  expectedYieldMin: number | null;
  expectedYieldMax: number | null;
  yieldUnit: string | null;
  expectedHarvestStart: string | null;
  expectedHarvestEnd: string | null;
  notes: string | null;
  individualPlantCount: number;
  estimatedMarketValue: number | null;
  estimatedMarketCurrency: string | null;
  estimatedMarketPriceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GardenAssetDto {
  id: string;
  gardenId: string;
  category: AssetCategory;
  subtype: string;
  name: string;
  status: AssetStatus;
  installedAt: string | null;
  capacity: number | null;
  capacityUnit: string | null;
  baseElevation: number | null;
  topElevation: number | null;
  specifications: Record<string, unknown> | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetConnectionDto {
  id: string;
  fromAssetId: string;
  toAssetId: string;
  connectionType: string;
  direction: string;
  capacity: number | null;
  capacityUnit: string | null;
  status: string;
  notes: string | null;
}

export interface EnvironmentalInfluenceDto {
  id: string;
  assetId: string | null;
  mapFeatureId: string | null;
  factorCode: string;
  effectType: string;
  geometry: MapGeometry;
  magnitude: number | null;
  unitOrScale: string | null;
  direction: number | null;
  seasonalStart: string | null;
  seasonalEnd: string | null;
  confidence: number;
  evidence: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ToolDto {
  id: string;
  gardenId: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  status: ToolStatus;
  condition: string;
  purchaseDate: string | null;
  purchaseCost: number | null;
  replacementValue: number | null;
  currency: string;
  storageLocation: string | null;
  currentHolder: string | null;
  powerSource: string | null;
  specifications: Record<string, unknown> | null;
  maintenanceDueAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialDto {
  id: string;
  gardenId: string;
  name: string;
  brand: string | null;
  category: MaterialCategory;
  formulation: string | null;
  defaultUnit: string;
  manufacturer: string | null;
  composition: Record<string, unknown> | null;
  profile: Record<string, unknown> | null;
  storageInstructions: string | null;
  notes: string | null;
  totalQuantity: number;
  lotCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryLocationDto {
  id: string;
  gardenId: string;
  name: string;
  description: string | null;
}

export interface InventoryLotDto {
  id: string;
  materialId: string;
  locationId: string | null;
  lotNumber: string | null;
  supplier: string | null;
  purchaseDate: string | null;
  openedAt: string | null;
  expiryDate: string | null;
  initialQuantity: number;
  currentQuantity: number;
  unit: string;
  unitCost: number | null;
  currency: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransactionDto {
  id: string;
  lotId: string;
  type: InventoryTransactionType;
  quantity: number;
  unit: string;
  occurredAt: string;
  reference: string | null;
  notes: string | null;
}

export interface ApplicationLineDto {
  id: string;
  materialId: string;
  inventoryLotId: string | null;
  productAmount: number;
  productUnit: string;
  carrierVolume: number | null;
  carrierUnit: string | null;
  rateValue: number | null;
  rateUnit: string | null;
  notes: string | null;
}

export interface ApplicationEventDto {
  id: string;
  gardenId: string;
  title: string;
  targetType: ScopeType;
  targetId: string;
  targetName: string;
  targetSnapshot: unknown;
  appliedAt: string;
  method: string | null;
  treatedArea: number | null;
  treatedCount: number | null;
  weather: string | null;
  notes: string | null;
  lines: ApplicationLineDto[];
  createdAt: string;
  updatedAt: string;
}

export interface FactorDefinitionDto {
  id: string;
  gardenId: string;
  category: string;
  code: string;
  name: string;
  description: string | null;
  valueType: FactorValueType;
  supportedUnits: string[];
  qualitativeScale: string[];
}

export interface RequirementRangeDto {
  id: string;
  profileId: string;
  factorId: string;
  growthStage: string | null;
  criticalMinimum: number | null;
  targetMinimum: number | null;
  targetMaximum: number | null;
  criticalMaximum: number | null;
  targetOrdinal: string[];
  preferredUnit: string | null;
  notes: string | null;
}

export interface RequirementProfileDto {
  id: string;
  gardenId: string;
  name: string;
  species: string | null;
  scientificName: string | null;
  variety: string | null;
  growingMethod: string | null;
  source: string | null;
  confidence: number;
  requirements: RequirementRangeDto[];
}

export interface InstrumentDto {
  id: string;
  gardenId: string;
  name: string;
  type: string;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  supportedFactors: string[];
  supportedUnits: string[];
  resolution: string | null;
  accuracy: string | null;
  calibrationIntervalDays: number | null;
  lastCalibrationAt: string | null;
  nextCalibrationAt: string | null;
  status: string;
}

export interface MeasurementDto {
  id: string;
  gardenId: string;
  factorId: string;
  targetType: ScopeType;
  targetId: string;
  targetName: string;
  numericValue: number | null;
  numericMinimum: number | null;
  numericMaximum: number | null;
  textValue: string | null;
  unit: string | null;
  mode: ObservationMode;
  evidenceQuality: EvidenceQuality;
  instrumentId: string | null;
  measuredAt: string;
  confidence: number;
  depthCm: number | null;
  locationX: number | null;
  locationY: number | null;
  notes: string | null;
}

export interface FactorAssessmentDto {
  id: string;
  gardenId: string;
  factorId: string;
  targetType: ScopeType;
  targetId: string;
  targetName: string;
  status: AssessmentStatus;
  evidence: string;
  projectedValue: number | null;
  projectedUnit: string | null;
  projectionHorizonDays: number | null;
  confidence: number;
  assumptions: Record<string, unknown> | null;
  assessedAt: string;
  notes: string | null;
}

export interface WorkTaskProgressDto {
  id: string;
  taskId: string;
  targetType: ScopeType;
  targetId: string;
  targetName: string;
  status: WorkTaskStatus;
  completedAt: string | null;
  notes: string | null;
}

export interface WorkTaskDto {
  id: string;
  gardenId: string;
  incidentId: string | null;
  title: string;
  category: WorkTaskCategory;
  targetType: ScopeType;
  targetId: string;
  targetName: string;
  affectedSnapshot: unknown;
  completionMode: TaskCompletionMode;
  status: WorkTaskStatus;
  priority: number;
  dueAt: string | null;
  recurrenceDays: number | null;
  nextDueAt: string | null;
  estimatedMinutes: number | null;
  estimatedCost: number | null;
  currency: string;
  requiredTools: string[];
  requiredMaterials: string[];
  notes: string | null;
  progress: WorkTaskProgressDto[];
  createdAt: string;
  updatedAt: string;
}

export interface IncidentDto {
  id: string;
  gardenId: string;
  fingerprint: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  category: string;
  title: string;
  summary: string;
  targetType: ScopeType;
  targetId: string;
  targetName: string;
  score: number;
  confidence: number;
  reasons: string[];
  recommendedAction: string | null;
  detectedAt: string;
  dueAt: string | null;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}

export interface NotificationEndpointDto {
  id: string;
  gardenId: string;
  userId: string | null;
  channel: NotificationChannel;
  label: string;
  address: string | null;
  config: Record<string, unknown> | null;
  enabled: boolean;
  minimumPriority: IncidentPriority;
  quietStart: string | null;
  quietEnd: string | null;
  criticalOverride: boolean;
  verifiedAt: string | null;
}

export interface HarvestEventDto {
  id: string;
  gardenId: string;
  plantingId: string | null;
  plantId: string | null;
  quantity: number;
  unit: string;
  grade: string | null;
  quality: string | null;
  disposition: DispositionType;
  harvestedAt: string;
  expectedValue: number | null;
  realizedValue: number | null;
  currency: string;
  notes: string | null;
}

export interface MarketPriceDto {
  id: string;
  marketId: string;
  commodity: string;
  variety: string | null;
  grade: string | null;
  form: string | null;
  minimumPrice: number | null;
  typicalPrice: number;
  maximumPrice: number | null;
  quantityUnit: string;
  source: string | null;
  observedAt: string;
}

export interface MarketDto {
  id: string;
  gardenId: string;
  name: string;
  type: MarketType;
  location: string | null;
  currency: string;
  active: boolean;
  prices: MarketPriceDto[];
}

export interface SaleDto {
  id: string;
  gardenId: string;
  marketId: string | null;
  buyer: string | null;
  item: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  soldAt: string;
  notes: string | null;
}

export interface EntityMediaDto {
  id: string;
  gardenId: string;
  targetType: ScopeType;
  targetId: string;
  type: MediaType;
  url: string;
  caption: string | null;
  capturedAt: string;
  isCover: boolean;
}

export interface WorkspaceSummaryDto {
  openTasks: number;
  criticalIncidents: number;
  lowStockLots: number;
  expiringLots: number;
  harvestsDue: number;
  totalInventoryValue: number;
  expectedHarvestValue: number;
}

export interface GardenWorkspaceDto {
  map: GardenMapDto;
  plots: PlotDto[];
  plants: PlantDto[];
  features: MapFeatureDto[];
  elevationPoints: ElevationPointDto[];
  zones: PlotZoneDto[];
  plantings: PlantingDto[];
  assets: GardenAssetDto[];
  connections: AssetConnectionDto[];
  environmentalInfluences: EnvironmentalInfluenceDto[];
  tools: ToolDto[];
  materials: MaterialDto[];
  inventoryLocations: InventoryLocationDto[];
  inventoryLots: InventoryLotDto[];
  inventoryTransactions: InventoryTransactionDto[];
  applications: ApplicationEventDto[];
  factors: FactorDefinitionDto[];
  requirementProfiles: RequirementProfileDto[];
  instruments: InstrumentDto[];
  measurements: MeasurementDto[];
  assessments: FactorAssessmentDto[];
  tasks: WorkTaskDto[];
  incidents: IncidentDto[];
  notificationEndpoints: NotificationEndpointDto[];
  harvestEvents: HarvestEventDto[];
  markets: MarketDto[];
  sales: SaleDto[];
  media: EntityMediaDto[];
  summary: WorkspaceSummaryDto;
}

const optionalText = (max = 2000) => z.string().max(max).nullable().optional();
const optionalNumber = z.number().finite().nullable().optional();
const jsonRecord = z.record(z.unknown()).nullable().optional();

export const mapGeometrySchema = z.object({
  x: z.number().finite().optional(),
  y: z.number().finite().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  radius: z.number().positive().optional(),
  points: z.array(z.object({ x: z.number().finite(), y: z.number().finite() })).optional(),
});

export const updateGardenMapSchema = z.object({
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  unit: z.string().min(1).max(20).optional(),
  gridSize: z.number().positive().optional(),
  backgroundImageUrl: z.string().url().nullable().optional(),
  backgroundOpacity: z.number().min(0).max(1).optional(),
  showContours: z.boolean().optional(),
  contourInterval: z.number().positive().optional(),
});

export const createMapFeatureSchema = z.object({
  entityType: values(MapEntityType),
  entityId: z.string().uuid().nullable().optional(),
  label: z.string().min(1).max(160),
  geometryType: values(MapGeometryType),
  geometry: mapGeometrySchema,
  rotation: z.number().finite().optional(),
  zIndex: z.number().int().optional(),
  locked: z.boolean().optional(),
  hidden: z.boolean().optional(),
  style: jsonRecord,
});
export const updateMapFeatureSchema = createMapFeatureSchema.partial();

export const createElevationPointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  elevation: z.number().finite(),
  unit: z.string().min(1).max(20).optional(),
  datum: z.string().min(1).max(80).optional(),
  source: z.string().min(1).max(120).optional(),
  accuracy: optionalNumber,
  measuredAt: z.coerce.date().optional(),
  confidence: z.number().int().min(0).max(100).optional(),
  notes: optionalText(),
});
export const updateElevationPointSchema = createElevationPointSchema.partial();

export const createZoneSchema = z.object({
  plotId: z.string().uuid(),
  name: z.string().min(1).max(120),
  kind: z.string().min(1).max(80),
  description: optionalText(),
});
export const updateZoneSchema = createZoneSchema.omit({ plotId: true }).partial();

export const createPlantingSchema = z.object({
  plotId: z.string().uuid(),
  zoneId: z.string().uuid().nullable().optional(),
  requirementProfileId: z.string().uuid().nullable().optional(),
  preferredMarketId: z.string().uuid().nullable().optional(),
  marketCommodity: optionalText(160),
  name: z.string().min(1).max(160),
  species: z.string().min(1).max(120),
  scientificName: optionalText(160),
  variety: optionalText(120),
  plantedAt: z.coerce.date(),
  quantity: z.number().int().positive().optional(),
  trackingMode: z.enum(["BATCH", "INDIVIDUAL"]).optional(),
  status: z.string().min(1),
  expectedYieldMin: optionalNumber,
  expectedYieldMax: optionalNumber,
  yieldUnit: optionalText(40),
  expectedHarvestStart: z.coerce.date().nullable().optional(),
  expectedHarvestEnd: z.coerce.date().nullable().optional(),
  notes: optionalText(),
});
export const updatePlantingSchema = createPlantingSchema.omit({ plotId: true }).partial();

export const createAssetSchema = z.object({
  category: values(AssetCategory),
  subtype: z.string().min(1).max(120),
  name: z.string().min(1).max(160),
  status: values(AssetStatus).optional(),
  installedAt: z.coerce.date().nullable().optional(),
  capacity: optionalNumber,
  capacityUnit: optionalText(40),
  baseElevation: optionalNumber,
  topElevation: optionalNumber,
  specifications: jsonRecord,
  notes: optionalText(),
});
export const updateAssetSchema = createAssetSchema.partial();

export const createConnectionSchema = z.object({
  fromAssetId: z.string().uuid(),
  toAssetId: z.string().uuid(),
  connectionType: z.string().min(1).max(100),
  direction: z.string().max(40).optional(),
  capacity: optionalNumber,
  capacityUnit: optionalText(40),
  status: z.string().max(40).optional(),
  notes: optionalText(),
});
export const updateConnectionSchema = createConnectionSchema.partial();

export const createEnvironmentalInfluenceSchema = z.object({
  assetId: z.string().uuid().nullable().optional(),
  mapFeatureId: z.string().uuid().nullable().optional(),
  factorCode: z.string().min(1).max(100),
  effectType: z.string().min(1).max(100),
  geometry: mapGeometrySchema.optional().default({}),
  magnitude: optionalNumber,
  unitOrScale: optionalText(60),
  direction: optionalNumber,
  seasonalStart: z.coerce.date().nullable().optional(),
  seasonalEnd: z.coerce.date().nullable().optional(),
  confidence: z.number().int().min(0).max(100).optional(),
  evidence: optionalText(1000),
});
export const updateEnvironmentalInfluenceSchema = createEnvironmentalInfluenceSchema.partial();

export const createToolSchema = z.object({
  name: z.string().min(1).max(160),
  category: z.string().min(1).max(100),
  brand: optionalText(100),
  model: optionalText(100),
  serialNumber: optionalText(120),
  status: values(ToolStatus).optional(),
  condition: z.string().max(80).optional(),
  purchaseDate: z.coerce.date().nullable().optional(),
  purchaseCost: optionalNumber,
  replacementValue: optionalNumber,
  currency: z.string().length(3).optional(),
  storageLocation: optionalText(160),
  currentHolder: optionalText(160),
  powerSource: optionalText(100),
  specifications: jsonRecord,
  maintenanceDueAt: z.coerce.date().nullable().optional(),
  notes: optionalText(),
});
export const updateToolSchema = createToolSchema.partial();

export const createMaterialSchema = z.object({
  name: z.string().min(1).max(160),
  brand: optionalText(120),
  category: values(MaterialCategory),
  formulation: optionalText(120),
  defaultUnit: z.string().min(1).max(40),
  manufacturer: optionalText(160),
  composition: jsonRecord,
  profile: jsonRecord,
  storageInstructions: optionalText(),
  notes: optionalText(),
});
export const updateMaterialSchema = createMaterialSchema.partial();

export const createInventoryLocationSchema = z.object({
  name: z.string().min(1).max(160),
  description: optionalText(),
});
export const updateInventoryLocationSchema = createInventoryLocationSchema.partial();

export const createInventoryLotSchema = z.object({
  materialId: z.string().uuid(),
  locationId: z.string().uuid().nullable().optional(),
  lotNumber: optionalText(120),
  supplier: optionalText(160),
  purchaseDate: z.coerce.date().nullable().optional(),
  openedAt: z.coerce.date().nullable().optional(),
  expiryDate: z.coerce.date().nullable().optional(),
  initialQuantity: z.number().nonnegative(),
  currentQuantity: z.number().nonnegative().optional(),
  unit: z.string().min(1).max(40),
  unitCost: optionalNumber,
  currency: z.string().length(3).optional(),
  status: z.string().max(40).optional(),
  notes: optionalText(),
});
export const updateInventoryLotSchema = createInventoryLotSchema
  .omit({ materialId: true, initialQuantity: true })
  .partial();

export const createInventoryTransactionSchema = z.object({
  type: values(InventoryTransactionType),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(40),
  occurredAt: z.coerce.date().optional(),
  reference: optionalText(160),
  notes: optionalText(),
});

export const createApplicationSchema = z.object({
  title: z.string().min(1).max(180),
  targetType: values(ScopeType),
  targetId: z.string().min(1),
  targetName: z.string().min(1).max(180),
  targetSnapshot: z.unknown().optional(),
  appliedAt: z.coerce.date().optional(),
  method: optionalText(160),
  treatedArea: optionalNumber,
  treatedCount: z.number().int().nonnegative().nullable().optional(),
  weather: optionalText(240),
  notes: optionalText(),
  lines: z
    .array(
      z.object({
        materialId: z.string().uuid(),
        inventoryLotId: z.string().uuid().nullable().optional(),
        productAmount: z.number().positive(),
        productUnit: z.string().min(1).max(40),
        carrierVolume: optionalNumber,
        carrierUnit: optionalText(40),
        rateValue: optionalNumber,
        rateUnit: optionalText(60),
        notes: optionalText(),
      }),
    )
    .min(1),
});

export const createFactorSchema = z.object({
  category: z.string().min(1).max(100),
  code: z.string().min(1).max(100),
  name: z.string().min(1).max(160),
  description: optionalText(),
  valueType: values(FactorValueType),
  supportedUnits: z.array(z.string().max(40)).optional(),
  qualitativeScale: z.array(z.string().max(80)).optional(),
});
export const updateFactorSchema = createFactorSchema.partial();

export const createRequirementProfileSchema = z.object({
  name: z.string().min(1).max(160),
  species: optionalText(120),
  scientificName: optionalText(160),
  variety: optionalText(120),
  growingMethod: optionalText(120),
  source: optionalText(500),
  confidence: z.number().int().min(0).max(100).optional(),
});
export const updateRequirementProfileSchema = createRequirementProfileSchema.partial();

export const createRequirementRangeSchema = z.object({
  factorId: z.string().uuid(),
  growthStage: optionalText(80),
  criticalMinimum: optionalNumber,
  targetMinimum: optionalNumber,
  targetMaximum: optionalNumber,
  criticalMaximum: optionalNumber,
  targetOrdinal: z.array(z.string().max(80)).optional(),
  preferredUnit: optionalText(40),
  notes: optionalText(),
});
export const updateRequirementRangeSchema = createRequirementRangeSchema.partial();

export const createInstrumentSchema = z.object({
  name: z.string().min(1).max(160),
  type: z.string().min(1).max(120),
  manufacturer: optionalText(120),
  model: optionalText(120),
  serialNumber: optionalText(120),
  supportedFactors: z.array(z.string().max(100)).optional(),
  supportedUnits: z.array(z.string().max(40)).optional(),
  resolution: optionalText(100),
  accuracy: optionalText(100),
  calibrationIntervalDays: z.number().int().positive().nullable().optional(),
  lastCalibrationAt: z.coerce.date().nullable().optional(),
  nextCalibrationAt: z.coerce.date().nullable().optional(),
  status: z.string().max(40).optional(),
});
export const updateInstrumentSchema = createInstrumentSchema.partial();

export const createMeasurementSchema = z.object({
  factorId: z.string().uuid(),
  targetType: values(ScopeType),
  targetId: z.string().min(1),
  targetName: z.string().min(1).max(180),
  numericValue: optionalNumber,
  numericMinimum: optionalNumber,
  numericMaximum: optionalNumber,
  textValue: optionalText(500),
  unit: optionalText(40),
  mode: values(ObservationMode),
  evidenceQuality: values(EvidenceQuality),
  instrumentId: z.string().uuid().nullable().optional(),
  measuredAt: z.coerce.date().optional(),
  confidence: z.number().int().min(0).max(100).optional(),
  depthCm: optionalNumber,
  locationX: optionalNumber,
  locationY: optionalNumber,
  notes: optionalText(),
});
export const updateMeasurementSchema = createMeasurementSchema.partial();

export const createAssessmentSchema = z.object({
  factorId: z.string().uuid(),
  targetType: values(ScopeType),
  targetId: z.string().min(1),
  targetName: z.string().min(1).max(180),
  status: values(AssessmentStatus),
  evidence: z.string().min(1).max(1000),
  projectedValue: optionalNumber,
  projectedUnit: optionalText(40),
  projectionHorizonDays: z.number().int().positive().nullable().optional(),
  confidence: z.number().int().min(0).max(100).optional(),
  assumptions: jsonRecord,
  assessedAt: z.coerce.date().optional(),
  notes: optionalText(),
});
export const updateAssessmentSchema = createAssessmentSchema.partial();

export const createWorkTaskSchema = z.object({
  incidentId: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(180),
  category: values(WorkTaskCategory),
  targetType: values(ScopeType),
  targetId: z.string().min(1),
  targetName: z.string().min(1).max(180),
  affectedSnapshot: z.unknown().optional(),
  completionMode: values(TaskCompletionMode).optional(),
  status: values(WorkTaskStatus).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  dueAt: z.coerce.date().nullable().optional(),
  recurrenceDays: z.number().int().positive().nullable().optional(),
  nextDueAt: z.coerce.date().nullable().optional(),
  estimatedMinutes: z.number().int().nonnegative().nullable().optional(),
  estimatedCost: optionalNumber,
  currency: z.string().length(3).optional(),
  requiredTools: z.array(z.string()).optional(),
  requiredMaterials: z.array(z.string()).optional(),
  notes: optionalText(),
  affectedTargets: z
    .array(
      z.object({
        targetType: values(ScopeType),
        targetId: z.string().min(1),
        targetName: z.string().min(1).max(180),
      }),
    )
    .optional(),
});
export const updateWorkTaskSchema = createWorkTaskSchema.omit({ affectedTargets: true }).partial();

export const updateTaskProgressSchema = z.object({
  status: values(WorkTaskStatus),
  completedAt: z.coerce.date().nullable().optional(),
  notes: optionalText(),
});

export const updateIncidentSchema = z.object({
  priority: values(IncidentPriority).optional(),
  status: values(IncidentStatus).optional(),
  acknowledgedAt: z.coerce.date().nullable().optional(),
  resolvedAt: z.coerce.date().nullable().optional(),
});

export const createNotificationEndpointSchema = z.object({
  channel: values(NotificationChannel),
  label: z.string().min(1).max(160),
  address: optionalText(4000),
  config: jsonRecord,
  enabled: z.boolean().optional(),
  minimumPriority: values(IncidentPriority).optional(),
  quietStart: optionalText(10),
  quietEnd: optionalText(10),
  criticalOverride: z.boolean().optional(),
});
export const updateNotificationEndpointSchema = createNotificationEndpointSchema.partial();

export const createHarvestEventSchema = z.object({
  plantingId: z.string().uuid().nullable().optional(),
  plantId: z.string().uuid().nullable().optional(),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(40),
  grade: optionalText(80),
  quality: optionalText(240),
  disposition: values(DispositionType),
  harvestedAt: z.coerce.date().optional(),
  expectedValue: optionalNumber,
  realizedValue: optionalNumber,
  currency: z.string().length(3).optional(),
  notes: optionalText(),
});
export const updateHarvestEventSchema = createHarvestEventSchema.partial();

export const createMarketSchema = z.object({
  name: z.string().min(1).max(160),
  type: values(MarketType),
  location: optionalText(240),
  currency: z.string().length(3).optional(),
  active: z.boolean().optional(),
});
export const updateMarketSchema = createMarketSchema.partial();

export const createMarketPriceSchema = z.object({
  commodity: z.string().min(1).max(160),
  variety: optionalText(120),
  grade: optionalText(80),
  form: optionalText(80),
  minimumPrice: optionalNumber,
  typicalPrice: z.number().nonnegative(),
  maximumPrice: optionalNumber,
  quantityUnit: z.string().min(1).max(40),
  source: optionalText(500),
  observedAt: z.coerce.date().optional(),
});

export const createSaleSchema = z.object({
  marketId: z.string().uuid().nullable().optional(),
  buyer: optionalText(160),
  item: z.string().min(1).max(160),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(40),
  unitPrice: z.number().nonnegative(),
  totalAmount: z.number().nonnegative(),
  currency: z.string().length(3).optional(),
  soldAt: z.coerce.date().optional(),
  notes: optionalText(),
});
export const updateSaleSchema = createSaleSchema.partial();

export const createEntityMediaSchema = z.object({
  targetType: values(ScopeType),
  targetId: z.string().min(1),
  type: z.enum(["IMAGE", "VIDEO"]),
  url: z.string().url().max(4000),
  caption: optionalText(500),
  capturedAt: z.coerce.date().optional(),
  isCover: z.boolean().optional(),
});
export const updateEntityMediaSchema = createEntityMediaSchema.partial();
