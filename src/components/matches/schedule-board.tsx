"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { cn, groupMatchesByMonth } from "@/lib/utils";
import type { CompetitionCode, Match } from "@/types";

import { MatchCard } from "./match-card";

type ScheduleView = "all" | "upcoming" | "past";
type ScheduleCompetitionFilter = "all" | CompetitionCode;
const ACTIVE_TAB_STYLE = { color: "#fff", WebkitTextFillColor: "#fff" } as const;

function MatchSection({ matches }: { matches: Match[] }) {
  const groupedMatches = Object.entries(groupMatchesByMonth(matches));

  if (!groupedMatches.length) {
    return (
      <EmptyState
        title="표시할 경기 일정이 없습니다"
        description="선택한 시즌과 조건에 맞는 경기가 등록되면 여기에서 바로 확인할 수 있습니다."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {groupedMatches.map(([month, monthMatches]) => (
        <div key={month} className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {month}
          </p>
          <div className="grid gap-2">
            {monthMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function getCompetitionLabel(competition: ScheduleCompetitionFilter) {
  if (competition === "all") return "전체 대회";
  if (competition === "K1") return "K리그1";
  if (competition === "K2") return "K리그2";
  return "코리아컵";
}

export function ScheduleBoard({
  seasons,
  selectedSeason,
  selectedView,
  selectedCompetition,
  competitionOptions,
  matches,
}: {
  seasons: string[];
  selectedSeason: string;
  selectedView: ScheduleView;
  selectedCompetition: ScheduleCompetitionFilter;
  competitionOptions: ScheduleCompetitionFilter[];
  matches: Match[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildHref = (nextValues: {
    season?: string | null;
    view?: ScheduleView | null;
    competition?: ScheduleCompetitionFilter | null;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!nextValues.season) params.delete("season");
    else params.set("season", nextValues.season);

    if (!nextValues.view || nextValues.view === "all") params.delete("view");
    else params.set("view", nextValues.view);

    if (!nextValues.competition || nextValues.competition === "all") params.delete("competition");
    else params.set("competition", nextValues.competition);

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  if (!seasons.length) {
    return (
      <EmptyState
        title="등록된 경기 일정이 없습니다"
        description="시즌 데이터가 들어오면 이곳에서 수원FC 경기 일정을 바로 확인할 수 있습니다."
      />
    );
  }

  return (
    <div className="grid gap-5">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-blue)]">
          Match Center
        </p>
        <h1 className="text-[1.55rem] font-black leading-tight text-slate-950">
          {selectedSeason} 시즌 일정
        </h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {seasons.map((season) => (
          <Link
            key={season}
            href={buildHref({
              season,
              view: selectedView,
              competition: selectedCompetition,
            })}
            scroll={false}
            style={selectedSeason === season ? ACTIVE_TAB_STYLE : undefined}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
              selectedSeason === season ? "bg-slate-950 !text-white" : "bg-white text-slate-600",
            )}
          >
            {season} 시즌
          </Link>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {competitionOptions.map((competition) => (
          <Link
            key={competition}
            href={buildHref({
              season: selectedSeason,
              view: selectedView,
              competition,
            })}
            scroll={false}
            style={selectedCompetition === competition ? ACTIVE_TAB_STYLE : undefined}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
              selectedCompetition === competition
                ? "bg-slate-950 !text-white"
                : "bg-white text-slate-600",
            )}
          >
            {getCompetitionLabel(competition)}
          </Link>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: "all", label: "전체 일정" },
          { id: "upcoming", label: "남은 경기" },
          { id: "past", label: "지난 경기" },
        ].map((tab) => (
          <Link
            key={tab.id}
            href={buildHref({
              season: selectedSeason,
              view: tab.id as ScheduleView,
              competition: selectedCompetition,
            })}
            scroll={false}
            style={selectedView === tab.id ? ACTIVE_TAB_STYLE : undefined}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
              selectedView === tab.id ? "bg-slate-950 !text-white" : "bg-white text-slate-600",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-base font-black text-slate-950">
          {selectedView === "all"
            ? "전체 일정"
            : selectedView === "upcoming"
              ? "남은 경기"
              : "지난 경기"}
        </p>
        <p className="text-sm text-slate-500">{matches.length}경기</p>
      </div>

      <MatchSection matches={matches} />
    </div>
  );
}
