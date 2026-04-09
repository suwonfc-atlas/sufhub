"use client";

import Image from "next/image";
import { useState } from "react";

import { SurfaceCard } from "@/components/ui/surface-card";
import type {
  HomeLeagueStandingRow,
  HomePlayerLeaderMetric,
  HomePlayerLeaderRow,
} from "@/lib/data/public";
import { cn } from "@/lib/utils";
import type { LeagueCode } from "@/types";

interface HomeRankingsProps {
  currentSeason: string;
  defaultLeague: LeagueCode;
  initialLeagueRows: HomeLeagueStandingRow[];
  initialPlayerRows: HomePlayerLeaderRow[];
}

const LEAGUE_TABS: Array<{ id: LeagueCode; label: string; emptyLabel: string }> = [
  { id: "K1", label: "K1", emptyLabel: "K1 순위 데이터가 없습니다." },
  { id: "K2", label: "K2", emptyLabel: "K2 순위 데이터가 없습니다." },
];

const PLAYER_TABS: Array<{
  id: HomePlayerLeaderMetric;
  label: string;
  emptyLabel: string;
}> = [
  { id: "goals", label: "득점", emptyLabel: "득점 기록이 없습니다." },
  { id: "assists", label: "도움", emptyLabel: "도움 기록이 없습니다." },
  { id: "attack-point", label: "공격포인트", emptyLabel: "공격포인트 기록이 없습니다." },
  { id: "rating", label: "평균평점", emptyLabel: "평균평점 데이터가 없습니다." },
  { id: "minutes", label: "출전시간", emptyLabel: "출전시간 기록이 없습니다." },
  { id: "yellow-cards", label: "경고", emptyLabel: "경고 기록이 없습니다." },
  { id: "red-cards", label: "퇴장", emptyLabel: "퇴장 기록이 없습니다." },
];

function getCompactTeamName(teamName: string) {
  const aliasMap: Record<string, string> = {
    "울산 HD": "울산",
    "포항 스틸러스": "포항",
    "FC서울": "서울",
    "수원FC": "수원",
    "강원FC": "강원",
    "광주FC": "광주",
    "전북현대모터스": "전북",
    "전북 현대": "전북",
    "제주SKFC": "제주",
    "제주 SK": "제주",
    "대전하나시티즌": "대전",
    "김천상무": "김천",
    "인천유나이티드": "인천",
    "대구FC": "대구",
    "서울이랜드": "E랜",
    "서울E랜드": "E랜",
  };

  const normalized = teamName.replace(/\s+/g, " ").trim();
  if (aliasMap[normalized]) {
    return aliasMap[normalized];
  }

  const koreanOnly = normalized.replace(/[^가-힣A-Za-z]/g, "");
  if (koreanOnly.length >= 2) {
    return koreanOnly.slice(0, 2);
  }

  return normalized.replace(/\s+/g, "").slice(0, 2);
}

function getDisplayTeamName(teamName: string, teamShortName?: string | null) {
  const normalizedShortName = teamShortName?.trim();
  if (normalizedShortName) {
    return normalizedShortName;
  }

  return getCompactTeamName(teamName);
}

function TeamCell({
  teamName,
  teamShortName,
  teamLogoUrl,
  compact = false,
}: {
  teamName: string;
  teamShortName?: string | null;
  teamLogoUrl?: string | null;
  compact?: boolean;
}) {
  const label = getDisplayTeamName(teamName, teamShortName);

  return (
    <div className="flex min-w-0 items-center justify-start gap-1.5">
      {teamLogoUrl ? (
        <span
          className={cn(
            "relative shrink-0 overflow-hidden rounded-full border border-slate-100 bg-white",
            compact ? "h-5 w-5" : "h-[22px] w-[22px]",
          )}
        >
          <Image
            src={teamLogoUrl}
            alt={`${label} 로고`}
            fill
            sizes={compact ? "20px" : "22px"}
            className="object-contain p-0.5"
          />
        </span>
      ) : null}
      <span className="truncate whitespace-nowrap font-semibold">{label}</span>
    </div>
  );
}

