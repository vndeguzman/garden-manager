import type { IncidentPriority, ScopeType } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { queueIncidentNotifications } from "./notifications.service.js";

interface Candidate {
  fingerprint: string;
  priority: IncidentPriority;
  category: string;
  title: string;
  summary: string;
  targetType: ScopeType;
  targetId: string;
  targetName: string;
  score: number;
  confidence: number;
  reasons: string[];
  recommendedAction: string;
  dueAt?: Date;
}

const DAY_MS = 86_400_000;

function overdueCandidate(task: {
  id: string;
  title: string;
  targetType: ScopeType;
  targetId: string;
  targetName: string;
  dueAt: Date | null;
}): Candidate | null {
  if (!task.dueAt || task.dueAt.getTime() >= Date.now()) return null;
  const overdueDays = Math.max(1, Math.ceil((Date.now() - task.dueAt.getTime()) / DAY_MS));
  const priority: IncidentPriority = overdueDays >= 7 ? "P1" : overdueDays >= 2 ? "P2" : "P3";
  return {
    fingerprint: `auto:task-overdue:${task.id}`,
    priority,
    category: "OVERDUE_TASK",
    title: `Overdue: ${task.title}`,
    summary: `This task is ${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue.`,
    targetType: task.targetType,
    targetId: task.targetId,
    targetName: task.targetName,
    score: overdueDays >= 7 ? 82 : overdueDays >= 2 ? 65 : 42,
    confidence: 100,
    reasons: ["Task due date passed", `${overdueDays} day(s) overdue`],
    recommendedAction: "Review, complete, reschedule, or cancel the task.",
    dueAt: task.dueAt,
  };
}

