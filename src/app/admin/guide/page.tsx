import { GuideAdminBoard } from "@/components/admin/guide-admin-board";
import { getAdminGuideContentsPage } from "@/lib/data/admin";

export const metadata = {
  title: "관리자 가이드 관리",
  description: "소모임과 채널 가이드 콘텐츠를 관리합니다.",
};

export default async function AdminGuidePage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; tab?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const page = Number(params.page ?? "1") || 1;
  const tab = params.tab === "community" ? "community" : "groups";
  const guidePage = await getAdminGuideContentsPage(tab, page);

  return (
    <GuideAdminBoard
      guideContents={guidePage.items}
      pagination={guidePage}
      initialTab={tab}
    />
  );
}
