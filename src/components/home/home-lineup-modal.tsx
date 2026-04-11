"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";

import type { HomeMatchLineup } from "@/lib/data/public";
import { formatRoundLabel } from "@/lib/utils";
import { SurfaceCard } from "@/components/ui/surface-card";

function getStorageKey(matchId: string) {
  return `home-lineup-dismissed:${matchId}`;
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export function HomeLineupModal({ lineup }: { lineup: HomeMatchLineup | null }) {
  const [closed, setClosed] = useState(false);

  const storageKey = useMemo(
    () => (lineup ? getStorageKey(lineup.matchId) : null),
    [lineup],
  );

  const dismissed =
    typeof window !== "undefined" && storageKey
      ? window.localStorage.getItem(storageKey) === "1"
      : false;

  if (!lineup || dismissed || closed) {
    return null;
  }

  const roundLabel = formatRoundLabel(lineup.round);
  const opponentName =
    lineup.teamName === lineup.homeTeamName ? lineup.awayTeamName : lineup.homeTeamName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-4">
      <button
        type="button"
        aria-label="라인업 닫기"
        className="absolute inset-0"
        onClick={() => setClosed(true)}
      />

      <SurfaceCard className="relative z-10 flex max-h-[calc(100dvh-7rem)] w-full max-w-[34rem] flex-col overflow-hidden p-0">
        <button
          type="button"
          aria-label="라인업 닫기"
          onClick={() => setClosed(true)}
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex-1 overflow-y-auto px-5 pb-4 pt-5">
          <div className="space-y-1 pr-10">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-700">
              Match Lineup
            </p>
            <h2 className="text-2xl font-black text-slate-950">오늘의 라인업</h2>
            <p className="text-sm text-slate-600">
              {lineup.teamName} vs {opponentName}
            </p>
            <p className="text-xs font-semibold text-slate-500">
              {lineup.season} / {lineup.competitionCode}
              {roundLabel ? ` / ${roundLabel}` : lineup.stageLabel ? ` / ${lineup.stageLabel}` : ""}
              {" / "}
              {formatDateLabel(lineup.matchDate)}
            </p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-900">선발 11명</p>
              <div className="grid gap-2">
                {lineup.starters.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-slate-800">
                      {index + 1}. {player.squadNumber ? `${player.squadNumber} ` : ""}
                      {player.name}
                      {player.isCaptain ? " (C)" : ""}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{player.position}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-900">후보</p>
              <div className="grid gap-2">
                {lineup.bench.length ? (
                  lineup.bench.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="font-semibold text-slate-800">
                        {player.squadNumber ? `${player.squadNumber} ` : ""}
                        {player.name}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{player.position}</span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    아직 후보 선수가 등록되지 않았습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4">
          <button
            type="button"
            onClick={() => setClosed(true)}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={() => {
              if (storageKey) {
                window.localStorage.setItem(storageKey, "1");
              }
              setClosed(true);
            }}
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            다시 보지 않기
          </button>
        </div>
      </SurfaceCard>
    </div>
  );
}
