import type {
  CreatePlotTaskInput,
  PlotTaskDto,
  UpdatePlotTaskInput,
} from "@garden/shared";
import {
  PlotTaskType as PrismaPlotTaskType,
  type Prisma,
} from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../utils/errors.js";
import { assertPlotOwnership } from "../plots/plots.service.js";
import { computeDueStatus, computeNextDueAt } from "../careTasks/careTasks.scheduler.js";
import { getRecommendedTemplates } from "./plotTasks.templates.js";

export { getRecommendedTemplates } from "./plotTasks.templates.js";

function toDto(task: {
  id: string;
  plotId: string;
  type: string;
  title: string;
  intervalDays: number;
  lastCompletedAt: Date | null;
  nextDueAt: Date;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): PlotTaskDto {
  return {
    id: task.id,
    plotId: task.plotId,
    type: task.type as PlotTaskDto["type"],
    title: task.title,
    intervalDays: task.intervalDays,
    lastCompletedAt: task.lastCompletedAt?.toISOString() ?? null,
    nextDueAt: task.nextDueAt.toISOString(),
    dueStatus: computeDueStatus(task.nextDueAt),
    notes: task.notes,
    isActive: task.isActive,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export async function listPlotTasks(ownerId: string, plotId: string): Promise<PlotTaskDto[]> {
  await assertPlotOwnership(ownerId, plotId);
  const tasks = await prisma.plotTask.findMany({
    where: { plotId },
    orderBy: [{ isActive: "desc" }, { nextDueAt: "asc" }],
  });
  return tasks.map(toDto);
}

export async function createPlotTask(
  ownerId: string,
  plotId: string,
  input: CreatePlotTaskInput,
): Promise<PlotTaskDto> {
  await assertPlotOwnership(ownerId, plotId);
  const task = await prisma.plotTask.create({
    data: {
      plotId,
      type: input.type as PrismaPlotTaskType,
      title: input.title,
      intervalDays: input.intervalDays,
      nextDueAt: input.nextDueAt ?? computeNextDueAt(null, input.intervalDays),
      notes: input.notes ?? null,
      isActive: input.isActive ?? true,
    },
  });
  return toDto(task);
}

export async function addRecommendedPlotTasks(ownerId: string, plotId: string): Promise<PlotTaskDto[]> {
  await assertPlotOwnership(ownerId, plotId);
  const plot = await prisma.plot.findUnique({ where: { id: plotId }, select: { irrigationType: true } });
  if (!plot) throw new NotFoundError("Plot");

  const templates = getRecommendedTemplates(plot.irrigationType);
  await prisma.$transaction(
    templates.map((template) =>
      prisma.plotTask.upsert({
        where: {
          plotId_type_title: {
            plotId,
            type: template.type as PrismaPlotTaskType,
            title: template.title,
          },
        },
        update: {},
        create: {
          plotId,
          type: template.type as PrismaPlotTaskType,
          title: template.title,
          intervalDays: template.intervalDays,
          nextDueAt: computeNextDueAt(null, template.intervalDays),
          notes: template.notes,
        },
      }),
    ),
  );
  return listPlotTasks(ownerId, plotId);
}

async function getPlotTask(ownerId: string, plotId: string, taskId: string) {
  await assertPlotOwnership(ownerId, plotId);
  const task = await prisma.plotTask.findFirst({ where: { id: taskId, plotId } });
  if (!task) throw new NotFoundError("Plot task");
  return task;
}

export async function updatePlotTask(
  ownerId: string,
  plotId: string,
  taskId: string,
  input: UpdatePlotTaskInput,
): Promise<PlotTaskDto> {
  await getPlotTask(ownerId, plotId, taskId);
  const data: Prisma.PlotTaskUpdateInput = {};
  if (input.type !== undefined) data.type = input.type as PrismaPlotTaskType;
  if (input.title !== undefined) data.title = input.title;
  if (input.intervalDays !== undefined) data.intervalDays = input.intervalDays;
  if (input.nextDueAt !== undefined) data.nextDueAt = input.nextDueAt;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  const task = await prisma.plotTask.update({ where: { id: taskId }, data });
  return toDto(task);
}

export async function completePlotTask(
  ownerId: string,
  plotId: string,
  taskId: string,
  completedAt: Date,
  note?: string,
): Promise<PlotTaskDto> {
  const existing = await getPlotTask(ownerId, plotId, taskId);
  const task = await prisma.plotTask.update({
    where: { id: taskId },
    data: {
      lastCompletedAt: completedAt,
      nextDueAt: computeNextDueAt(completedAt, existing.intervalDays, completedAt),
      ...(note !== undefined ? { notes: note } : {}),
    },
  });
  return toDto(task);
}

export async function deletePlotTask(ownerId: string, plotId: string, taskId: string): Promise<void> {
  await getPlotTask(ownerId, plotId, taskId);
  await prisma.plotTask.delete({ where: { id: taskId } });
}
