import { SupportersAdminBoard } from "@/components/admin/supporters-admin-board";
import { getAdminSupportersPage } from "@/lib/data/admin";

export const metadata = {
  title: "관리자 후원회 관리",
  description: "후원자 명단과 후원금 정보를 관리합니다.",
};

export default async function AdminSupportersPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const page = Number(params.page ?? "1") || 1;
  const supportersPage = await getAdminSupportersPage(page);

  return (
    <SupportersAdminBoard
      supporters={supportersPage.items}
      pagination={supportersPage}
    />
  );
}
