import { cn } from "@/lib/utils";
import type { MatchStatus } from "@/types";

const badgeMap: Record<MatchStatus, string> = {
  scheduled: "bg-slate-100 text-slate-700",
  live: "bg-amber-100 text-amber-700",
  finished: "bg-sky-100 text-sky-800",
};

const labelMap: Record<MatchStatus, string> = {
  scheduled: "예정",
  live: "진행중",
  finished: "종료",
};

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        badgeMap[status],
      )}
    >
      {labelMap[status]}
    </span>
  );
}
