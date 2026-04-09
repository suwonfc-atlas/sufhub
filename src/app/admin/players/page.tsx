import { PlayersAdminBoard } from "@/components/admin/players-admin-board";
import {
  getAdminPlayerRosterPage,
  getAdminSeasons,
  getAdminSeasonTeamLeagues,
  getAdminTeams,
} from "@/lib/data/admin";

export const metadata = {
  title: "관리자 선수 관리",
  description: "시즌별 선수 로스터와 스탯을 추가하고 수정하는 관리자 화면입니다.",
};

export default async function AdminPlayersPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; season?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const page = Number(params.page ?? "1") || 1;
  const seasonId = params.season && params.season !== "all" ? params.season : undefined;

  const [rosterPage, seasons, teams, seasonTeamLeagues] = await Promise.all([
    getAdminPlayerRosterPage(page, seasonId),
    getAdminSeasons(),
    getAdminTeams(),
    getAdminSeasonTeamLeagues(),
  ]);

  return (
    <PlayersAdminBoard
      roster={rosterPage}
      seasons={seasons}
      seasonTeamLeagues={seasonTeamLeagues}
      teams={teams}
      initialSeasonFilter={seasonId ?? "all"}
    />
  );
}
