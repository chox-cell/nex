import { formatStatus } from "../lib/format";

interface StateBadgeProps {
  status: string;
}

export function StateBadge({ status }: StateBadgeProps) {
  const s = status.toLowerCase();
  
  let toneClass = "badge-muted";
  if (s.includes("fail") || s.includes("block")) toneClass = "badge-fail";
  else if (s.includes("active") || s.includes("progress")) toneClass = "badge-active";
  else if (s.includes("done") || s.includes("verified") || s.includes("stable") || s.includes("go")) toneClass = "badge-done";

  return (
    <span className={`badge ${toneClass}`}>
      {formatStatus(status)}
    </span>
  );
}
