CREATE TYPE "UserRole" AS ENUM ('OWNER', 'STAFF');
CREATE TYPE "IrrigationType" AS ENUM ('DRIP', 'SPRINKLER', 'MANUAL', 'NONE');
CREATE TYPE "PlantStatus" AS ENUM ('SEEDLING', 'GROWING', 'FLOWERING', 'FRUITING', 'HARVESTED', 'REMOVED');
CREATE TYPE "CareTaskType" AS ENUM ('WATER', 'FERTILIZE', 'PEST_CONTROL', 'PRUNE', 'HARVEST', 'OBSERVE', 'DRIP_MAINTENANCE');
CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'DEFICIENCY_SUSPECTED', 'PEST_DAMAGE', 'DISEASE', 'CRITICAL');
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  name TEXT NOT NULL,
  role "UserRole" NOT NULL DEFAULT 'OWNER',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gardens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  "ownerId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX gardens_owner_id_idx ON gardens("ownerId");

CREATE TABLE garden_care_givers (
  id TEXT PRIMARY KEY,
  "gardenId" TEXT NOT NULL REFERENCES gardens(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("gardenId", "userId")
);

CREATE INDEX garden_care_givers_garden_id_idx ON garden_care_givers("gardenId");
CREATE INDEX garden_care_givers_user_id_idx ON garden_care_givers("userId");

CREATE TABLE plots (
  id TEXT PRIMARY KEY,
  "gardenId" TEXT NOT NULL REFERENCES gardens(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  "areaSqMeters" FLOAT NOT NULL,
  "soilType" TEXT NOT NULL,
  "irrigationType" "IrrigationType" NOT NULL DEFAULT 'NONE',
  latitude FLOAT,
  longitude FLOAT,
  "imageUrls" TEXT[] DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX plots_garden_id_idx ON plots("gardenId");

CREATE TABLE plants (
  id TEXT PRIMARY KEY,
  "plotId" TEXT NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  species TEXT NOT NULL,
  variety TEXT,
  "plantedAt" TIMESTAMP NOT NULL,
  status "PlantStatus" NOT NULL DEFAULT 'SEEDLING',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX plants_plot_id_idx ON plants("plotId");

CREATE TABLE care_tasks (
  id TEXT PRIMARY KEY,
  "plantId" TEXT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  type "CareTaskType" NOT NULL,
  "intervalDays" INT NOT NULL,
  "lastCompletedAt" TIMESTAMP,
  "nextDueAt" TIMESTAMP NOT NULL,
  notes TEXT,
  "waterAmountLiters" FLOAT,
  "waterIntakeMM" FLOAT,
  "fertilizerName" TEXT,
  method TEXT,
  "harvestQuantityKg" FLOAT,
  "harvestQualityDesc" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX care_tasks_plant_id_idx ON care_tasks("plantId");
CREATE INDEX care_tasks_next_due_at_idx ON care_tasks("nextDueAt");

CREATE TABLE care_task_media (
  id TEXT PRIMARY KEY,
  "careTaskId" TEXT NOT NULL REFERENCES care_tasks(id) ON DELETE CASCADE,
  type "MediaType" NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX care_task_media_care_task_id_idx ON care_task_media("careTaskId");

CREATE TABLE observations (
  id TEXT PRIMARY KEY,
  "plantId" TEXT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  "healthStatus" "HealthStatus" NOT NULL,
  note TEXT NOT NULL,
  "createdById" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX observations_plant_id_idx ON observations("plantId");

CREATE TABLE observation_media (
  id TEXT PRIMARY KEY,
  "observationId" TEXT NOT NULL REFERENCES observations(id) ON DELETE CASCADE,
  type "MediaType" NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX observation_media_observation_id_idx ON observation_media("observationId");
