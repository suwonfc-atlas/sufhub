import { UsersAdminBoard } from "@/components/admin/users-admin-board";
import { getAdminUsersPage } from "@/lib/data/admin";

export const metadata = {
  title: "관리자 회원 관리",
  description: "가입한 사용자 정보를 관리합니다.",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const page = Number(params.page ?? "1") || 1;
  const usersPage = await getAdminUsersPage(page);

  return <UsersAdminBoard users={usersPage.items} pagination={usersPage} />;
}
