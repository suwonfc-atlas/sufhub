import { InquiriesAdminBoard } from "@/components/admin/inquiries-admin-board";
import { getAdminInquiriesPage } from "@/lib/data/admin";
import type { InquiryStatus } from "@/types";

export const metadata = {
  title: "관리자 문의 관리",
  description: "사용자 문의를 상태별로 확인합니다.",
};

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; status?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const page = Number(params.page ?? "1") || 1;
  const status = (
    params.status === "inquiry" ||
    params.status === "processing" ||
    params.status === "completed"
      ? params.status
      : "all"
  ) as "all" | InquiryStatus;

  const inquiriesPage = await getAdminInquiriesPage(page, status);

  return (
    <InquiriesAdminBoard
      inquiries={inquiriesPage.items}
      pagination={inquiriesPage}
      status={status}
    />
  );
}
