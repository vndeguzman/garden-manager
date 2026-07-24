import { describe, expect, it } from "vitest";
import { computeDueStatus, computeNextDueAt } from "../src/modules/careTasks/careTasks.scheduler.js";

describe("computeNextDueAt", () => {
  it("adds intervalDays to lastCompletedAt when the task has been completed before", () => {
    const lastCompleted = new Date("2026-06-01T00:00:00.000Z");
    const next = computeNextDueAt(lastCompleted, 3);
    expect(next.toISOString()).toBe("2026-06-04T00:00:00.000Z");
  });

  it("falls back to `from` (task creation time) when never completed", () => {
    const createdAt = new Date("2026-06-01T00:00:00.000Z");
    const next = computeNextDueAt(null, 5, createdAt);
    expect(next.toISOString()).toBe("2026-06-06T00:00:00.000Z");
  });
});

describe("computeDueStatus", () => {
  const now = new Date("2026-06-10T12:00:00.000Z");

  it("is OVERDUE when nextDueAt is in the past", () => {
    const nextDueAt = new Date("2026-06-10T00:00:00.000Z");
    expect(computeDueStatus(nextDueAt, now)).toBe("OVERDUE");
  });

  it("is DUE_SOON when within the 24h window", () => {
    const nextDueAt = new Date("2026-06-11T06:00:00.000Z"); // 18h out
    expect(computeDueStatus(nextDueAt, now)).toBe("DUE_SOON");
  });

  it("is ON_TRACK when more than 24h out", () => {
    const nextDueAt = new Date("2026-06-15T00:00:00.000Z");
    expect(computeDueStatus(nextDueAt, now)).toBe("ON_TRACK");
  });

  it("treats the exact 24h boundary as DUE_SOON, not ON_TRACK", () => {
    const nextDueAt = new Date("2026-06-11T12:00:00.000Z"); // exactly 24h out
    expect(computeDueStatus(nextDueAt, now)).toBe("DUE_SOON");
  });
});
