import { MatchesAdminBoard } from "@/components/admin/matches-admin-board";
import {
  getAdminMatchesPage,
  getAdminSeasons,
  getAdminSeasonTeamLeagues,
  getAdminTeams,
} from "@/lib/data/admin";
import type { CompetitionCode } from "@/types";

export const metadata = {
  title: "관리자 경기 관리",
  description: "시즌과 리그 배정 기준으로 전체 경기 일정과 결과를 관리합니다.",
};

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string;
    competition?: string;
    season?: string;
    round?: string;
    stage?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const page = Number(params.page ?? "1") || 1;
  const competition =
    params.competition === "K1" ||
    params.competition === "K2" ||
    params.competition === "KOREA_CUP"
      ? (params.competition as CompetitionCode)
      : "all";
  const seasonId = params.season && params.season !== "all" ? params.season : undefined;
  const round =
    params.round && params.round !== "all" && Number(params.round) > 0
      ? Number(params.round)
      : undefined;
  const stage = params.stage && params.stage !== "all" ? params.stage : undefined;

  const [matchesPage, teams, seasons, seasonTeamLeagues] = await Promise.all([
    getAdminMatchesPage(page, competition, seasonId, round, stage),
    getAdminTeams(),
    getAdminSeasons(),
    getAdminSeasonTeamLeagues(),
  ]);

  return (
    <MatchesAdminBoard
      matches={matchesPage.items}
      teams={teams}
      seasons={seasons}
      seasonTeamLeagues={seasonTeamLeagues}
      pagination={matchesPage}
      initialCompetitionTab={competition}
      initialSeasonFilter={seasonId ?? "all"}
      initialRoundFilter={round ? String(round) : "all"}
      initialStageFilter={stage ?? "all"}
    />
  );
}
