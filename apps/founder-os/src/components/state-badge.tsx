import { formatStatus } from "../lib/format";

interface StateBadgeProps {
  status: string;
}

export function StateBadge({ status }: StateBadgeProps) {
  const toneClass = status.toLowerCase().includes("fail")
    ? "badge badge-fail"
    : status.toLowerCase().includes("block")
      ? "badge badge-blocked"
      : status.toLowerCase().includes("active") || status.toLowerCase().includes("progress")
        ? "badge badge-active"
        : status.toLowerCase().includes("done") || status.toLowerCase().includes("verified") || status.toLowerCase().includes("stable")
          ? "badge badge-done"
          : "badge badge-muted";

  return <span className={toneClass}>{formatStatus(status)}</span>;
}

