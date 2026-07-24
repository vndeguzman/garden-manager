-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'STAFF');

-- CreateEnum
CREATE TYPE "IrrigationType" AS ENUM ('DRIP', 'SPRINKLER', 'MANUAL', 'NONE');

-- CreateEnum
CREATE TYPE "PlantStatus" AS ENUM ('SEEDLING', 'GROWING', 'FLOWERING', 'FRUITING', 'HARVESTED', 'REMOVED');

-- CreateEnum
CREATE TYPE "CareTaskType" AS ENUM ('WATER', 'FERTILIZE', 'PEST_CONTROL', 'PRUNE', 'HARVEST', 'OBSERVE', 'DRIP_MAINTENANCE', 'WEED', 'MULCH', 'TRANSPLANT', 'TRELLIS', 'SOIL_TEST', 'POLLINATE');

-- CreateEnum
CREATE TYPE "PlotTaskType" AS ENUM ('DRIP_INSPECTION', 'DRIP_FLUSH', 'FILTER_CLEAN', 'SPRINKLER_INSPECTION', 'CHECK_MOISTURE', 'WEED', 'MULCH_CHECK', 'SOIL_TEST', 'PEST_SCOUT', 'BED_MAINTENANCE');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'DEFICIENCY_SUSPECTED', 'PEST_DAMAGE', 'DISEASE', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('GARDEN', 'PLOT', 'PLOT_ZONE', 'PLANTING', 'PLANT', 'ASSET', 'TOOL', 'WATER_SOURCE', 'MEDIUM_BATCH', 'HARVEST_LOT');

-- CreateEnum
CREATE TYPE "MapGeometryType" AS ENUM ('POINT', 'LINE', 'POLYGON', 'RECTANGLE', 'CIRCLE');

