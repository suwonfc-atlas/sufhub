"use client";

import { useMemo, useState, useTransition } from "react";

import {
  submitInquiry,
  type ContactInquiryInput,
  type ContactInquiryResult,
} from "@/app/contact/actions";
import type { Inquiry } from "@/types";

const INQUIRY_TYPE_OPTIONS: Array<{
  label: string;
  value: ContactInquiryInput["type"];
}> = [
  { label: "문의", value: "inquiry" },
  { label: "제보", value: "report" },
  { label: "제안", value: "suggestion" },
  { label: "자랑", value: "brag" },
  { label: "상담", value: "consultation" },
  { label: "기타", value: "other" },
];

const TYPE_HELPERS: Record<ContactInquiryInput["type"], string> = {
  inquiry: "궁금한 것은 무엇이든 물어보세요",
  report: "앱 내의 수정되어야 하는 내용이 있다면 무엇이든 제보하세요",
  suggestion: "필요한 기능이 있거나 협업 제안을 해보세요",
  brag: "후원, 홍보 등 자랑하면 칭찬해 줘요 :)",
  consultation: "무슨 일 있으세요? 이야기 들려 주세요",
  other: "기타 문의하실 내용을 남겨 주세요",
};

const EMPTY_FORM: ContactInquiryInput = {
  title: "",
  type: "inquiry",
  content: "",
};

export function InquiryForm({
  onComplete,
  onCancel,
}: {
  onComplete?: (inquiry?: Inquiry) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<ContactInquiryInput>({ ...EMPTY_FORM });
  const [result, setResult] = useState<ContactInquiryResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const helperDescription = useMemo(() => TYPE_HELPERS[form.type], [form.type]);

  const handleSubmit = () => {
    startTransition(async () => {
      const next = await submitInquiry(form);
      setResult(next);

      if (next.status === "success") {
        setForm({ ...EMPTY_FORM });
        onComplete?.(next.inquiry);
      }
    });
  };

  return (
    <section className="rounded-[24px] border border-white/70 bg-white/90 px-5 py-5 shadow-[0_18px_48px_rgba(22,56,112,0.1)]">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-blue)]">
          Contact
        </p>
        <h2 className="text-xl font-black text-slate-950">문의 보내기</h2>
        <p className="text-sm leading-6 text-slate-600">
          문의, 제보, 제안, 자랑, 상담 등 필요한 내용을 간단히 남겨 주세요.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">제목</span>
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-400"
            placeholder="제목을 입력해 주세요"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-slate-700">타입</span>
          <select
            value={form.type}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                type: event.target.value as ContactInquiryInput["type"],
              }))
            }
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-400"
          >
            {INQUIRY_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-xl border border-sky-100 bg-sky-50 px-3.5 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-500">Guide</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">{helperDescription}</p>
        </div>

        <label className="grid gap-1.5 md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">내용</span>
          <textarea
            value={form.content}
            onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
            className="min-h-36 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm leading-6 text-slate-700 outline-none focus:border-sky-400"
            placeholder="문의 내용을 자세히 적어 주세요"
          />
        </label>
      </div>

      {result ? (
        <div
          className={`mt-4 rounded-xl px-3.5 py-2.5 text-sm ${
            result.status === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {result.message}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            취소
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
        >
          {isPending ? "접수 중..." : "문의 보내기"}
        </button>
      </div>
    </section>
  );
}
