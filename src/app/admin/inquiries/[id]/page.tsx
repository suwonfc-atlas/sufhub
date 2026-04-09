import { notFound } from "next/navigation";

import { InquiryAdminDetail } from "@/components/admin/inquiry-admin-detail";
import { getAdminInquiryById } from "@/lib/data/admin";
import type { InquiryStatus } from "@/types";

export const metadata = {
  title: "관리자 문의 상세",
  description: "문의 상세 내용을 확인하고 상태를 변경합니다.",
};

export default async function AdminInquiryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ page?: string; status?: string }>;
}) {
  const { id } = await params;
  const inquiry = await getAdminInquiryById(id);

  if (!inquiry) {
    notFound();
  }

  const query = (await searchParams) ?? {};
  const nextParams = new URLSearchParams();

  if (query.page) nextParams.set("page", query.page);
  if (
    query.status === "inquiry" ||
    query.status === "processing" ||
    query.status === "completed"
  ) {
    nextParams.set("status", query.status as InquiryStatus);
  }

  const backHref = nextParams.toString()
    ? `/admin/inquiries?${nextParams.toString()}`
    : "/admin/inquiries";

  return <InquiryAdminDetail inquiry={inquiry} backHref={backHref} />;
}