export async function refreshGardenIncidents(gardenId: string): Promise<number> {
  const [tasks, lots, tools, plantings, assessments] = await Promise.all([
    prisma.workTask.findMany({
      where: { gardenId, status: { in: ["TODO", "IN_PROGRESS"] } },
      select: {
        id: true,
        title: true,
        targetType: true,
        targetId: true,
        targetName: true,
        dueAt: true,
      },
    }),
    prisma.inventoryLot.findMany({
      where: { material: { gardenId }, status: "ACTIVE" },
      include: { material: { select: { name: true } } },
    }),
    prisma.tool.findMany({
      where: { gardenId },
      select: { id: true, name: true, status: true, maintenanceDueAt: true },
    }),
    prisma.planting.findMany({
      where: { plot: { gardenId }, status: { notIn: ["HARVESTED", "REMOVED"] } },
      select: { id: true, name: true, expectedHarvestEnd: true },
    }),
    prisma.factorAssessment.findMany({
      where: {
        gardenId,
        status: {
          in: [
            "CRITICAL",
            "CONFIRMED_DEFICIENCY",
            "CONFIRMED_EXCESS",
            "PROJECTED_DEFICIENCY",
            "PROJECTED_EXCESS",
          ],
        },
      },
      include: { factor: { select: { name: true } } },
      orderBy: { assessedAt: "desc" },
      take: 100,
    }),
  ]);

  const candidates: Candidate[] = tasks
    .map(overdueCandidate)
    .filter((candidate): candidate is Candidate => candidate !== null);

  for (const lot of lots) {
    const current = Number(lot.currentQuantity);
    const initial = Number(lot.initialQuantity);
    const ratio = initial > 0 ? current / initial : 0;
    if (current <= 0 || ratio <= 0.2) {
      candidates.push({
        fingerprint: `auto:inventory-low:${lot.id}`,
        priority: current <= 0 ? "P1" : "P2",
        category: "INVENTORY_LOW",
        title: current <= 0 ? `${lot.material.name} is depleted` : `${lot.material.name} is low`,
        summary: `${current} ${lot.unit} remains from an initial ${initial} ${lot.unit}.`,
        targetType: "GARDEN",
        targetId: gardenId,
        targetName: lot.material.name,
        score: current <= 0 ? 80 : 62,
        confidence: 100,
        reasons: ["Inventory balance below threshold"],
        recommendedAction: "Review upcoming tasks and replenish or substitute this input.",
      });
    }

    if (lot.expiryDate) {
      const days = Math.ceil((lot.expiryDate.getTime() - Date.now()) / DAY_MS);
      if (days <= 30) {
        candidates.push({
          fingerprint: `auto:inventory-expiry:${lot.id}`,
          priority: days < 0 ? "P1" : days <= 7 ? "P2" : "P3",
          category: "INVENTORY_EXPIRY",
          title: `${lot.material.name} ${days < 0 ? "expired" : "expires soon"}`,
          summary: days < 0 ? `Expired ${Math.abs(days)} day(s) ago.` : `Expires in ${days} day(s).`,
          targetType: "GARDEN",
          targetId: gardenId,
          targetName: lot.material.name,
          score: days < 0 ? 78 : days <= 7 ? 58 : 35,
          confidence: 100,
          reasons: ["Lot expiry date reached warning window"],
          recommendedAction: "Inspect the lot and use, isolate, or dispose of it appropriately.",
          dueAt: lot.expiryDate,
        });
      }
    }
  }

  for (const tool of tools) {
    if (tool.status === "DAMAGED" || tool.status === "MISSING" || tool.status === "MAINTENANCE_DUE") {
      candidates.push({
        fingerprint: `auto:tool-status:${tool.id}`,
        priority: tool.status === "MISSING" ? "P1" : "P2",
        category: "TOOL_STATUS",
        title: `${tool.name}: ${tool.status.replaceAll("_", " ").toLowerCase()}`,
        summary: "This tool may block or delay planned work.",
        targetType: "TOOL",
        targetId: tool.id,
        targetName: tool.name,
        score: tool.status === "MISSING" ? 72 : 55,
        confidence: 100,
        reasons: [`Tool status is ${tool.status}`],
        recommendedAction: "Inspect, repair, replace, or update the tool status.",
      });
    } else if (tool.maintenanceDueAt && tool.maintenanceDueAt.getTime() <= Date.now()) {
      candidates.push({
        fingerprint: `auto:tool-maintenance:${tool.id}`,
        priority: "P2",
        category: "TOOL_MAINTENANCE",
        title: `Maintenance due: ${tool.name}`,
        summary: "The configured maintenance date has passed.",
        targetType: "TOOL",
        targetId: tool.id,
        targetName: tool.name,
        score: 55,
        confidence: 100,
        reasons: ["Maintenance due date passed"],
        recommendedAction: "Inspect and service the tool before its next use.",
        dueAt: tool.maintenanceDueAt,
      });
    }
  }

  for (const planting of plantings) {
    if (planting.expectedHarvestEnd && planting.expectedHarvestEnd.getTime() < Date.now()) {
      const days = Math.ceil((Date.now() - planting.expectedHarvestEnd.getTime()) / DAY_MS);
      candidates.push({
        fingerprint: `auto:harvest-window:${planting.id}`,
        priority: days >= 7 ? "P1" : "P2",
        category: "HARVEST_WINDOW",
        title: `Harvest inspection overdue: ${planting.name}`,
        summary: `The expected harvest window ended ${days} day(s) ago. This does not confirm overripeness.`,
        targetType: "PLANTING",
        targetId: planting.id,
        targetName: planting.name,
        score: days >= 7 ? 75 : 58,
        confidence: 75,
        reasons: ["Expected harvest window has ended"],
        recommendedAction: "Inspect crop maturity and record a harvest or update the harvest window.",
        dueAt: planting.expectedHarvestEnd,
      });
    }
  }

  for (const assessment of assessments) {
    const priority: IncidentPriority =
      assessment.status === "CRITICAL"
        ? "P0"
        : assessment.status.startsWith("CONFIRMED")
          ? "P1"
          : "P2";
    candidates.push({
      fingerprint: `auto:factor-assessment:${assessment.id}`,
      priority,
      category: "FACTOR_ASSESSMENT",
      title: `${assessment.factor.name}: ${assessment.status.replaceAll("_", " ").toLowerCase()}`,
      summary: assessment.evidence,
      targetType: assessment.targetType,
      targetId: assessment.targetId,
      targetName: assessment.targetName,
      score: priority === "P0" ? 95 : priority === "P1" ? 78 : 58,
      confidence: assessment.confidence,
      reasons: [
        `Assessment status is ${assessment.status}`,
        `Evidence confidence ${assessment.confidence}%`,
      ],
      recommendedAction:
        assessment.confidence >= 80
          ? "Review the evidence and begin the configured corrective workflow."
          : "Confirm the condition with another observation or appropriate measurement.",
    });
  }

  const activeFingerprints = candidates.map((candidate) => candidate.fingerprint);
  const existing = await prisma.incident.findMany({
    where: {
      gardenId,
      fingerprint: { startsWith: "auto:" },
      status: { notIn: ["RESOLVED", "DISMISSED"] },
    },
    select: { id: true, fingerprint: true },
  });
  const activeSet = new Set(activeFingerprints);
  const staleIds = existing.filter((incident) => !activeSet.has(incident.fingerprint)).map((incident) => incident.id);
  if (staleIds.length > 0) {
    await prisma.incident.updateMany({
      where: { id: { in: staleIds } },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
  }

  let changed = 0;
  for (const candidate of candidates) {
    const found = await prisma.incident.findUnique({
      where: { gardenId_fingerprint: { gardenId, fingerprint: candidate.fingerprint } },
      select: { id: true, status: true },
    });
    const incident = await prisma.incident.upsert({
      where: { gardenId_fingerprint: { gardenId, fingerprint: candidate.fingerprint } },
      create: {
        gardenId,
        fingerprint: candidate.fingerprint,
        priority: candidate.priority,
        category: candidate.category,
        title: candidate.title,
        summary: candidate.summary,
        targetType: candidate.targetType,
        targetId: candidate.targetId,
        targetName: candidate.targetName,
        score: candidate.score,
        confidence: candidate.confidence,
        reasons: candidate.reasons,
        recommendedAction: candidate.recommendedAction,
        ...(candidate.dueAt ? { dueAt: candidate.dueAt } : {}),
      },
      update: {
        priority: candidate.priority,
        category: candidate.category,
        title: candidate.title,
        summary: candidate.summary,
        targetName: candidate.targetName,
        score: candidate.score,
        confidence: candidate.confidence,
        reasons: candidate.reasons,
        recommendedAction: candidate.recommendedAction,
        ...(candidate.dueAt ? { dueAt: candidate.dueAt } : {}),
        ...(found?.status === "RESOLVED" ? { status: "NEW", resolvedAt: null } : {}),
      },
    });
    if (!found || found.status === "RESOLVED") {
      await queueIncidentNotifications(incident.id);
      changed += 1;
    }
  }

  return changed;
}
