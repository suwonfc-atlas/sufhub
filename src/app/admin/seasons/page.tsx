import { SeasonsAdminBoard } from "@/components/admin/seasons-admin-board";
import {
  getAdminSeasons,
  getAdminSeasonsPage,
  getAdminSeasonTeamLeaguesPage,
  getAdminTeams,
} from "@/lib/data/admin";

export const metadata = {
  title: "관리자 시즌 관리",
  description: "시즌을 등록하고 시즌별 K1, K2 팀 배정을 관리합니다.",
};

export default async function AdminSeasonsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; tab?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const page = Number(params.page ?? "1") || 1;
  const tab = params.tab === "assignments" ? "assignments" : "seasons";

  const [allSeasons, teams, seasonsPage, assignmentsPage] = await Promise.all([
    getAdminSeasons(),
    getAdminTeams(),
    getAdminSeasonsPage(tab === "seasons" ? page : 1),
    getAdminSeasonTeamLeaguesPage(tab === "assignments" ? page : 1),
  ]);

  return (
    <SeasonsAdminBoard
      seasons={allSeasons}
      teams={teams}
      pagedSeasons={seasonsPage}
      pagedAssignments={assignmentsPage}
      initialTab={tab}
    />
  );
}
