import { StandingsAdminBoard } from "@/components/admin/standings-admin-board";
import { getAdminStandings } from "@/lib/data/admin";

export const metadata = {
  title: "관리자 자동 순위",
  description: "전체 경기 결과를 기준으로 계산된 리그 순위를 확인합니다.",
};

export default async function AdminStandingsPage() {
  const standings = await getAdminStandings();

  return <StandingsAdminBoard standings={standings} />;
}