export function HomeRankings({
  currentSeason,
  defaultLeague,
  initialLeagueRows,
  initialPlayerRows,
}: HomeRankingsProps) {
  const [selectedLeague, setSelectedLeague] = useState<LeagueCode>(defaultLeague);
  const [leagueRows, setLeagueRows] = useState<Record<LeagueCode, HomeLeagueStandingRow[]>>({
    K1: defaultLeague === "K1" ? initialLeagueRows : [],
    K2: defaultLeague === "K2" ? initialLeagueRows : [],
  });
  const [leagueLoading, setLeagueLoading] = useState(false);

  const [selectedPlayerPanel, setSelectedPlayerPanel] =
    useState<HomePlayerLeaderMetric>("goals");
  const [playerRows, setPlayerRows] = useState<Record<HomePlayerLeaderMetric, HomePlayerLeaderRow[]>>({
    goals: initialPlayerRows,
    assists: [],
    "attack-point": [],
    rating: [],
    minutes: [],
    "yellow-cards": [],
    "red-cards": [],
  });
  const [playerLoading, setPlayerLoading] = useState(false);

  const activeLeagueTab = LEAGUE_TABS.find((tab) => tab.id === selectedLeague) ?? LEAGUE_TABS[0];
  const activeLeagueRows = leagueRows[selectedLeague] ?? [];
  const activePlayerTab =
    PLAYER_TABS.find((tab) => tab.id === selectedPlayerPanel) ?? PLAYER_TABS[0];
  const activePlayerRows = playerRows[selectedPlayerPanel] ?? [];

  const handleSelectLeague = async (league: LeagueCode) => {
    if (league === selectedLeague) {
      return;
    }

    setSelectedLeague(league);
    setLeagueLoading(true);

    try {
      const response = await fetch(
        `/api/home/standings?season=${encodeURIComponent(currentSeason)}&league=${encodeURIComponent(league)}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Failed to load standings");
      }

      const data = (await response.json()) as { rows?: HomeLeagueStandingRow[] };
      setLeagueRows((prev) => ({
        ...prev,
        [league]: data.rows ?? [],
      }));
    } catch {
      setLeagueRows((prev) => ({
        ...prev,
        [league]: [],
      }));
    } finally {
      setLeagueLoading(false);
    }
  };

  const handleSelectPlayerPanel = async (metric: HomePlayerLeaderMetric) => {
    if (metric === selectedPlayerPanel) {
      return;
    }

    setSelectedPlayerPanel(metric);
    setPlayerLoading(true);

    try {
      const response = await fetch(
        `/api/home/player-leaders?season=${encodeURIComponent(currentSeason)}&metric=${encodeURIComponent(metric)}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Failed to load player leaders");
      }

      const data = (await response.json()) as { rows?: HomePlayerLeaderRow[] };
      setPlayerRows((prev) => ({
        ...prev,
        [metric]: data.rows ?? [],
      }));
    } catch {
      setPlayerRows((prev) => ({
        ...prev,
        [metric]: [],
      }));
    } finally {
      setPlayerLoading(false);
    }
  };

  return (
    <div className="grid gap-3">
      <SurfaceCard className="overflow-hidden p-0">
        <div className="border-b border-[color:var(--line)] px-3.5 py-3.5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-blue)]">
                League Table
              </p>
              <h2 className="mt-1 text-base font-black text-slate-950">리그 순위</h2>
            </div>
            <p className="text-[11px] text-slate-400">{currentSeason} 시즌</p>
          </div>

          <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1">
            {LEAGUE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => void handleSelectLeague(tab.id)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                  selectedLeague === tab.id
                    ? "bg-slate-950 !text-white"
                    : "bg-[rgba(13,27,112,0.06)] text-slate-600",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {leagueLoading ? (
          <div className="px-4 py-5 text-sm text-slate-500">순위를 불러오는 중입니다.</div>
        ) : activeLeagueRows.length ? (
          <>
            <div className="overflow-x-auto px-2.5 pb-2.5 pt-2 lg:hidden">
              <div className="min-w-[34rem]">
                <div className="grid w-full grid-cols-[2rem_minmax(5.5rem,1.8fr)_repeat(8,minmax(2rem,1fr))] items-center gap-x-1 rounded-[16px] bg-[rgba(13,27,112,0.04)] px-2 py-2 text-[10px] font-semibold text-slate-500">
                  {["순위", "팀", "승점", "경기", "승", "무", "패", "득", "실", "득실"].map(
                    (label) => (
                      <span
                        key={label}
                        className={cn(label === "팀" ? "text-left" : "text-center")}
                      >
                        {label}
                      </span>
                    ),
                  )}
                </div>

                <div className="mt-1.5 grid">
                  {activeLeagueRows.map((row) => (
                    <div
                      key={row.id}
                      className={cn(
                        "grid w-full grid-cols-[2rem_minmax(5.5rem,1.8fr)_repeat(8,minmax(2rem,1fr))] items-center gap-x-1 border-b border-[color:var(--line)] px-2 py-2.5 text-[11px] text-slate-700",
                        row.isHighlighted && "rounded-[14px] bg-[rgba(21,93,252,0.08)] text-slate-950",
                      )}
                    >
                      <span className="text-center font-black">{row.rank}</span>
                      <TeamCell
                        teamName={row.teamName}
                        teamShortName={row.teamShortName}
                        teamLogoUrl={row.teamLogoUrl}
                        compact
                      />
                      <span className="text-center font-black text-slate-950">{row.points}</span>
                      <span className="text-center">{row.played}</span>
                      <span className="text-center">{row.won}</span>
                      <span className="text-center">{row.drawn}</span>
                      <span className="text-center">{row.lost}</span>
                      <span className="text-center">{row.goalsFor}</span>
                      <span className="text-center">{row.goalsAgainst}</span>
                      <span className="text-center">
                        {row.goalDiff > 0 ? "+" : ""}
                        {row.goalDiff}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden px-2.5 pb-2.5 pt-2 lg:block">
              <div className="grid gap-1.5">
                <div className="grid w-full grid-cols-[3.25rem_minmax(9.5rem,2.5fr)_repeat(8,minmax(3.5rem,1fr))] items-center gap-3 rounded-[16px] bg-[rgba(13,27,112,0.04)] px-4 py-3 text-sm font-semibold text-slate-500">
                  {["순위", "팀", "승점", "경기", "승", "무", "패", "득", "실", "득실"].map(
                    (label) => (
                      <span
                        key={label}
                        className={cn(label === "팀" ? "text-left" : "text-center")}
                      >
                        {label}
                      </span>
                    ),
                  )}
                </div>

                <div className="grid gap-1.5">
                  {activeLeagueRows.map((row) => (
                    <div
                      key={row.id}
                      className={cn(
                        "grid w-full grid-cols-[3.25rem_minmax(9.5rem,2.5fr)_repeat(8,minmax(3.5rem,1fr))] items-center gap-3 border-b border-[color:var(--line)] px-4 py-3 text-base text-slate-700",
                        row.isHighlighted && "rounded-[14px] bg-[rgba(21,93,252,0.08)] text-slate-950",
                      )}
                    >
                      <span className="text-center font-black">{row.rank}</span>
                      <TeamCell
                        teamName={row.teamName}
                        teamShortName={row.teamShortName}
                        teamLogoUrl={row.teamLogoUrl}
                      />
                      <span className="text-center font-black text-slate-950">{row.points}</span>
                      <span className="text-center">{row.played}</span>
                      <span className="text-center">{row.won}</span>
                      <span className="text-center">{row.drawn}</span>
                      <span className="text-center">{row.lost}</span>
                      <span className="text-center">{row.goalsFor}</span>
                      <span className="text-center">{row.goalsAgainst}</span>
                      <span className="text-center">
                        {row.goalDiff > 0 ? "+" : ""}
                        {row.goalDiff}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="px-4 py-5 text-sm text-slate-500">{activeLeagueTab.emptyLabel}</div>
        )}
      </SurfaceCard>

      <SurfaceCard className="overflow-hidden p-0">
        <div className="border-b border-[color:var(--line)] px-3.5 py-3.5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-red)]">
                Squad Leaders
              </p>
              <h2 className="mt-1 text-base font-black text-slate-950">우리 선수 순위</h2>
            </div>
            <p className="text-[11px] text-slate-400">{currentSeason} 시즌</p>
          </div>
        </div>

        <div className="border-b border-[color:var(--line)] bg-[color:var(--surface)] px-3.5 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {PLAYER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => void handleSelectPlayerPanel(tab.id)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                  selectedPlayerPanel === tab.id
                    ? "bg-slate-950 !text-white"
                    : "bg-[rgba(13,27,112,0.06)] text-slate-600",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {playerLoading ? (
          <div className="px-4 py-5 text-sm text-slate-500">선수 순위를 불러오는 중입니다.</div>
        ) : activePlayerRows.length ? (
          <div className="max-h-[35rem] overflow-y-auto p-3.5">
            <div className="grid gap-2">
              {activePlayerRows.map((row, index) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1.75rem_1fr_auto] items-center gap-2.5 rounded-[16px] bg-[rgba(13,27,112,0.04)] px-3 py-2.5"
                >
                  <span className="text-sm font-black text-[color:var(--brand-navy)]">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">{row.name}</p>
                    <p className="text-[10px] text-slate-500">{row.position}</p>
                  </div>
                  <span className="text-sm font-black text-slate-950">{row.displayValue}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4 py-5 text-sm text-slate-500">{activePlayerTab.emptyLabel}</div>
        )}
      </SurfaceCard>
    </div>
  );
}
