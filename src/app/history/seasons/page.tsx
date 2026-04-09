import { HistorySeasonArchiveBoard } from "@/components/history/history-season-archive-board";
import { getSeasonArchiveData } from "@/lib/data/public";
import type { LeagueCode } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "역대 시즌",
  description: "시즌별 순위와 수원FC 일정을 함께 확인합니다.",
};

interface HistorySeasonsPageProps {
  searchParams?: Promise<{
    season?: string;
    league?: string;
    team?: string;
    month?: string;
    competition?: string;
  }>;
}

export default async function HistorySeasonsPage({ searchParams }: HistorySeasonsPageProps) {
  const params = (await searchParams) ?? {};
  const league =
    params.league === "K1" || params.league === "K2" ? (params.league as LeagueCode) : undefined;

  const archive = await getSeasonArchiveData({
    season: params.season,
    league,
    team: params.team,
    month: params.month,
    competition:
      params.competition === "K1" ||
      params.competition === "K2" ||
      params.competition === "KOREA_CUP" ||
      params.competition === "all"
        ? params.competition
        : undefined,
  });

  return (
    <div className="page-grid">
      <HistorySeasonArchiveBoard
        seasons={archive.seasons.map((season) => season.code)}
        selectedSeason={archive.selectedSeason}
        leagues={archive.leagues}
        selectedLeague={archive.selectedLeague}
        teams={archive.teams}
        selectedTeamKey={archive.selectedTeamKey}
        selectedCompetition={archive.selectedCompetition}
        competitionOptions={archive.competitionOptions}
        selectedMonth={archive.selectedMonth}
        monthOptions={archive.monthOptions}
        primaryTeamId={archive.primaryTeam?.id ?? null}
        primaryLabel={archive.primaryTeam?.name ?? "수원FC"}
        standings={archive.standings}
        scheduleMode={archive.scheduleMode}
        scheduleMatches={archive.scheduleMatches}
      />
    </div>
  );
}
