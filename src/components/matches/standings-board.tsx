"use client";

import { useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { Standing } from "@/types";

export function StandingsBoard({ standings }: { standings: Standing[] }) {
  const seasons = useMemo(
    () => Array.from(new Set(standings.map((standing) => standing.season))).sort((a, b) => b.localeCompare(a)),
    [standings],
  );
  const [selectedSeason, setSelectedSeason] = useState(seasons[0] ?? "");

  const filteredStandings = useMemo(
    () =>
      standings
        .filter((standing) => standing.season === selectedSeason)
        .sort((a, b) => a.rank - b.rank),
    [selectedSeason, standings],
  );

  if (!standings.length) {
    return (
      <EmptyState
        title="리그 순위 데이터가 없습니다"
        description="등록된 경기 결과를 기준으로 시즌별 순위가 자동 계산됩니다."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {seasons.map((season) => (
          <button
            key={season}
            type="button"
            onClick={() => setSelectedSeason(season)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              selectedSeason === season
                ? "bg-slate-950 text-white"
                : "bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-700"
            }`}
          >
            {season} 시즌
          </button>
        ))}
      </div>
      <SurfaceCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-950 text-sm text-white">
              <tr>
                {["순위", "팀", "경기", "승", "무", "패", "득실", "승점"].map((header) => (
                  <th key={header} className="px-4 py-4 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStandings.map((standing) => {
                const highlighted = standing.team_name.includes("수원");

                return (
                  <tr
                    key={standing.id}
                    className={
                      highlighted
                        ? "bg-sky-100 font-semibold text-sky-950"
                        : "border-t border-slate-100 text-slate-700"
                    }
                  >
                    <td className="px-4 py-4 text-lg font-black">{standing.rank}</td>
                    <td className="px-4 py-4">{standing.team_short_name ?? standing.team_name}</td>
                    <td className="px-4 py-4">{standing.played}</td>
                    <td className="px-4 py-4">{standing.won}</td>
                    <td className="px-4 py-4">{standing.drawn}</td>
                    <td className="px-4 py-4">{standing.lost}</td>
                    <td className="px-4 py-4">
                      {standing.goal_diff > 0 ? "+" : ""}
                      {standing.goal_diff}
                    </td>
                    <td className="px-4 py-4 font-black">{standing.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
}
