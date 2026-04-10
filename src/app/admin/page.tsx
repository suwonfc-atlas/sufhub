import { AdminDashboardSchedule } from "@/components/admin/admin-dashboard-schedule";
import {
  getAdminDashboardLineupContext,
  getAdminMatches,
  getAdminSeasons,
  getAdminTeams,
} from "@/lib/data/admin";

export const metadata = {
  title: "관리자 대시보드",
  description: "경기 일정과 결과, 라인업을 관리하는 관리자 대시보드입니다.",
};

export default async function AdminDashboardPage() {
  const [matches, seasons, teams, lineupContext] = await Promise.all([
    getAdminMatches(),
    getAdminSeasons(),
    getAdminTeams(),
    getAdminDashboardLineupContext(),
  ]);

  return (
    <AdminDashboardSchedule
      matches={matches}
      teams={teams}
      seasons={seasons}
      primaryTeamId={lineupContext.primaryTeamId}
      roster={lineupContext.roster}
      lineups={lineupContext.lineups}
    />
  );
}
