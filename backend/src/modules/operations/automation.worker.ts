import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { dispatchPendingNotifications } from "./notifications.service.js";
import { refreshGardenIncidents } from "./triage.service.js";

let running = false;

async function automationCycle(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const gardens = await prisma.garden.findMany({ select: { id: true } });
    for (const garden of gardens) {
      await refreshGardenIncidents(garden.id);
    }
    const processed = await dispatchPendingNotifications();
    logger.debug({ gardens: gardens.length, deliveries: processed }, "automation cycle complete");
  } catch (error) {
    logger.error({ error }, "automation cycle failed");
  } finally {
    running = false;
  }
}

export function startAutomationWorker(): NodeJS.Timeout {
  const interval = setInterval(
    () => void automationCycle(),
    env.AUTOMATION_INTERVAL_SECONDS * 1000,
  );
  interval.unref();
  setTimeout(() => void automationCycle(), 5_000).unref();
  return interval;
}
