import { AdminDashboardSchedule } from "@/components/admin/admin-dashboard-schedule";
import {
  getAdminDashboardFanRatingContext,
  getAdminDashboardLineupContext,
  getAdminDashboardMatches,
  getAdminSeasons,
  getAdminTeams,
} from "@/lib/data/admin";

export const metadata = {
  title: "관리자 대시보드",
  description: "경기 일정, 결과, 라인업, 팬 평점 정산을 관리하는 관리자 대시보드입니다.",
};

interface AdminDashboardPageProps {
  searchParams?: Promise<{
    season?: string;
  }>;
}

export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardPageProps) {
  const params = (await searchParams) ?? {};
  const [seasons, teams, fanRatingContext] = await Promise.all([
    getAdminSeasons(),
    getAdminTeams(),
    getAdminDashboardFanRatingContext(),
  ]);

  const selectedSeasonId =
    (params.season && seasons.some((season) => season.id === params.season)
      ? params.season
      : undefined) ??
    seasons.find((season) => season.is_current)?.id ??
    seasons[0]?.id ??
    "";

  const [matches, lineupContext] = await Promise.all([
    getAdminDashboardMatches(selectedSeasonId || undefined),
    getAdminDashboardLineupContext(selectedSeasonId || undefined),
  ]);

  return (
    <AdminDashboardSchedule
      matches={matches}
      teams={teams}
      seasons={seasons}
      activeSeasonId={selectedSeasonId}
      primaryTeamId={lineupContext.primaryTeamId}
      roster={lineupContext.roster}
      lineups={lineupContext.lineups}
      fanRatingContext={fanRatingContext}
    />
  );
}
