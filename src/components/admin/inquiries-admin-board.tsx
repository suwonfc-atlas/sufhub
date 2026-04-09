"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import type { AdminPageResult } from "@/lib/data/admin";
import type { Inquiry, InquiryStatus, InquiryType } from "@/types";

const STATUS_TABS: Array<{ key: "all" | InquiryStatus; label: string }> = [
  { key: "all", label: "전체" },
  { key: "inquiry", label: "문의" },
  { key: "processing", label: "처리중" },
  { key: "completed", label: "처리완료" },
];

const STATUS_LABELS: Record<InquiryStatus, string> = {
  inquiry: "문의",
  processing: "처리중",
  completed: "처리완료",
};

const TYPE_LABELS: Record<InquiryType, string> = {
  inquiry: "문의",
  report: "제보",
  suggestion: "제안",
  brag: "자랑",
  consultation: "상담",
  other: "기타",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export function InquiriesAdminBoard({
  inquiries,
  pagination,
  status,
}: {
  inquiries: Inquiry[];
  pagination: AdminPageResult<Inquiry>;
  status: "all" | InquiryStatus;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const rows = inquiries.map((item) => ({
    id: item.id,
    cells: [
      <span key="created_at" className="font-semibold text-slate-500">
        {formatDateTime(item.created_at)}
      </span>,
      <span
        key="type"
        className="inline-flex rounded-full bg-[rgba(21,93,252,0.08)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--brand-blue)]"
      >
        {TYPE_LABELS[item.type]}
      </span>,
      <span key="title" className="block truncate font-semibold text-slate-900">
        {item.title}
      </span>,
      <span key="sender_name" className="truncate text-slate-600">
        {item.sender_name}
      </span>,
      <span key="reply_contact" className="truncate text-slate-600">
        {item.reply_contact}
      </span>,
      <span
        key="status"
        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
          item.status === "completed"
            ? "bg-emerald-50 text-emerald-700"
            : item.status === "processing"
              ? "bg-amber-50 text-amber-700"
              : "bg-slate-100 text-slate-700"
        }`}
      >
        {STATUS_LABELS[item.status]}
      </span>,
    ],
  }));

  return (
    <div className="grid auto-rows-min gap-3">
      <AdminSectionTabs
        tabs={STATUS_TABS}
        activeKey={status}
        onChange={(key) =>
          updateQuery({
            status: key === "all" ? null : key,
            page: null,
          })
        }
      />

      <AdminDataTable
        title="문의 목록"
        description={
          status === "all" || status === "inquiry"
            ? "접수된 순서대로 문의를 확인합니다."
            : "처리 상태별 문의를 최신순으로 확인합니다."
        }
        columns={["접수일시", "타입", "제목", "문의자", "회신 연락처", "상태"]}
        rows={rows}
        selectedIds={[]}
        onToggleRow={() => undefined}
        onToggleAll={() => undefined}
        onSelectRow={(id) => {
          const params = new URLSearchParams(searchParams.toString());
          const query = params.toString();
          router.push(query ? `${pathname}/${id}?${query}` : `${pathname}/${id}`);
        }}
        onCreate={() => undefined}
        onDeleteSelected={() => undefined}
        showCreateButton={false}
        showDeleteButton={false}
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalCount={pagination.totalCount}
        emptyMessage="표시할 문의가 없습니다."
      />
    </div>
  );
}
