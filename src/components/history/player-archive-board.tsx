"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import { useMemo, useState } from "react";

import { SurfaceCard } from "@/components/ui/surface-card";
import type { PlayerArchiveItem } from "@/lib/data/public";
import type { PlayerPosition } from "@/types";

const positionLabels: Record<PlayerPosition | "all", string> = {
  all: "전체",
  GK: "GK",
  DF: "DF",
  MF: "MF",
  FW: "FW",
};

export function PlayerArchiveBoard({ players }: { players: PlayerArchiveItem[] }) {
  const seasons = useMemo(() => {
    const seasonMap = new Map<string, { code: string; isCurrent: boolean }>();

    for (const player of players) {
      for (const season of player.player_seasons) {
        const code = season.season_record?.code ?? season.season;
        if (!code) continue;
        seasonMap.set(code, {
          code,
          isCurrent: seasonMap.get(code)?.isCurrent || Boolean(season.season_record?.is_current),
        });
      }
    }

    return Array.from(seasonMap.values()).sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      return b.code.localeCompare(a.code);
    });
  }, [players]);

  const [selectedSeason, setSelectedSeason] = useState(seasons[0]?.code ?? "");
  const [selectedPosition, setSelectedPosition] = useState<PlayerPosition | "all">(
    "all",
  );

  const filtered = useMemo(
    () =>
      players.filter(
        (player) =>
          player.player_seasons.some((season) => season.season === selectedSeason) &&
          (selectedPosition === "all" || player.position === selectedPosition),
      ),
    [players, selectedPosition, selectedSeason],
  );

  const sortedPlayers = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const aSeason = a.player_seasons.find((season) => season.season === selectedSeason);
        const bSeason = b.player_seasons.find((season) => season.season === selectedSeason);
        const aNumber = aSeason?.squad_number ?? 999;
        const bNumber = bSeason?.squad_number ?? 999;
        if (aNumber !== bNumber) return aNumber - bNumber;
        return a.name.localeCompare(b.name, "ko");
      }),
    [filtered, selectedSeason],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {seasons.map((season) => (
          <button
            key={season.code}
            type="button"
            onClick={() => setSelectedSeason(season.code)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              selectedSeason === season.code
                ? "bg-slate-950 text-white"
                : "bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-700"
            }`}
          >
            {season.code}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(positionLabels) as Array<keyof typeof positionLabels>).map(
          (position) => (
            <button
              key={position}
              type="button"
              onClick={() => setSelectedPosition(position)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedPosition === position
                  ? "bg-sky-100 text-sky-800"
                  : "bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {positionLabels[position]}
            </button>
          ),
        )}
      </div>

      <div className="grid gap-2">
        {sortedPlayers.map((player) => {
          const seasonInfo = player.player_seasons.find(
            (season) => season.season === selectedSeason,
          );

          return (
            <Link key={player.id} href={`/history/players/${player.id}`}>
              <SurfaceCard className="px-3 py-3 transition hover:border-sky-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-[20px] bg-[linear-gradient(145deg,#0d1b70,#155dfc)] text-white shadow-[0_12px_30px_rgba(8,20,76,0.16)]">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                      No
                    </span>
                    <span className="text-xl font-black">
                      {seasonInfo?.squad_number ?? "-"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-base font-black text-slate-950">
                        {player.name}
                      </p>
                      {seasonInfo?.is_captain ? (
                        <span className="rounded-full bg-amber-100 p-1 text-amber-700">
                          <Crown className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {seasonInfo?.notes ?? "메모 없음"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="rounded-full bg-[rgba(21,93,252,0.08)] px-3 py-1 text-xs font-semibold text-[color:var(--brand-blue)]">
                      {player.position}
                    </p>
                  </div>
                </div>
              </SurfaceCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
