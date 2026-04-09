import { AdminDashboardSchedule } from "@/components/admin/admin-dashboard-schedule";
import { getAdminMatches, getAdminSeasons, getAdminTeams } from "@/lib/data/admin";

export const metadata = {
  title: "관리자 대시보드",
  description: "월별 전체 경기 일정과 경기 결과를 관리하는 관리자 대시보드입니다.",
};

export default async function AdminDashboardPage() {
  const [matches, seasons, teams] = await Promise.all([
    getAdminMatches(),
    getAdminSeasons(),
    getAdminTeams(),
  ]);

  return <AdminDashboardSchedule matches={matches} teams={teams} seasons={seasons} />;
}
