"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { LeagueCode, Season, Standing } from "@/types";

interface StandingsAdminBoardProps {
  seasons: Season[];
  selectedSeason: string;
  selectedLeague: LeagueCode;
  standings: Standing[];
}

export function StandingsAdminBoard({
  seasons,
  selectedSeason,
  selectedLeague,
  standings,
}: StandingsAdminBoardProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildHref = (season: string, league: LeagueCode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("season", season);
    params.set("league", league);
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="grid auto-rows-min gap-3">
      {seasons.length ? (
        <div className="inline-flex max-w-full flex-wrap items-start content-start self-start gap-2">
          {seasons.map((season) => {
            const active = season.code === selectedSeason;
            return (
              <Link
                key={season.code}
                href={buildHref(season.code, selectedLeague)}
                scroll={false}
                className={cn(
                  "inline-flex h-7 items-center rounded-full px-3 text-sm font-semibold leading-none transition",
                  active
                    ? "bg-slate-950 !text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700",
                )}
              >
                {season.code}
              </Link>
            );
          })}
        </div>
      ) : null}

      <div className="inline-flex max-w-full flex-wrap items-start content-start self-start gap-2">
        {(["K1", "K2"] as LeagueCode[]).map((league) => {
          const active = league === selectedLeague;
          return (
            <Link
              key={league}
              href={buildHref(selectedSeason, league)}
              scroll={false}
              className={cn(
                "inline-flex h-7 items-center rounded-full px-3 text-sm font-semibold leading-none transition",
                active
                  ? "bg-slate-950 !text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700",
              )}
            >
              {league}
            </Link>
          );
        })}
      </div>

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
                {["순위", "팀", "승점", "경기", "승", "무", "패", "득", "실", "득실"].map((header) => (
                  <th key={header} className="px-4 py-3 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {standings.length ? (
                standings.map((standing) => (
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
