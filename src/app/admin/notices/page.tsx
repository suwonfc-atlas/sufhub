import { NoticesAdminBoard } from "@/components/admin/notices-admin-board";
import { getAdminNoticePageContent, getAdminNoticesPage } from "@/lib/data/admin";

export const metadata = {
  title: "관리자 공지사항 관리",
  description: "공지사항 페이지 소개와 공지 목록을 관리합니다.",
};

export default async function AdminNoticesPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const page = Number(params.page ?? "1") || 1;

  const [pageContent, noticesPage] = await Promise.all([
    getAdminNoticePageContent(),
    getAdminNoticesPage(page),
  ]);

  return (
    <NoticesAdminBoard
      pageContent={pageContent}
      notices={noticesPage.items}
      pagination={noticesPage}
    />
  );
}
