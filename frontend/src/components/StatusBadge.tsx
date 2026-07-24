import type { CareTaskDueStatus } from "@garden/shared";

const LABELS: Record<CareTaskDueStatus, string> = {
  OVERDUE: "Overdue",
  DUE_SOON: "Due soon",
  ON_TRACK: "On track",
};

export function StatusBadge({ status }: { status: CareTaskDueStatus }) {
  return <span className={`badge ${status}`}>{LABELS[status]}</span>;
}
