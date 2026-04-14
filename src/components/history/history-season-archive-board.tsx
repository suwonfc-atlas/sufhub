"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { MatchCard } from "@/components/matches/match-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn, formatDateLabel, formatRoundLabel, formatTimeLabel, parseKstDate } from "@/lib/utils";
import type { CompetitionCode, LeagueCode, LeagueMatch, Match, Standing, Team } from "@/types";

interface HistorySeasonArchiveBoardProps {
  seasons: string[];
  selectedSeason: string;
  leagues: LeagueCode[];
  selectedLeague: LeagueCode;
  teams: Team[];
  selectedTeamKey: string;
  selectedCompetition: "all" | CompetitionCode;
  competitionOptions: Array<"all" | CompetitionCode>;
  selectedMonth: string;
  monthOptions: string[];
  primaryLabel?: string;
  primaryTeamId: string | null;
  standings: Standing[];
  scheduleMode: "club" | "league";
  scheduleMatches: Match[] | LeagueMatch[];
}

function getDisplayTeamName(team?: Team | null, fallback?: string) {
  return team?.short_name ?? team?.name ?? fallback ?? "-";
}

function getMonthLabel(matchDate: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    timeZone: "Asia/Seoul",
  }).format(parseKstDate(matchDate));
}

function getCompetitionLabel(competition: "all" | CompetitionCode) {
  if (competition === "all") return "전체 대회";
  if (competition === "K1") return "K리그1";
  if (competition === "K2") return "K리그2";
  return "코리아컵";
}

function LeagueMatchCard({ match }: { match: LeagueMatch }) {
  const hasResult =
    match.status === "finished" &&
    match.home_score !== null &&
    match.away_score !== null;
  const hasHighlight = match.status === "finished" && Boolean(match.highlight_url);
  const homeName = getDisplayTeamName(match.home_team, "홈");
  const awayName = getDisplayTeamName(match.away_team, "원정");

  const winnerLabel = !hasResult
    ? null
    : (match.home_score ?? 0) > (match.away_score ?? 0)
      ? `${homeName} 승`
      : (match.home_score ?? 0) < (match.away_score ?? 0)
        ? `${awayName} 승`
        : "무승부";

  return (
    <SurfaceCard className="bg-white px-4 py-3">
      <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-start gap-2.5 sm:grid-cols-[4.5rem_minmax(0,1fr)_4.5rem] sm:gap-3">
        <div className="grid justify-items-center text-center">
          <p className="text-[11px] font-semibold text-[color:var(--brand-blue)] sm:text-xs">
            {formatDateLabel(match.match_date, false)}
          </p>
          <p className="mt-1 text-[10px] text-slate-500 sm:text-[11px]">
            {formatTimeLabel(match.match_date)}
          </p>
        </div>

        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 rounded-full bg-[rgba(21,93,252,0.08)] px-2 py-1 text-[10px] font-semibold text-[color:var(--brand-blue)] sm:px-2.5 sm:text-[11px]">
              {match.competition_code === "KOREA_CUP"
                ? (match.stage_label ?? match.competition)
                : (formatRoundLabel(match.round) ?? match.competition)}
            </span>

            <div className="flex min-w-0 items-center gap-1.5">
              {match.home_team?.logo_url ? (
                <span className="relative h-[24px] w-[24px] shrink-0 overflow-hidden rounded-full border border-slate-100 bg-white sm:h-7 sm:w-7">
                  <Image
                    src={match.home_team.logo_url}
                    alt={`${homeName} 로고`}
                    fill
                    sizes="28px"
                    className="object-contain p-0.5"
                  />
                </span>
              ) : null}
              <span className="truncate text-[13px] font-black leading-none text-slate-950 sm:text-[15px]">
                {homeName}
              </span>
              <span className="shrink-0 text-[11px] font-bold uppercase text-slate-700 sm:text-xs">
                vs
              </span>
              {match.away_team?.logo_url ? (
                <span className="relative h-[24px] w-[24px] shrink-0 overflow-hidden rounded-full border border-slate-100 bg-white sm:h-7 sm:w-7">
                  <Image
                    src={match.away_team.logo_url}
                    alt={`${awayName} 로고`}
                    fill
                    sizes="28px"
                    className="object-contain p-0.5"
                  />
                </span>
              ) : null}
              <span className="truncate text-[13px] font-black leading-none text-slate-950 sm:text-[15px]">
                {awayName}
              </span>
            </div>
          </div>

          <p className="mt-1 truncate text-[11px] text-slate-500 sm:text-xs">
            {match.stadium_name ?? "경기장 미입력"}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {winnerLabel ? (
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-[10px] font-black sm:px-2.5 sm:text-[11px]",
                  winnerLabel === "무승부"
                    ? "bg-slate-100 text-slate-500"
                    : "bg-[rgba(21,93,252,0.10)] text-[color:var(--brand-blue)]",
                )}
              >
                {winnerLabel}
              </span>
            ) : null}

            {hasHighlight && match.highlight_url ? (
              <button
                type="button"
                onClick={() => window.open(match.highlight_url!, "_blank", "noopener,noreferrer")}
                className="highlight-pill inline-flex rounded-full bg-[color:var(--brand-red)] px-3 py-1.5 text-[11px] font-semibold text-white sm:text-xs"
              >
                하이라이트
              </button>
            ) : null}
          </div>
        </div>

        <div className="text-right">
          <p className="text-[14px] font-black text-slate-950 sm:text-lg">
            {match.status === "finished"
              ? `${match.home_score ?? 0} : ${match.away_score ?? 0}`
              : "경기 전"}
          </p>
        </div>
      </div>
    </SurfaceCard>
  );
}

