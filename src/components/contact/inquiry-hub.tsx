"use client";

import { useMemo, useState } from "react";

import type { Inquiry, InquiryStatus, InquiryType } from "@/types";
import { parseKstDate } from "@/lib/utils";

import { InquiryForm } from "./inquiry-form";

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

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(parseKstDate(value));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(parseKstDate(value));
}

export function InquiryHub({
  initialInquiries,
  hasServiceAccess,
}: {
  initialInquiries: Inquiry[];
  hasServiceAccess: boolean;
}) {
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);
  const [view, setView] = useState<"list" | "form" | "detail">("list");
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeInquiry = useMemo(
    () => inquiries.find((item) => item.id === activeId) ?? null,
    [inquiries, activeId],
  );

  if (!hasServiceAccess) {
    return (
      <section className="rounded-[24px] border border-white/70 bg-white/90 px-5 py-5 text-sm text-slate-600 shadow-[0_18px_48px_rgba(22,56,112,0.1)]">
        문의 목록을 불러오기 위한 서버 설정이 아직 연결되지 않았습니다.
      </section>
    );
  }

  if (view === "form") {
    return (
      <InquiryForm
        onCancel={() => setView("list")}
        onComplete={(inquiry) => {
          if (inquiry) {
            setInquiries((current) => [inquiry, ...current]);
            setActiveId(inquiry.id);
            setView("detail");
            return;
          }
          setView("list");
        }}
      />
    );
  }

  if (view === "detail" && activeInquiry) {
    return (
      <section className="rounded-[24px] border border-white/70 bg-white/90 px-5 py-5 shadow-[0_18px_48px_rgba(22,56,112,0.1)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-blue)]">
              Inquiry Detail
            </p>
            <h2 className="text-xl font-black text-slate-950">{activeInquiry.title}</h2>
            <p className="text-sm text-slate-500">{formatDateTime(activeInquiry.created_at)}</p>
          </div>
          <button
            type="button"
            onClick={() => setView("list")}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            목록으로
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[rgba(21,93,252,0.08)] px-3 py-1 text-xs font-semibold text-[color:var(--brand-blue)]">
            {TYPE_LABELS[activeInquiry.type]}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              activeInquiry.status === "completed"
                ? "bg-emerald-50 text-emerald-700"
                : activeInquiry.status === "processing"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-slate-700"
            }`}
          >
            {STATUS_LABELS[activeInquiry.status]}
          </span>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              문의자
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800">{activeInquiry.sender_name}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              처리 상태
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {STATUS_LABELS[activeInquiry.status]}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            문의 내용
          </p>
          <div className="mt-3 whitespace-pre-line rounded-xl bg-white px-4 py-4 text-sm leading-7 text-slate-700">
            {activeInquiry.content}
          </div>
        </div>

        {activeInquiry.answer_content ? (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
              답변
            </p>
            <p className="mt-1 text-xs text-emerald-600">
              {activeInquiry.answered_at ? formatDateTime(activeInquiry.answered_at) : ""}
            </p>
            <div className="mt-3 whitespace-pre-line rounded-xl bg-white px-4 py-4 text-sm leading-7 text-slate-700">
              {activeInquiry.answer_content}
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  const rows = inquiries.map((item, index) => ({
    id: item.id,
    number: inquiries.length - index,
    title: item.title,
    created_at: formatDateLabel(item.created_at),
    type: TYPE_LABELS[item.type],
    status: STATUS_LABELS[item.status],
  }));

  return (
    <section className="rounded-[24px] border border-white/70 bg-white/90 px-5 py-5 shadow-[0_18px_48px_rgba(22,56,112,0.1)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-blue)]">
            Inquiry
          </p>
          <h2 className="text-xl font-black text-slate-950">내 문의 목록</h2>
          <p className="text-sm leading-6 text-slate-600">
            접수한 문의를 확인하고 답변을 한 곳에서 확인할 수 있습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setView("form")}
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
        >
          문의하기
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            <tr>
              <th className="py-2 pr-3">번호</th>
              <th className="py-2 pr-3">제목</th>
              <th className="py-2 pr-3">날짜</th>
              <th className="py-2 pr-3">타입</th>
              <th className="py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 text-slate-700">
                  <td className="py-3 pr-3 font-semibold text-slate-500">{row.number}</td>
                  <td className="py-3 pr-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveId(row.id);
                        setView("detail");
                      }}
                      className="text-left font-semibold text-slate-900 hover:text-sky-600"
                    >
                      {row.title}
                    </button>
                  </td>
                  <td className="py-3 pr-3 text-slate-500">{row.created_at}</td>
                  <td className="py-3 pr-3">{row.type}</td>
                  <td className="py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                  등록된 문의가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
