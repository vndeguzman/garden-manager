import type {
  CreateObservationInput,
  ObservationDto,
  UpdateObservationInput,
} from "@garden/shared";
import { HealthStatus } from "@garden/shared";
import { prisma } from "../../lib/prisma.js";
import { assertPlantOwnership } from "../plants/plants.service.js";
import { NotFoundError } from "../../utils/errors.js";

function toDto(obs: {
  id: string;
  plantId: string;
  healthStatus: string;
  note: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}): ObservationDto {
  return {
    id: obs.id,
    plantId: obs.plantId,
    healthStatus: obs.healthStatus as ObservationDto["healthStatus"],
    note: obs.note,
    createdBy: obs.createdById,
    createdAt: obs.createdAt.toISOString(),
    updatedAt: obs.updatedAt.toISOString(),
  };
}

export async function listObservations(ownerId: string, plantId: string): Promise<ObservationDto[]> {
  await assertPlantOwnership(ownerId, plantId);
  const observations = await prisma.observation.findMany({
    where: { plantId },
    orderBy: { createdAt: "desc" },
  });
  return observations.map(toDto);
}

export async function getObservationById(ownerId: string, plantId: string, observationId: string): Promise<ObservationDto> {
  await assertPlantOwnership(ownerId, plantId);
  const observation = await prisma.observation.findFirst({
    where: { id: observationId, plantId },
  });
  if (!observation) throw new NotFoundError("Observation");
  return toDto(observation);
}

export async function createObservation(
  ownerId: string,
  plantId: string,
  createdById: string,
  input: CreateObservationInput,
): Promise<ObservationDto> {
  await assertPlantOwnership(ownerId, plantId);
  const observation = await prisma.observation.create({
    data: {
      plantId,
      healthStatus: input.healthStatus as keyof typeof HealthStatus,
      note: input.note,
      createdById,
    },
  });
  return toDto(observation);
}

export async function updateObservation(
  ownerId: string,
  plantId: string,
  observationId: string,
  updates: UpdateObservationInput,
): Promise<ObservationDto> {
  await assertPlantOwnership(ownerId, plantId);
  const existing = await prisma.observation.findFirst({
    where: { id: observationId, plantId },
  });
  if (!existing) throw new NotFoundError("Observation");

  const observation = await prisma.observation.update({
    where: { id: observationId },
    data: {
      healthStatus: updates.healthStatus
        ? (updates.healthStatus as keyof typeof HealthStatus)
        : existing.healthStatus,
      note: updates.note ?? existing.note,
    },
  });
  return toDto(observation);
}

export async function deleteObservation(ownerId: string, plantId: string, observationId: string): Promise<void> {
  await assertPlantOwnership(ownerId, plantId);
  const existing = await prisma.observation.findFirst({
    where: { id: observationId, plantId },
  });
  if (!existing) throw new NotFoundError("Observation");
  await prisma.observation.delete({ where: { id: observationId } });
}
