import type {
  CareTaskDto,
  CompleteCareTaskInput,
  CreateCareTaskInput,
  GardenDueTaskDto,
  UpdateCareTaskInput,
} from "@garden/shared";
import { CareTaskType as PrismaCareTaskType } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../utils/errors.js";
import { assertPlantOwnership } from "../plants/plants.service.js";
import { assertGardenOwnership } from "../gardens/gardens.service.js";
import { computeDueStatus, computeNextDueAt } from "./careTasks.scheduler.js";
import { toPrismaCreateData } from "./careTasks.mapper.js";

function toDto(task: {
  id: string;
  plantId: string;
  type: string;
  intervalDays: number;
  lastCompletedAt: Date | null;
  nextDueAt: Date;
  notes: string | null;
  isActive: boolean;
  waterAmountLiters?: number | null;
  waterIntakeMM?: number | null;
  fertilizerName?: string | null;
  method?: string | null;
  harvestQuantityKg?: number | null;
  harvestQualityDesc?: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CareTaskDto {
  return {
    id: task.id,
    plantId: task.plantId,
    type: task.type as CareTaskDto["type"],
    intervalDays: task.intervalDays,
    lastCompletedAt: task.lastCompletedAt?.toISOString() ?? null,
    nextDueAt: task.nextDueAt.toISOString(),
    dueStatus: computeDueStatus(task.nextDueAt),
    notes: task.notes,
    isActive: task.isActive,
    ...(task.waterAmountLiters !== null && task.waterAmountLiters !== undefined
      ? { waterAmountLiters: task.waterAmountLiters }
      : {}),
    ...(task.waterIntakeMM !== null && task.waterIntakeMM !== undefined
      ? { waterIntakeMM: task.waterIntakeMM }
      : {}),
    ...(task.fertilizerName ? { fertilizerName: task.fertilizerName } : {}),
    ...(task.method ? { method: task.method } : {}),
    ...(task.harvestQuantityKg !== null && task.harvestQuantityKg !== undefined
      ? { harvestQuantityKg: task.harvestQuantityKg }
      : {}),
    ...(task.harvestQualityDesc ? { harvestQualityDesc: task.harvestQualityDesc } : {}),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export async function listCareTasksForPlant(ownerId: string, plantId: string): Promise<CareTaskDto[]> {
  await assertPlantOwnership(ownerId, plantId);
  const tasks = await prisma.careTask.findMany({ where: { plantId }, orderBy: { nextDueAt: "asc" } });
  return tasks.map(toDto);
}

export async function getCareTaskById(ownerId: string, plantId: string, taskId: string): Promise<CareTaskDto> {
  await assertPlantOwnership(ownerId, plantId);
  const task = await prisma.careTask.findFirst({ where: { id: taskId, plantId } });
  if (!task) throw new NotFoundError("Care task");
  return toDto(task);
}

export async function createCareTask(
  ownerId: string,
  plantId: string,
  input: CreateCareTaskInput,
): Promise<CareTaskDto> {
  await assertPlantOwnership(ownerId, plantId);
  const flat = toPrismaCreateData(input);
  const task = await prisma.careTask.create({
    data: {
      ...flat,
      plantId,
      isActive: input.isActive ?? true,
      nextDueAt: input.nextDueAt ?? computeNextDueAt(null, input.intervalDays),
    },
  });
  return toDto(task);
}

export async function updateCareTask(
  ownerId: string,
  plantId: string,
  taskId: string,
  updates: UpdateCareTaskInput,
): Promise<CareTaskDto> {
  await assertPlantOwnership(ownerId, plantId);
  const existing = await prisma.careTask.findFirst({ where: { id: taskId, plantId } });
  if (!existing) throw new NotFoundError("Care task");

  const data: {
    type?: PrismaCareTaskType;
    intervalDays?: number;
    nextDueAt?: Date;
    notes?: string | null;
    isActive?: boolean;
    waterAmountLiters?: number | null;
    waterIntakeMM?: number | null;
    fertilizerName?: string | null;
    method?: string | null;
    harvestQuantityKg?: number | null;
    harvestQualityDesc?: string | null;
  } = {};
  if (updates.type !== undefined) data.type = updates.type as PrismaCareTaskType;
  if (updates.intervalDays !== undefined) data.intervalDays = updates.intervalDays;
  if (updates.nextDueAt !== undefined) data.nextDueAt = updates.nextDueAt;
  if (updates.notes !== undefined) data.notes = updates.notes;
  if (updates.isActive !== undefined) data.isActive = updates.isActive;
  if (updates.waterAmountLiters !== undefined) data.waterAmountLiters = updates.waterAmountLiters;
  if (updates.waterIntakeMM !== undefined) data.waterIntakeMM = updates.waterIntakeMM;
  if (updates.fertilizerName !== undefined) data.fertilizerName = updates.fertilizerName;
  if (updates.method !== undefined) data.method = updates.method;
  if (updates.harvestQuantityKg !== undefined) data.harvestQuantityKg = updates.harvestQuantityKg;
  if (updates.harvestQualityDesc !== undefined) data.harvestQualityDesc = updates.harvestQualityDesc;

  const task = await prisma.careTask.update({
    where: { id: taskId },
    data,
  });
  return toDto(task);
}

export async function completeCareTask(
  ownerId: string,
  plantId: string,
  taskId: string,
  input: CompleteCareTaskInput,
): Promise<CareTaskDto> {
  await assertPlantOwnership(ownerId, plantId);
  const existing = await prisma.careTask.findFirst({ where: { id: taskId, plantId } });
  if (!existing) throw new NotFoundError("Care task");

  const completedAt = input.completedAt;
  const task = await prisma.careTask.update({
    where: { id: taskId },
    data: {
      lastCompletedAt: completedAt,
      nextDueAt: computeNextDueAt(completedAt, existing.intervalDays, completedAt),
      notes: input.note ?? existing.notes,
    },
  });
  return toDto(task);
}

export async function deleteCareTask(ownerId: string, plantId: string, taskId: string): Promise<void> {
  await assertPlantOwnership(ownerId, plantId);
  const existing = await prisma.careTask.findFirst({ where: { id: taskId, plantId } });
  if (!existing) throw new NotFoundError("Care task");
  await prisma.careTask.delete({ where: { id: taskId } });
}

/**
 * Garden-wide dashboard query: every task across every plot/plant in a
 * garden, sorted so the most urgent work floats to the top. This is what
 * powers the "what needs doing today" view on the frontend.
 */
export async function listDueTasksForGarden(ownerId: string, gardenId: string): Promise<GardenDueTaskDto[]> {
  await assertGardenOwnership(ownerId, gardenId);
  const [plantTasks, plotTasks] = await Promise.all([
    prisma.careTask.findMany({
      where: { plant: { plot: { gardenId } }, isActive: true },
      include: { plant: { select: { species: true } } },
      orderBy: { nextDueAt: "asc" },
    }),
    prisma.plotTask.findMany({
      where: { plot: { gardenId }, isActive: true },
      include: { plot: { select: { name: true } } },
      orderBy: { nextDueAt: "asc" },
    }),
  ]);
  const combined: GardenDueTaskDto[] = [
    ...plantTasks.map((task) => ({
      id: task.id,
      scope: "PLANT" as const,
      targetId: task.plantId,
      targetName: task.plant.species,
      type: task.type,
      title: task.type.replaceAll("_", " ").toLowerCase(),
      intervalDays: task.intervalDays,
      nextDueAt: task.nextDueAt.toISOString(),
      dueStatus: computeDueStatus(task.nextDueAt),
      notes: task.notes,
    })),
    ...plotTasks.map((task) => ({
      id: task.id,
      scope: "PLOT" as const,
      targetId: task.plotId,
      targetName: task.plot.name,
      type: task.type,
      title: task.title,
      intervalDays: task.intervalDays,
      nextDueAt: task.nextDueAt.toISOString(),
      dueStatus: computeDueStatus(task.nextDueAt),
      notes: task.notes,
    })),
  ];
  return combined.sort(
    (a, b) =>
      dueStatusWeight(a.dueStatus) - dueStatusWeight(b.dueStatus) ||
      a.nextDueAt.localeCompare(b.nextDueAt),
  );
}

function dueStatusWeight(status: CareTaskDto["dueStatus"]): number {
  const weights = { OVERDUE: 0, DUE_SOON: 1, ON_TRACK: 2 } as const;
  return weights[status];
}
