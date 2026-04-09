import { ChantsAdminBoard } from "@/components/admin/chants-admin-board";
import { getAdminChantsPage } from "@/lib/data/admin";

export const metadata = {
  title: "관리자 응원가 관리",
  description: "응원가 목록과 오디오 메타데이터를 관리합니다.",
};

export default async function AdminChantsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const page = Number(params.page ?? "1") || 1;
  const chantsPage = await getAdminChantsPage(page);

  return <ChantsAdminBoard chants={chantsPage.items} pagination={chantsPage} />;
}
