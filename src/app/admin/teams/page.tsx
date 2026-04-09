import { TeamsAdminBoard } from "@/components/admin/teams-admin-board";
import { getAdminTeamsPage } from "@/lib/data/admin";

export const metadata = {
  title: "관리자 팀 관리",
  description: "리그 배정 전에 사용할 팀 기본 정보와 홈경기장을 관리합니다.",
};

export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const page = Number(params.page ?? "1") || 1;
  const teamsPage = await getAdminTeamsPage(page);

  return <TeamsAdminBoard teams={teamsPage.items} pagination={teamsPage} />;
}
