"use client";

import { useState } from "react";
import { HeartHandshake, X } from "lucide-react";

import type { Supporter } from "@/types";

export function SupportersRosterButton({
  supporters,
}: {
  supporters: Supporter[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(15,23,42,0.2)] transition hover:bg-sky-700"
      >
        <HeartHandshake className="h-4 w-4" />
        후원회 명단
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-[2px] md:items-center">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute inset-0"
            aria-label="후원회 명단 닫기"
          />
          <div className="relative z-10 w-full max-w-4xl rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,247,255,0.98))] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.28)] md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="inline-flex rounded-full bg-[rgba(21,93,252,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-blue)]">
                  Supporters
                </p>
                <div>
                  <h2 className="text-2xl font-black text-slate-950 md:text-[2rem]">
                    후원회 명단
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    SuFHub를 응원해 주신 분들을 입력 순서대로 소개합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.14)]"
                aria-label="후원회 명단 닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 max-h-[70vh] overflow-y-auto pr-1">
              {supporters.length ? (
                <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                  {supporters.map((supporter) => (
                    <p
                      key={supporter.id}
                      className="border-b border-[rgba(15,23,42,0.08)] pb-2 text-sm font-semibold text-slate-800 md:text-base"
                    >
                      <span className="mr-2 inline-block min-w-8 font-black text-[color:var(--brand-blue)]">
                        {supporter.display_order}.
                      </span>
                      <span>{supporter.name}</span>
                    </p>
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/80 px-5 py-10 text-center text-sm text-slate-500">
                  등록된 후원회 명단이 아직 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
