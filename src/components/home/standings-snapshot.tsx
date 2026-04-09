import { SurfaceCard } from "@/components/ui/surface-card";
import type { Standing } from "@/types";

interface StandingsSnapshotProps {
  standings: Standing[];
}

export function StandingsSnapshot({ standings }: StandingsSnapshotProps) {
  return (
    <SurfaceCard className="p-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-blue)]">
            League Table
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-950">수원FC 주변 순위</h2>
        </div>
        <p className="text-xs text-slate-500">현재 시즌 기준</p>
      </div>
      <div className="mt-4 space-y-2">
        {standings.map((standing) => {
          const highlighted = standing.team_name === "수원FC";

          return (
            <div
              key={standing.id}
              className={`grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-[20px] px-4 py-3 ${
                highlighted
                  ? "bg-[linear-gradient(135deg,rgba(13,27,112,0.96),rgba(21,93,252,0.92))] text-white"
                  : "bg-[rgba(21,93,252,0.06)] text-slate-700"
              }`}
            >
              <span className="text-lg font-black">{standing.rank}</span>
              <div className="min-w-0">
                <p className="truncate font-bold">{standing.team_name}</p>
                <p
                  className={`text-xs ${
                    highlighted ? "text-white/70" : "text-slate-500"
                  }`}
                >
                  {standing.played}경기 · 득실 {standing.goal_diff > 0 ? "+" : ""}
                  {standing.goal_diff}
                </p>
              </div>
              <span className="text-lg font-black">{standing.points}</span>
            </div>
          );
        })}
      </div>
    </SurfaceCard>
  );
}
