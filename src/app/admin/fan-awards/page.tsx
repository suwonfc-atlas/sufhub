import { FanAwardsAdminBoard } from "@/components/admin/fan-awards-admin-board";
import { getAdminFanAwardsPageData } from "@/lib/data/fan-awards";

export const metadata = {
  title: "팬 어워즈 관리",
  description: "팬 어워즈 스냅샷과 대표 한줄평을 관리합니다.",
};

export default async function AdminFanAwardsPage({
  searchParams,
}: {
  searchParams?: Promise<{ season?: string; month?: string; page?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const page = Number(params.page ?? "1") || 1;
  const data = await getAdminFanAwardsPageData(params.season, params.month, page);

  return <FanAwardsAdminBoard data={data} />;
}
