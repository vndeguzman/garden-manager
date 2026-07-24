import nodemailer from "nodemailer";
import webPush from "web-push";
import type { IncidentPriority, Prisma } from "@prisma/client";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";

const priorityRank: Record<IncidentPriority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
};

function asObject(value: Prisma.JsonValue | null): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function buildMessage(incident: {
  priority: IncidentPriority;
  title: string;
  targetName: string;
  summary: string;
  recommendedAction: string | null;
}): string {
  return [
    `${incident.priority} garden alert: ${incident.title}.`,
    `Affected: ${incident.targetName}.`,
    incident.summary,
    incident.recommendedAction ? `Recommended: ${incident.recommendedAction}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function getVapidPublicKey(): string | null {
  return env.VAPID_PUBLIC_KEY ?? null;
}

export async function queueIncidentNotifications(incidentId: string): Promise<number> {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: { garden: { select: { name: true } } },
  });
  if (!incident) return 0;

  const endpoints = await prisma.notificationEndpoint.findMany({
    where: { gardenId: incident.gardenId, enabled: true },
  });
  const message = buildMessage(incident);
  let queued = 0;

  for (const endpoint of endpoints) {
    if (priorityRank[incident.priority] > priorityRank[endpoint.minimumPriority]) continue;
    const idempotencyKey = `${incident.id}:${endpoint.id}:${incident.detectedAt.toISOString()}`;
    const existing = await prisma.notificationDelivery.findUnique({ where: { idempotencyKey } });
    if (existing) continue;
    await prisma.notificationDelivery.create({
      data: {
        incidentId: incident.id,
        endpointId: endpoint.id,
        message,
        idempotencyKey,
      },
    });
    queued += 1;
  }

  return queued;
}

async function sendWebPush(
  config: Prisma.JsonValue | null,
  message: string,
  incidentId: string,
): Promise<string> {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    throw new Error("Web Push is not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.");
  }
  webPush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  const value = asObject(config);
  const endpoint = typeof value.endpoint === "string" ? value.endpoint : "";
  const keys = asObject((value.keys ?? null) as Prisma.JsonValue | null);
  const p256dh = typeof keys.p256dh === "string" ? keys.p256dh : "";
  const auth = typeof keys.auth === "string" ? keys.auth : "";
  if (!endpoint || !p256dh || !auth) throw new Error("Push endpoint is missing subscription keys.");

  const result = await webPush.sendNotification(
    { endpoint, keys: { p256dh, auth } },
    JSON.stringify({
      title: "Garden Manager alert",
      body: message,
      incidentId,
      url: `/?incident=${incidentId}`,
    }),
  );
  return String(result.statusCode);
}

async function sendEmail(address: string | null, message: string): Promise<string> {
  if (!address) throw new Error("Email endpoint has no address.");
  if (!env.SMTP_HOST) throw new Error("Email is not configured. Set SMTP_HOST and related settings.");
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    ...(env.SMTP_USER
      ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS ?? "" } }
      : {}),
  });
  const info = await transport.sendMail({
    from: env.SMTP_FROM,
    to: address,
    subject: "Garden Manager alert",
    text: message,
  });
  return info.messageId;
}

async function sendSpeaker(
  address: string | null,
  config: Prisma.JsonValue | null,
  message: string,
): Promise<string> {
  if (!address) throw new Error("Speaker endpoint has no webhook address.");
  const value = asObject(config);
  const token = typeof value.token === "string" ? value.token : null;
  const service = typeof value.service === "string" ? value.service : "speak";
  const entityId = typeof value.entityId === "string" ? value.entityId : null;
  const response = await fetch(address, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message,
      service,
      ...(entityId ? { entity_id: entityId } : {}),
    }),
  });
  if (!response.ok) throw new Error(`Speaker webhook returned ${response.status}`);
  return String(response.status);
}

export async function dispatchPendingNotifications(limit = 50): Promise<number> {
  const deliveries = await prisma.notificationDelivery.findMany({
    where: { status: "PENDING" },
    include: { endpoint: true, incident: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let processed = 0;
  for (const delivery of deliveries) {
    try {
      let providerMessageId = "";
      if (!delivery.endpoint.enabled) {
        await prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: { status: "SKIPPED", error: "Endpoint disabled" },
        });
        processed += 1;
        continue;
      }

      if (delivery.endpoint.channel === "WEB_PUSH") {
        providerMessageId = await sendWebPush(
          delivery.endpoint.config,
          delivery.message,
          delivery.incidentId,
        );
      } else if (delivery.endpoint.channel === "EMAIL") {
        providerMessageId = await sendEmail(delivery.endpoint.address, delivery.message);
      } else {
        providerMessageId = await sendSpeaker(
          delivery.endpoint.address,
          delivery.endpoint.config,
          delivery.message,
        );
      }

      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "SENT",
          attemptCount: { increment: 1 },
          sentAt: new Date(),
          providerMessageId,
          error: null,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown notification failure";
      const attemptCount = delivery.attemptCount + 1;
      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: attemptCount >= 3 ? "FAILED" : "PENDING",
          attemptCount,
          failedAt: new Date(),
          error: message,
        },
      });
      logger.warn({ deliveryId: delivery.id, error: message }, "notification delivery failed");
    }
    processed += 1;
  }
  return processed;
}
