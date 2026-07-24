import type {
  CareTaskType,
  HealthStatus,
  IrrigationType,
  MediaType,
  PlantStatus,
  PlotTaskType,
  UserRole,
} from "./enums";

// DTOs describe what the wire format actually looks like (dates as ISO
// strings over JSON, no ORM internals) — deliberately separate from the
// Prisma models on the backend so the two are free to diverge.

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthResponseDto {
  user: UserDto;
  token: string;
}

export interface GardenDto {
  id: string;
  name: string;
  location: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  ownerId: string;
  plotCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlotDto {
  id: string;
  gardenId: string;
  name: string;
  description: string | null;
  areaSqMeters: number;
  soilType: string;
  irrigationType: IrrigationType;
  latitude: number | null;
  longitude: number | null;
  plantCount: number;
  mediaCount: number;
  openTaskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlantDto {
  id: string;
  plotId: string;
  plantingId: string | null;
  species: string;
  scientificName: string | null;
  variety: string | null;
  plantedAt: string;
  status: PlantStatus;
  positionLabel: string | null;
  careNotes: string | null;
  waterRequirement: string | null;
  sunlightRequirement: string | null;
  spacingCm: number | null;
  expectedYieldKg: number | null;
  actualYieldKg: number;
  expectedHarvestAt: string | null;
  ageDays: number;
  openTaskCount: number;
  mediaCount: number;
  createdAt: string;
  updatedAt: string;
}

export type CareTaskDueStatus = "OVERDUE" | "DUE_SOON" | "ON_TRACK";

export interface CareTaskDto {
  id: string;
  plantId: string;
  type: CareTaskType;
  intervalDays: number;
  lastCompletedAt: string | null;
  nextDueAt: string;
  dueStatus: CareTaskDueStatus;
  notes: string | null;
  isActive: boolean;
  waterAmountLiters?: number;
  waterIntakeMM?: number;
  fertilizerName?: string;
  method?: string;
  harvestQuantityKg?: number;
  harvestQualityDesc?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ObservationDto {
  id: string;
  plantId: string;
  healthStatus: HealthStatus;
  note: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaDto {
  id: string;
  type: MediaType;
  url: string;
  caption: string | null;
  capturedAt: string;
  isCover: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlotTaskDto {
  id: string;
  plotId: string;
  type: PlotTaskType;
  title: string;
  intervalDays: number;
  lastCompletedAt: string | null;
  nextDueAt: string;
  dueStatus: CareTaskDueStatus;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlotTaskTemplateDto {
  type: PlotTaskType;
  title: string;
  intervalDays: number;
  notes: string;
  recommendedFor: IrrigationType | "ALL";
}

export interface GardenDueTaskDto {
  id: string;
  scope: "PLANT" | "PLOT";
  targetId: string;
  targetName: string;
  type: CareTaskType | PlotTaskType;
  title: string;
  intervalDays: number;
  nextDueAt: string;
  dueStatus: CareTaskDueStatus;
  notes: string | null;
}

export interface PaginatedDto<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiErrorDto {
  message: string;
  code: string;
  fieldErrors?: Record<string, string[]>;
}
