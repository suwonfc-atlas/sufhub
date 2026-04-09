"use client";

import { useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { PlayerStat } from "@/types";

export function PlayerStatsBoard({ stats }: { stats: PlayerStat[] }) {
  const seasons = useMemo(
    () =>
      Array.from(new Set(stats.map((stat) => stat.season))).sort((a, b) =>
        b.localeCompare(a),
      ),
    [stats],
  );
  const [selectedSeason, setSelectedSeason] = useState(seasons[0] ?? "");

  const filteredStats = useMemo(
    () =>
      stats
        .filter((stat) => stat.season === selectedSeason)
        .sort((a, b) => b.goals - a.goals || b.assists - a.assists),
    [selectedSeason, stats],
  );

  if (!stats.length) {
    return (
      <EmptyState
        title="선수 스탯 데이터가 없습니다"
        description="`player_stats` 테이블이 연결되면 시즌별 기록 테이블이 이곳에 표시됩니다."
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
                {["선수", "포지션", "출장", "골", "도움", "경고", "퇴장"].map(
                  (header) => (
                    <th key={header} className="px-4 py-4 font-semibold">
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filteredStats.map((stat) => (
                <tr key={stat.id} className="border-t border-slate-100 text-slate-700">
                  <td className="px-4 py-4 font-semibold text-slate-950">
                    {stat.player?.name ?? "등록 예정"}
                  </td>
                  <td className="px-4 py-4">{stat.player?.position ?? "-"}</td>
                  <td className="px-4 py-4">{stat.appearances}</td>
                  <td className="px-4 py-4">{stat.goals}</td>
                  <td className="px-4 py-4">{stat.assists}</td>
                  <td className="px-4 py-4">{stat.yellow_cards}</td>
                  <td className="px-4 py-4">{stat.red_cards}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
}