export function HistorySeasonArchiveBoard({
  seasons,
  selectedSeason,
  leagues,
  selectedLeague,
  teams,
  selectedTeamKey,
  selectedCompetition,
  competitionOptions,
  selectedMonth,
  monthOptions,
  primaryLabel = "수원FC",
  primaryTeamId,
  standings,
  scheduleMode,
  scheduleMatches,
}: HistorySeasonArchiveBoardProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildHref = (nextValues: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(nextValues).forEach(([key, value]) => {
      if (!value || value === "all" || value === "primary") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const activeTeamName =
    selectedTeamKey === "__all__"
      ? "전체"
      : selectedTeamKey === "primary"
        ? primaryLabel
        : (teams.find((team) => team.id === selectedTeamKey)?.short_name ??
            teams.find((team) => team.id === selectedTeamKey)?.name ??
            primaryLabel);

  const groupedMatches = useMemo(() => {
    const source = scheduleMatches as Array<Match | LeagueMatch>;
    const grouped = source.reduce<Record<string, Array<Match | LeagueMatch>>>((acc, match) => {
      const month = getMonthLabel(match.match_date);
      acc[month] = [...(acc[month] ?? []), match];
      return acc;
    }, {});

    return Object.entries(grouped);
  }, [scheduleMatches]);

  if (!seasons.length) {
    return (
      <EmptyState
        title="역대 시즌 데이터가 없습니다"
        description="시즌별 경기와 순위 데이터가 들어오면 여기에서 바로 확인할 수 있습니다."
      />
    );
  }

  return (
    <div className="grid gap-5">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-blue)]">
          Season Archive
        </p>
        <h1 className="text-[1.55rem] font-black leading-tight text-slate-950">역대 시즌</h1>
        <p className="text-sm leading-6 text-slate-600">
          시즌, 리그, 팀을 고를 때마다 필요한 순위와 일정만 다시 불러옵니다.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {seasons.map((season) => (
          <Link
            key={season}
            href={buildHref({ season, league: null, team: null, competition: null, month: null })}
            scroll={false}
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
        {leagues.map((league) => (
          <Link
            key={league}
            href={buildHref({
              season: selectedSeason,
              league,
              team: null,
              competition: null,
              month: null,
            })}
            scroll={false}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
              selectedLeague === league ? "bg-slate-950 !text-white" : "bg-white text-slate-600",
            )}
          >
            {league}
          </Link>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link
          href={buildHref({
            season: selectedSeason,
            league: selectedLeague,
            team: "primary",
            competition: null,
            month: null,
          })}
          scroll={false}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
            selectedTeamKey === "primary" ? "bg-slate-950 !text-white" : "bg-white text-slate-600",
          )}
        >
          내 팀
        </Link>
        <Link
          href={buildHref({
            season: selectedSeason,
            league: selectedLeague,
            team: "__all__",
            competition: null,
            month: null,
          })}
          scroll={false}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
            selectedTeamKey === "__all__" ? "bg-slate-950 !text-white" : "bg-white text-slate-600",
          )}
        >
          전체
        </Link>
        {teams.map((team) => (
          <Link
            key={team.id}
            href={buildHref({
              season: selectedSeason,
              league: selectedLeague,
              team: team.id,
              competition: null,
              month: null,
            })}
            scroll={false}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
              selectedTeamKey === team.id ? "bg-slate-950 !text-white" : "bg-white text-slate-600",
            )}
          >
            {team.short_name ?? team.name}
          </Link>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {competitionOptions.map((competition) => (
          <Link
            key={competition}
            href={buildHref({
              season: selectedSeason,
              league: selectedLeague,
              team: selectedTeamKey,
              competition,
              month: null,
            })}
            scroll={false}
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

      <SurfaceCard className="overflow-hidden p-0">
        <div className="border-b border-[color:var(--line)] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-blue)]">
            Standings
          </p>
          <h2 className="mt-1 text-lg font-black text-slate-950">
            {selectedSeason} 시즌 순위
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-950 text-sm text-white">
              <tr>
                {["순위", "팀", "승점", "경기", "승", "무", "패", "득", "실", "득실"].map((header) => (
                  <th
                    key={header}
                    className={cn(
                      "px-2 py-2 text-[10px] font-semibold text-white sm:px-4 sm:py-3 sm:text-sm",
                      header === "팀" ? "min-w-[7rem]" : "",
                    )}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {standings.length ? (
                standings.map((standing) => {
                  const highlighted = Boolean(primaryTeamId) && standing.team_id === primaryTeamId;
                  const displayName = standing.team_short_name ?? standing.team_name;

                  return (
                    <tr
                      key={standing.id}
                      className={cn(
                        "border-t border-slate-100 text-slate-700",
                        highlighted && "bg-sky-100 font-semibold text-sky-950",
                      )}
                    >
                      <td className="px-2 py-2 text-[12px] font-black sm:px-4 sm:py-3 sm:text-base">
                        {standing.rank}
                      </td>
                      <td className="px-2 py-2 sm:px-4 sm:py-3">
                        <div className="flex min-w-0 items-center gap-1.5">
                          {standing.team_logo_url ? (
                            <span className="relative h-[22px] w-[22px] shrink-0 overflow-hidden rounded-full border border-slate-100 bg-white sm:h-6 sm:w-6">
                              <Image
                                src={standing.team_logo_url}
                                alt={`${displayName} 로고`}
                                fill
                                sizes="24px"
                                className="object-contain p-0.5"
                              />
                            </span>
                          ) : null}
                          <span className="whitespace-nowrap text-[11px] sm:text-sm">{displayName}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-[11px] font-black sm:px-4 sm:py-3 sm:text-sm">{standing.points}</td>
                      <td className="px-2 py-2 text-[11px] sm:px-4 sm:py-3 sm:text-sm">{standing.played}</td>
                      <td className="px-2 py-2 text-[11px] sm:px-4 sm:py-3 sm:text-sm">{standing.won}</td>
                      <td className="px-2 py-2 text-[11px] sm:px-4 sm:py-3 sm:text-sm">{standing.drawn}</td>
                      <td className="px-2 py-2 text-[11px] sm:px-4 sm:py-3 sm:text-sm">{standing.lost}</td>
                      <td className="px-2 py-2 text-[11px] sm:px-4 sm:py-3 sm:text-sm">{standing.goals_for}</td>
                      <td className="px-2 py-2 text-[11px] sm:px-4 sm:py-3 sm:text-sm">{standing.goals_against}</td>
                      <td className="px-2 py-2 text-[11px] sm:px-4 sm:py-3 sm:text-sm">
                        {standing.goal_diff > 0 ? "+" : ""}
                        {standing.goal_diff}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-500">
                    해당 시즌 순위 데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      <div className="grid gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-blue)]">
            Schedule
          </p>
          <h2 className="text-lg font-black text-slate-950">{selectedSeason} 시즌 일정</h2>
          <p className="text-sm text-slate-500">
            현재 보기: {selectedLeague} / {getCompetitionLabel(selectedCompetition)} / {activeTeamName}
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <Link
            href={buildHref({
              season: selectedSeason,
              league: selectedLeague,
              team: selectedTeamKey,
              competition: selectedCompetition,
              month: null,
            })}
            scroll={false}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
              selectedMonth === "all" ? "bg-slate-950 !text-white" : "bg-white text-slate-600",
            )}
          >
            전체 월
          </Link>
          {monthOptions.map((month) => (
            <Link
              key={month}
                href={buildHref({
                  season: selectedSeason,
                  league: selectedLeague,
                  team: selectedTeamKey,
                  competition: selectedCompetition,
                  month,
                })}
              scroll={false}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                selectedMonth === month ? "bg-slate-950 !text-white" : "bg-white text-slate-600",
              )}
            >
              {month}
            </Link>
          ))}
        </div>

        {groupedMatches.length ? (
          groupedMatches.map(([month, monthMatches]) => (
            <div key={month} className="grid gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {month}
              </p>
              <div className="grid gap-2">
                {scheduleMode === "club"
                  ? (monthMatches as Match[]).map((match) => <MatchCard key={match.id} match={match} />)
                  : (monthMatches as LeagueMatch[]).map((match) => (
                      <LeagueMatchCard key={match.id} match={match} />
                    ))}
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="해당 조건의 일정이 없습니다"
            description="선택한 시즌, 리그, 팀 조건에 맞는 경기가 들어오면 여기에서 확인할 수 있습니다."
          />
        )}
      </div>
    </div>
  );
}
