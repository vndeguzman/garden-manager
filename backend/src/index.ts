import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";
import { startAutomationWorker } from "./modules/operations/automation.worker.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`garden-manager API listening on port ${env.PORT} (${env.NODE_ENV})`);
});
const automationWorker = startAutomationWorker();

// Production concern: on deploy platforms (Render, Fly.io, k8s) the process
// receives SIGTERM before being killed. Without this, in-flight requests
// get dropped and the DB pool isn't closed cleanly.
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully`);
  clearInterval(automationWorker);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("Shutdown complete");
    process.exit(0);
  });

  // Force-exit if graceful shutdown hangs
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});