-- CreateEnum
CREATE TYPE "MapEntityType" AS ENUM ('PLOT', 'PLOT_ZONE', 'PLANTING', 'PLANT', 'TREE', 'ASSET', 'TOOL', 'ELEVATION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('WATER', 'IRRIGATION', 'STRUCTURE', 'ENVIRONMENT', 'INSTRUMENT', 'STORAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DAMAGED', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "ToolStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'IN_USE', 'LOANED', 'MAINTENANCE_DUE', 'UNDER_REPAIR', 'DAMAGED', 'MISSING', 'RETIRED');

-- CreateEnum
CREATE TYPE "WorkTaskCategory" AS ENUM ('CARE', 'OBSERVATION', 'MEASUREMENT', 'IRRIGATION', 'APPLICATION', 'HARVEST', 'REPAIR', 'IMPROVEMENT', 'INVENTORY', 'SAFETY', 'CALIBRATION', 'DATA_QUALITY');

-- CreateEnum
CREATE TYPE "WorkTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'SNOOZED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskCompletionMode" AS ENUM ('WHOLE_SCOPE', 'PER_TARGET', 'QUANTITY_BASED', 'CHECKLIST');

-- CreateEnum
CREATE TYPE "MaterialCategory" AS ENUM ('FERTILIZER', 'AMENDMENT', 'GROWING_MEDIUM', 'SEED', 'PROPAGATION', 'PESTICIDE', 'BIOLOGICAL', 'ENZYME', 'HORMONE', 'CONSUMABLE', 'OTHER');

-- CreateEnum
CREATE TYPE "InventoryTransactionType" AS ENUM ('PURCHASE', 'CONSUME', 'TRANSFER', 'ADJUST', 'EXPIRE', 'WASTE', 'RETURN', 'SPLIT', 'MERGE');

-- CreateEnum
CREATE TYPE "FactorValueType" AS ENUM ('NUMERIC', 'NUMERIC_RANGE', 'ORDINAL', 'CATEGORY', 'BOOLEAN', 'PRESENCE_ABSENCE', 'TEXT');

-- CreateEnum
CREATE TYPE "ObservationMode" AS ENUM ('AUTOMATIC_SENSOR', 'MANUAL_INSTRUMENT', 'TEST_KIT', 'LAB_RESULT', 'MANUAL_NUMERIC', 'QUALITATIVE_OBSERVATION', 'USER_ESTIMATE', 'DERIVED_CALCULATION', 'IMPORTED_DATA');

-- CreateEnum
CREATE TYPE "EvidenceQuality" AS ENUM ('LAB_CONFIRMED', 'CALIBRATED_INSTRUMENT', 'UNCALIBRATED_INSTRUMENT', 'TEST_KIT', 'REPEATED_MANUAL_OBSERVATION', 'SINGLE_MANUAL_OBSERVATION', 'DERIVED_ESTIMATE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('UNKNOWN', 'OPTIMAL', 'WATCH', 'LOW', 'HIGH', 'CRITICAL', 'POSSIBLE_DEFICIENCY', 'PROJECTED_DEFICIENCY', 'CONFIRMED_DEFICIENCY', 'POSSIBLE_EXCESS', 'PROJECTED_EXCESS', 'CONFIRMED_EXCESS');

-- CreateEnum
CREATE TYPE "IncidentPriority" AS ENUM ('P0', 'P1', 'P2', 'P3', 'P4');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('NEW', 'ACKNOWLEDGED', 'IN_PROGRESS', 'SNOOZED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('WEB_PUSH', 'EMAIL', 'SPEAKER');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'ACKNOWLEDGED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "MarketType" AS ENUM ('INPUT_SUPPLIER', 'FARMGATE', 'WHOLESALE', 'RETAIL', 'CONTRACT', 'ONLINE', 'INTERNAL');

-- CreateEnum
CREATE TYPE "DispositionType" AS ENUM ('WHOLESALE', 'RETAIL', 'CONTRACT_BUYER', 'ONLINE', 'PERSONAL_USE', 'DONATION', 'SEED_SAVING', 'ANIMAL_FEED', 'COMPOST', 'WASTE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gardens" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gardens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garden_care_givers" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "garden_care_givers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plots" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "areaSqMeters" DOUBLE PRECISION NOT NULL,
    "soilType" TEXT NOT NULL,
    "irrigationType" "IrrigationType" NOT NULL DEFAULT 'NONE',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plants" (
    "id" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "plantingId" TEXT,
    "species" TEXT NOT NULL,
    "scientificName" TEXT,
    "variety" TEXT,
    "plantedAt" TIMESTAMP(3) NOT NULL,
    "status" "PlantStatus" NOT NULL DEFAULT 'SEEDLING',
    "positionLabel" TEXT,
    "careNotes" TEXT,
    "waterRequirement" TEXT,
    "sunlightRequirement" TEXT,
    "spacingCm" DOUBLE PRECISION,
    "expectedYieldKg" DOUBLE PRECISION,
    "actualYieldKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expectedHarvestAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_tasks" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "type" "CareTaskType" NOT NULL,
    "intervalDays" INTEGER NOT NULL,
    "lastCompletedAt" TIMESTAMP(3),
    "nextDueAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "waterAmountLiters" DOUBLE PRECISION,
    "waterIntakeMM" DOUBLE PRECISION,
    "fertilizerName" TEXT,
    "method" TEXT,
    "harvestQuantityKg" DOUBLE PRECISION,
    "harvestQualityDesc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_task_media" (
    "id" TEXT NOT NULL,
    "careTaskId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_task_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observations" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "healthStatus" "HealthStatus" NOT NULL,
    "note" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observation_media" (
    "id" TEXT NOT NULL,
    "observationId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "observation_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plot_media" (
    "id" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plot_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plant_media" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plant_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plot_tasks" (
    "id" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "type" "PlotTaskType" NOT NULL,
    "title" TEXT NOT NULL,
    "intervalDays" INTEGER NOT NULL,
    "lastCompletedAt" TIMESTAMP(3),
    "nextDueAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plot_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plot_zones" (
    "id" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plot_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantings" (
    "id" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "zoneId" TEXT,
    "requirementProfileId" TEXT,
    "preferredMarketId" TEXT,
    "marketCommodity" TEXT,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "scientificName" TEXT,
    "variety" TEXT,
    "plantedAt" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "trackingMode" TEXT NOT NULL DEFAULT 'BATCH',
    "status" "PlantStatus" NOT NULL DEFAULT 'SEEDLING',
    "expectedYieldMin" DECIMAL(14,3),
    "expectedYieldMax" DECIMAL(14,3),
    "yieldUnit" TEXT DEFAULT 'kg',
    "expectedHarvestStart" TIMESTAMP(3),
    "expectedHarvestEnd" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garden_maps" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "width" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "height" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "unit" TEXT NOT NULL DEFAULT 'm',
    "gridSize" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "backgroundImageUrl" TEXT,
    "backgroundOpacity" DOUBLE PRECISION NOT NULL DEFAULT 0.35,
    "showContours" BOOLEAN NOT NULL DEFAULT false,
    "contourInterval" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "garden_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "map_features" (
    "id" TEXT NOT NULL,
    "gardenMapId" TEXT NOT NULL,
    "entityType" "MapEntityType" NOT NULL,
    "entityId" TEXT,
    "label" TEXT NOT NULL,
    "geometryType" "MapGeometryType" NOT NULL,
    "geometry" JSONB NOT NULL,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "zIndex" INTEGER NOT NULL DEFAULT 0,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "style" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "map_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garden_assets" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "subtype" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "installedAt" TIMESTAMP(3),
    "capacity" DECIMAL(14,3),
    "capacityUnit" TEXT,
    "baseElevation" DOUBLE PRECISION,
    "topElevation" DOUBLE PRECISION,
    "specifications" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "garden_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_connections" (
    "id" TEXT NOT NULL,
    "fromAssetId" TEXT NOT NULL,
    "toAssetId" TEXT NOT NULL,
    "connectionType" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'FORWARD',
    "capacity" DECIMAL(14,3),
    "capacityUnit" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environmental_influences" (
    "id" TEXT NOT NULL,
    "assetId" TEXT,
    "mapFeatureId" TEXT,
    "factorCode" TEXT NOT NULL,
    "effectType" TEXT NOT NULL,
    "geometry" JSONB NOT NULL,
    "magnitude" DECIMAL(14,4),
    "unitOrScale" TEXT,
    "direction" DOUBLE PRECISION,
    "seasonalStart" TIMESTAMP(3),
    "seasonalEnd" TIMESTAMP(3),
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environmental_influences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elevation_points" (
    "id" TEXT NOT NULL,
    "gardenMapId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "elevation" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'm',
    "datum" TEXT NOT NULL DEFAULT 'RELATIVE',
    "source" TEXT NOT NULL DEFAULT 'USER_ESTIMATE',
    "accuracy" DOUBLE PRECISION,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "elevation_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tools" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "status" "ToolStatus" NOT NULL DEFAULT 'AVAILABLE',
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "purchaseDate" TIMESTAMP(3),
    "purchaseCost" DECIMAL(14,2),
    "replacementValue" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "storageLocation" TEXT,
    "currentHolder" TEXT,
    "powerSource" TEXT,
    "specifications" JSONB,
    "maintenanceDueAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" "MaterialCategory" NOT NULL,
    "formulation" TEXT,
    "defaultUnit" TEXT NOT NULL,
    "manufacturer" TEXT,
    "composition" JSONB,
    "profile" JSONB,
    "storageInstructions" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_locations" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_lots" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "locationId" TEXT,
    "lotNumber" TEXT,
    "supplier" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "initialQuantity" DECIMAL(16,4) NOT NULL,
    "currentQuantity" DECIMAL(16,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitCost" DECIMAL(14,4),
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "type" "InventoryTransactionType" NOT NULL,
    "quantity" DECIMAL(16,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_events" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetType" "ScopeType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "targetSnapshot" JSONB,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT,
    "treatedArea" DECIMAL(14,3),
    "treatedCount" INTEGER,
    "weather" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_lines" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "inventoryLotId" TEXT,
    "productAmount" DECIMAL(16,4) NOT NULL,
    "productUnit" TEXT NOT NULL,
    "carrierVolume" DECIMAL(16,4),
    "carrierUnit" TEXT,
    "rateValue" DECIMAL(16,4),
    "rateUnit" TEXT,
    "notes" TEXT,

    CONSTRAINT "application_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factor_definitions" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "valueType" "FactorValueType" NOT NULL,
    "supportedUnits" JSONB,
    "qualitativeScale" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "factor_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirement_profiles" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT,
    "scientificName" TEXT,
    "variety" TEXT,
    "growingMethod" TEXT,
    "source" TEXT,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requirement_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirement_ranges" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "factorId" TEXT NOT NULL,
    "growthStage" TEXT,
    "criticalMinimum" DECIMAL(16,4),
    "targetMinimum" DECIMAL(16,4),
    "targetMaximum" DECIMAL(16,4),
    "criticalMaximum" DECIMAL(16,4),
    "targetOrdinal" JSONB,
    "preferredUnit" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requirement_ranges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instruments" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "supportedFactors" JSONB,
    "supportedUnits" JSONB,
    "resolution" TEXT,
    "accuracy" TEXT,
    "calibrationIntervalDays" INTEGER,
    "lastCalibrationAt" TIMESTAMP(3),
    "nextCalibrationAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instruments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurements" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "factorId" TEXT NOT NULL,
    "targetType" "ScopeType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "numericValue" DECIMAL(16,4),
    "numericMinimum" DECIMAL(16,4),
    "numericMaximum" DECIMAL(16,4),
    "textValue" TEXT,
    "unit" TEXT,
    "mode" "ObservationMode" NOT NULL,
    "evidenceQuality" "EvidenceQuality" NOT NULL,
    "instrumentId" TEXT,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "depthCm" DECIMAL(10,2),
    "locationX" DOUBLE PRECISION,
    "locationY" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factor_assessments" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "factorId" TEXT NOT NULL,
    "targetType" "ScopeType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "status" "AssessmentStatus" NOT NULL,
    "evidence" TEXT NOT NULL,
    "projectedValue" DECIMAL(16,4),
    "projectedUnit" TEXT,
    "projectionHorizonDays" INTEGER,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "assumptions" JSONB,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "factor_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_tasks" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "incidentId" TEXT,
    "title" TEXT NOT NULL,
    "category" "WorkTaskCategory" NOT NULL,
    "targetType" "ScopeType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "affectedSnapshot" JSONB,
    "completionMode" "TaskCompletionMode" NOT NULL DEFAULT 'WHOLE_SCOPE',
    "status" "WorkTaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" INTEGER NOT NULL DEFAULT 50,
    "dueAt" TIMESTAMP(3),
    "recurrenceDays" INTEGER,
    "nextDueAt" TIMESTAMP(3),
    "estimatedMinutes" INTEGER,
    "estimatedCost" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "requiredTools" JSONB,
    "requiredMaterials" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_task_progress" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "targetType" "ScopeType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "status" "WorkTaskStatus" NOT NULL DEFAULT 'TODO',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_task_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "priority" "IncidentPriority" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'NEW',
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "targetType" "ScopeType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "reasons" JSONB NOT NULL,
    "recommendedAction" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_endpoints" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "userId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT,
    "config" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "minimumPriority" "IncidentPriority" NOT NULL DEFAULT 'P1',
    "quietStart" TEXT,
    "quietEnd" TEXT,
    "criticalOverride" BOOLEAN NOT NULL DEFAULT true,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harvest_events" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "plantingId" TEXT,
    "plantId" TEXT,
    "quantity" DECIMAL(16,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "grade" TEXT,
    "quality" TEXT,
    "disposition" "DispositionType" NOT NULL,
    "harvestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedValue" DECIMAL(14,2),
    "realizedValue" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "harvest_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "markets" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MarketType" NOT NULL,
    "location" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_prices" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "commodity" TEXT NOT NULL,
    "variety" TEXT,
    "grade" TEXT,
    "form" TEXT,
    "minimumPrice" DECIMAL(14,4),
    "typicalPrice" DECIMAL(14,4) NOT NULL,
    "maximumPrice" DECIMAL(14,4),
    "quantityUnit" TEXT NOT NULL,
    "source" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "marketId" TEXT,
    "buyer" TEXT,
    "item" TEXT NOT NULL,
    "quantity" DECIMAL(16,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(14,4) NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_media" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "targetType" "ScopeType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entity_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "gardens_ownerId_idx" ON "gardens"("ownerId");

-- CreateIndex
CREATE INDEX "garden_care_givers_gardenId_idx" ON "garden_care_givers"("gardenId");

-- CreateIndex
CREATE INDEX "garden_care_givers_userId_idx" ON "garden_care_givers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "garden_care_givers_gardenId_userId_key" ON "garden_care_givers"("gardenId", "userId");

-- CreateIndex
CREATE INDEX "plots_gardenId_idx" ON "plots"("gardenId");

-- CreateIndex
CREATE INDEX "plants_plotId_idx" ON "plants"("plotId");

-- CreateIndex
CREATE INDEX "plants_plantingId_idx" ON "plants"("plantingId");

-- CreateIndex
CREATE INDEX "care_tasks_plantId_idx" ON "care_tasks"("plantId");

-- CreateIndex
CREATE INDEX "care_tasks_nextDueAt_idx" ON "care_tasks"("nextDueAt");

-- CreateIndex
CREATE INDEX "care_task_media_careTaskId_idx" ON "care_task_media"("careTaskId");

-- CreateIndex
CREATE INDEX "observations_plantId_idx" ON "observations"("plantId");

-- CreateIndex
CREATE INDEX "observation_media_observationId_idx" ON "observation_media"("observationId");

-- CreateIndex
CREATE INDEX "plot_media_plotId_idx" ON "plot_media"("plotId");

-- CreateIndex
CREATE INDEX "plant_media_plantId_idx" ON "plant_media"("plantId");

-- CreateIndex
CREATE INDEX "plot_tasks_plotId_idx" ON "plot_tasks"("plotId");

-- CreateIndex
CREATE INDEX "plot_tasks_nextDueAt_idx" ON "plot_tasks"("nextDueAt");

-- CreateIndex
CREATE UNIQUE INDEX "plot_tasks_plotId_type_title_key" ON "plot_tasks"("plotId", "type", "title");

-- CreateIndex
CREATE INDEX "plot_zones_plotId_idx" ON "plot_zones"("plotId");

-- CreateIndex
CREATE INDEX "plantings_plotId_idx" ON "plantings"("plotId");

-- CreateIndex
CREATE INDEX "plantings_zoneId_idx" ON "plantings"("zoneId");

-- CreateIndex
CREATE INDEX "plantings_preferredMarketId_idx" ON "plantings"("preferredMarketId");

-- CreateIndex
CREATE UNIQUE INDEX "garden_maps_gardenId_key" ON "garden_maps"("gardenId");

-- CreateIndex
CREATE INDEX "map_features_gardenMapId_idx" ON "map_features"("gardenMapId");

-- CreateIndex
CREATE INDEX "map_features_entityType_entityId_idx" ON "map_features"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "garden_assets_gardenId_idx" ON "garden_assets"("gardenId");

-- CreateIndex
CREATE INDEX "asset_connections_fromAssetId_idx" ON "asset_connections"("fromAssetId");

-- CreateIndex
CREATE INDEX "asset_connections_toAssetId_idx" ON "asset_connections"("toAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_connections_fromAssetId_toAssetId_connectionType_key" ON "asset_connections"("fromAssetId", "toAssetId", "connectionType");

-- CreateIndex
CREATE INDEX "environmental_influences_assetId_idx" ON "environmental_influences"("assetId");

-- CreateIndex
CREATE INDEX "environmental_influences_mapFeatureId_idx" ON "environmental_influences"("mapFeatureId");

-- CreateIndex
CREATE INDEX "elevation_points_gardenMapId_idx" ON "elevation_points"("gardenMapId");

-- CreateIndex
CREATE INDEX "tools_gardenId_idx" ON "tools"("gardenId");

-- CreateIndex
CREATE INDEX "tools_status_idx" ON "tools"("status");

-- CreateIndex
CREATE INDEX "materials_gardenId_idx" ON "materials"("gardenId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_locations_gardenId_name_key" ON "inventory_locations"("gardenId", "name");

-- CreateIndex
CREATE INDEX "inventory_lots_materialId_idx" ON "inventory_lots"("materialId");

-- CreateIndex
CREATE INDEX "inventory_lots_locationId_idx" ON "inventory_lots"("locationId");

-- CreateIndex
CREATE INDEX "inventory_lots_expiryDate_idx" ON "inventory_lots"("expiryDate");

-- CreateIndex
CREATE INDEX "inventory_transactions_lotId_occurredAt_idx" ON "inventory_transactions"("lotId", "occurredAt");

-- CreateIndex
CREATE INDEX "application_events_gardenId_appliedAt_idx" ON "application_events"("gardenId", "appliedAt");

-- CreateIndex
CREATE INDEX "application_events_targetType_targetId_idx" ON "application_events"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "application_lines_applicationId_idx" ON "application_lines"("applicationId");

-- CreateIndex
CREATE INDEX "application_lines_materialId_idx" ON "application_lines"("materialId");

-- CreateIndex
CREATE INDEX "factor_definitions_gardenId_category_idx" ON "factor_definitions"("gardenId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "factor_definitions_gardenId_code_key" ON "factor_definitions"("gardenId", "code");

-- CreateIndex
CREATE INDEX "requirement_profiles_gardenId_idx" ON "requirement_profiles"("gardenId");

-- CreateIndex
CREATE UNIQUE INDEX "requirement_ranges_profileId_factorId_growthStage_key" ON "requirement_ranges"("profileId", "factorId", "growthStage");

-- CreateIndex
CREATE INDEX "instruments_gardenId_idx" ON "instruments"("gardenId");

-- CreateIndex
CREATE INDEX "measurements_gardenId_measuredAt_idx" ON "measurements"("gardenId", "measuredAt");

-- CreateIndex
CREATE INDEX "measurements_factorId_targetType_targetId_measuredAt_idx" ON "measurements"("factorId", "targetType", "targetId", "measuredAt");

-- CreateIndex
CREATE INDEX "factor_assessments_gardenId_assessedAt_idx" ON "factor_assessments"("gardenId", "assessedAt");

-- CreateIndex
CREATE INDEX "factor_assessments_factorId_targetType_targetId_idx" ON "factor_assessments"("factorId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "work_tasks_gardenId_status_dueAt_idx" ON "work_tasks"("gardenId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "work_tasks_targetType_targetId_idx" ON "work_tasks"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "work_task_progress_taskId_targetType_targetId_key" ON "work_task_progress"("taskId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "incidents_gardenId_status_priority_idx" ON "incidents"("gardenId", "status", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "incidents_gardenId_fingerprint_key" ON "incidents"("gardenId", "fingerprint");

-- CreateIndex
CREATE INDEX "notification_endpoints_gardenId_channel_idx" ON "notification_endpoints"("gardenId", "channel");

-- CreateIndex
CREATE INDEX "notification_endpoints_userId_idx" ON "notification_endpoints"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_deliveries_idempotencyKey_key" ON "notification_deliveries"("idempotencyKey");

-- CreateIndex
CREATE INDEX "notification_deliveries_incidentId_idx" ON "notification_deliveries"("incidentId");

-- CreateIndex
CREATE INDEX "notification_deliveries_status_createdAt_idx" ON "notification_deliveries"("status", "createdAt");

-- CreateIndex
CREATE INDEX "harvest_events_gardenId_harvestedAt_idx" ON "harvest_events"("gardenId", "harvestedAt");

-- CreateIndex
CREATE INDEX "harvest_events_plantingId_idx" ON "harvest_events"("plantingId");

-- CreateIndex
CREATE INDEX "markets_gardenId_idx" ON "markets"("gardenId");

-- CreateIndex
CREATE INDEX "market_prices_marketId_commodity_observedAt_idx" ON "market_prices"("marketId", "commodity", "observedAt");

-- CreateIndex
CREATE INDEX "sales_gardenId_soldAt_idx" ON "sales"("gardenId", "soldAt");

-- CreateIndex
CREATE INDEX "sales_marketId_idx" ON "sales"("marketId");

-- CreateIndex
CREATE INDEX "entity_media_gardenId_targetType_targetId_idx" ON "entity_media"("gardenId", "targetType", "targetId");

-- AddForeignKey
ALTER TABLE "gardens" ADD CONSTRAINT "gardens_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garden_care_givers" ADD CONSTRAINT "garden_care_givers_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garden_care_givers" ADD CONSTRAINT "garden_care_givers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plots" ADD CONSTRAINT "plots_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plants" ADD CONSTRAINT "plants_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "plots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plants" ADD CONSTRAINT "plants_plantingId_fkey" FOREIGN KEY ("plantingId") REFERENCES "plantings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_tasks" ADD CONSTRAINT "care_tasks_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_task_media" ADD CONSTRAINT "care_task_media_careTaskId_fkey" FOREIGN KEY ("careTaskId") REFERENCES "care_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observation_media" ADD CONSTRAINT "observation_media_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "observations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plot_media" ADD CONSTRAINT "plot_media_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "plots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plant_media" ADD CONSTRAINT "plant_media_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plot_tasks" ADD CONSTRAINT "plot_tasks_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "plots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plot_zones" ADD CONSTRAINT "plot_zones_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "plots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "plots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "plot_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_requirementProfileId_fkey" FOREIGN KEY ("requirementProfileId") REFERENCES "requirement_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_preferredMarketId_fkey" FOREIGN KEY ("preferredMarketId") REFERENCES "markets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garden_maps" ADD CONSTRAINT "garden_maps_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_features" ADD CONSTRAINT "map_features_gardenMapId_fkey" FOREIGN KEY ("gardenMapId") REFERENCES "garden_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garden_assets" ADD CONSTRAINT "garden_assets_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_connections" ADD CONSTRAINT "asset_connections_fromAssetId_fkey" FOREIGN KEY ("fromAssetId") REFERENCES "garden_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_connections" ADD CONSTRAINT "asset_connections_toAssetId_fkey" FOREIGN KEY ("toAssetId") REFERENCES "garden_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environmental_influences" ADD CONSTRAINT "environmental_influences_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "garden_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environmental_influences" ADD CONSTRAINT "environmental_influences_mapFeatureId_fkey" FOREIGN KEY ("mapFeatureId") REFERENCES "map_features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elevation_points" ADD CONSTRAINT "elevation_points_gardenMapId_fkey" FOREIGN KEY ("gardenMapId") REFERENCES "garden_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tools" ADD CONSTRAINT "tools_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_locations" ADD CONSTRAINT "inventory_locations_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "inventory_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "inventory_lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_lines" ADD CONSTRAINT "application_lines_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "application_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_lines" ADD CONSTRAINT "application_lines_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_lines" ADD CONSTRAINT "application_lines_inventoryLotId_fkey" FOREIGN KEY ("inventoryLotId") REFERENCES "inventory_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factor_definitions" ADD CONSTRAINT "factor_definitions_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_profiles" ADD CONSTRAINT "requirement_profiles_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_ranges" ADD CONSTRAINT "requirement_ranges_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "requirement_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_ranges" ADD CONSTRAINT "requirement_ranges_factorId_fkey" FOREIGN KEY ("factorId") REFERENCES "factor_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instruments" ADD CONSTRAINT "instruments_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_factorId_fkey" FOREIGN KEY ("factorId") REFERENCES "factor_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "instruments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factor_assessments" ADD CONSTRAINT "factor_assessments_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factor_assessments" ADD CONSTRAINT "factor_assessments_factorId_fkey" FOREIGN KEY ("factorId") REFERENCES "factor_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_tasks" ADD CONSTRAINT "work_tasks_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_tasks" ADD CONSTRAINT "work_tasks_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_task_progress" ADD CONSTRAINT "work_task_progress_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "work_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_endpoints" ADD CONSTRAINT "notification_endpoints_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_endpoints" ADD CONSTRAINT "notification_endpoints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "notification_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_events" ADD CONSTRAINT "harvest_events_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_events" ADD CONSTRAINT "harvest_events_plantingId_fkey" FOREIGN KEY ("plantingId") REFERENCES "plantings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "markets" ADD CONSTRAINT "markets_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_prices" ADD CONSTRAINT "market_prices_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "markets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_media" ADD CONSTRAINT "entity_media_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
