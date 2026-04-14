"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  saveInquiryAnswer,
  updateInquiryStatus,
  type AdminMutationResult,
} from "@/app/admin/actions";
import { AdminFormMessage } from "@/components/admin/admin-field-controls";
import { SurfaceCard } from "@/components/ui/surface-card";
import { parseKstDate } from "@/lib/utils";
import type { Inquiry, InquiryStatus, InquiryType } from "@/types";

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
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(parseKstDate(value));
}

export function InquiryAdminDetail({
  inquiry,
  backHref,
}: {
  inquiry: Inquiry;
  backHref: string;
}) {
  const router = useRouter();
  const [result, setResult] = useState<AdminMutationResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [answer, setAnswer] = useState(inquiry.answer_content ?? "");

  const handleUpdateStatus = (nextStatus: InquiryStatus) => {
    startTransition(async () => {
      const next = await updateInquiryStatus({ id: inquiry.id, status: nextStatus });
      setResult(next);
      if (next.status === "success") {
        router.refresh();
      }
    });
  };

  const handleSaveAnswer = () => {
    startTransition(async () => {
      const next = await saveInquiryAnswer({
        id: inquiry.id,
        answer_content: answer,
      });
      setResult(next);
      if (next.status === "success") {
        router.refresh();
      }
    });
  };

  return (
    <SurfaceCard className="grid auto-rows-min gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-blue)]">
            Inquiry Detail
          </p>
          <h2 className="text-2xl font-black text-slate-950">{inquiry.title}</h2>
          <p className="text-sm text-slate-500">{formatDateTime(inquiry.created_at)}</p>
        </div>
        <Link
          href={backHref}
          className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
        >
          목록으로
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[rgba(21,93,252,0.08)] px-3 py-1 text-xs font-semibold text-[color:var(--brand-blue)]">
          {TYPE_LABELS[inquiry.type]}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            inquiry.status === "completed"
              ? "bg-emerald-50 text-emerald-700"
              : inquiry.status === "processing"
                ? "bg-amber-50 text-amber-700"
                : "bg-slate-100 text-slate-700"
          }`}
        >
          {STATUS_LABELS[inquiry.status]}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">문의자</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">{inquiry.sender_name}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">처리 상태</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">{STATUS_LABELS[inquiry.status]}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">문의 내용</p>
        <div className="mt-3 whitespace-pre-line rounded-xl bg-white px-4 py-4 text-sm leading-7 text-slate-700">
          {inquiry.content}
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">답변</p>
        <p className="mt-1 text-xs text-emerald-600">
          {inquiry.answered_at ? formatDateTime(inquiry.answered_at) : "아직 답변이 없습니다."}
        </p>
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          className="mt-3 min-h-28 w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm leading-7 text-slate-700 outline-none focus:border-emerald-300"
          placeholder="답변 내용을 입력해 주세요."
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleSaveAnswer}
            disabled={isPending}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          >
            답변 저장
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["inquiry", "processing", "completed"] as InquiryStatus[]).map((status) => {
          const active = inquiry.status === status;

          return (
            <button
              key={status}
              type="button"
              onClick={() => handleUpdateStatus(status)}
              disabled={isPending || active}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-sky-50 hover:text-sky-700"
              } disabled:opacity-60`}
            >
              {STATUS_LABELS[status]}
            </button>
          );
        })}
      </div>

      <AdminFormMessage message={result?.message ?? null} status={result?.status} />
    </SurfaceCard>
  );
}
