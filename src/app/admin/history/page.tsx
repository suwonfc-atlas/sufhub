import { HistoryAdminBoard } from "@/components/admin/history-admin-board";
import {
  getAdminHistoryTimelinePage,
  getAdminStadiumsPage,
  getAdminTicketsPage,
  getAdminUniformsPage,
} from "@/lib/data/admin";

export const metadata = {
  title: "관리자 히스토리 관리",
  description: "연표, 경기장, 유니폼 아카이브를 관리합니다.",
};

export default async function AdminHistoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; tab?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const page = Number(params.page ?? "1") || 1;
  const tab =
    params.tab === "stadiums" || params.tab === "tickets" || params.tab === "uniforms"
      ? params.tab
      : "timeline";

  const [timelinePage, stadiumsPage, ticketsPage, uniformsPage] = await Promise.all([
    getAdminHistoryTimelinePage(tab === "timeline" ? page : 1),
    getAdminStadiumsPage(tab === "stadiums" ? page : 1),
    getAdminTicketsPage(tab === "tickets" ? page : 1),
    getAdminUniformsPage(tab === "uniforms" ? page : 1),
  ]);

  return (
    <HistoryAdminBoard
      timeline={timelinePage}
      stadiums={stadiumsPage}
      tickets={ticketsPage}
      uniforms={uniformsPage}
      initialTab={tab}
    />
  );
}
