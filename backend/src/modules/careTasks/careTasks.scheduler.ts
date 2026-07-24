import type { CareTaskDueStatus } from "@garden/shared";

const DUE_SOON_WINDOW_HOURS = 24;

/**
 * Pure function, no I/O — easy to unit test and easy to reason about.
 * Given when a task was last completed (or null if never) and its
 * recurrence interval, returns the next moment it's due.
 */
export function computeNextDueAt(lastCompletedAt: Date | null, intervalDays: number, from: Date = new Date()): Date {
  const base = lastCompletedAt ?? from;
  const next = new Date(base);
  next.setDate(next.getDate() + intervalDays);
  return next;
}

/**
 * Classifies a task's urgency relative to `now`. Kept as a pure function so
 * both the API (for the `dueStatus` field on CareTaskDto) and the tests can
 * share one definition of "overdue" instead of drifting.
 */
export function computeDueStatus(nextDueAt: Date, now: Date = new Date()): CareTaskDueStatus {
  const hoursUntilDue = (nextDueAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilDue < 0) return "OVERDUE";
  if (hoursUntilDue <= DUE_SOON_WINDOW_HOURS) return "DUE_SOON";
  return "ON_TRACK";
}
