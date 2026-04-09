"use client";

import { useMemo, useState } from "react";

import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { Standing } from "@/types";

export function StandingsAdminBoard({ standings }: { standings: Standing[] }) {
  const seasons = useMemo(
    () =>
      Array.from(new Set(standings.map((standing) => standing.season))).sort((a, b) =>
        b.localeCompare(a),
      ),
    [standings],
  );
  const [selectedSeason, setSelectedSeason] = useState(seasons[0] ?? "");
  const [selectedLeague, setSelectedLeague] = useState<"K1" | "K2">("K1");

  const visibleRows = useMemo(
    () =>
      standings.filter(
        (standing) =>
          standing.season === selectedSeason && (standing.league_code ?? "K1") === selectedLeague,
      ),
    [selectedLeague, selectedSeason, standings],
  );

  return (
    <div className="grid auto-rows-min gap-3">
      {seasons.length ? (
        <AdminSectionTabs
          tabs={seasons.map((season) => ({ key: season, label: season }))}
          activeKey={selectedSeason}
          onChange={setSelectedSeason}
        />
      ) : null}

      <AdminSectionTabs
        tabs={[
          { key: "K1", label: "K1" },
          { key: "K2", label: "K2" },
        ]}
        activeKey={selectedLeague}
        onChange={(key) => setSelectedLeague(key as "K1" | "K2")}
      />

      <SurfaceCard className="overflow-hidden p-0">
        <div className="border-b border-slate-100 px-4 py-3.5">
          <h2 className="text-lg font-black text-slate-950">자동 순위</h2>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            전체 경기 결과를 기준으로 계산된 순위를 확인합니다.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-950 text-sm text-white">
              <tr>
                {["순위", "팀", "승점", "경기", "승", "무", "패", "득", "실", "득실"].map(
                  (header) => (
                    <th key={header} className="px-4 py-3 font-semibold">
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {visibleRows.length ? (
                visibleRows.map((standing) => (
                  <tr key={standing.id} className="border-t border-slate-100 text-sm text-slate-700">
                    <td className="px-4 py-3 font-black">{standing.rank}</td>
                    <td className="px-4 py-3 font-semibold">{standing.team_name}</td>
                    <td className="px-4 py-3 font-black text-slate-950">{standing.points}</td>
                    <td className="px-4 py-3">{standing.played}</td>
                    <td className="px-4 py-3">{standing.won}</td>
                    <td className="px-4 py-3">{standing.drawn}</td>
                    <td className="px-4 py-3">{standing.lost}</td>
                    <td className="px-4 py-3">{standing.goals_for}</td>
                    <td className="px-4 py-3">{standing.goals_against}</td>
                    <td className="px-4 py-3">
                      {standing.goal_diff > 0 ? "+" : ""}
                      {standing.goal_diff}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-500">
                    아직 계산된 순위가 없습니다. 먼저 경기 결과를 입력해 주세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
}
