"use client";

import { useState, useTransition } from "react";

import { deleteExperienceRule, saveExperienceRule } from "@/app/admin/experience/actions";
import { AdminCheckboxField, AdminFormMessage, AdminInputField } from "@/components/admin/admin-field-controls";
import type { ExperienceRule } from "@/types";

const RULE_LABELS: Record<string, string> = {
  prediction_vote: "예측 투표 보상",
  prediction_hit: "예측 적중 보상",
  rating_vote: "평점 입력 보상",
  mom_vote: "MOM 투표 보상",
};

interface RuleForm {
  action: string;
  points: string;
  is_active: boolean;
}

export function ExperienceRulesAdminBoard({ rules }: { rules: ExperienceRule[] }) {
  const [result, setResult] = useState<{ status: "success" | "error"; message: string } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [forms, setForms] = useState<RuleForm[]>(
    rules.map((rule) => ({
      action: rule.action,
      points: String(rule.points ?? 0),
      is_active: rule.is_active,
    })),
  );

  if (!forms.length) {
    return (
      <div className="rounded-[24px] border border-white/70 bg-white/90 px-5 py-5 text-sm text-slate-600 shadow-[0_18px_48px_rgba(22,56,112,0.1)]">
        경험치 규칙이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-white/70 bg-white/90 px-5 py-5 shadow-[0_18px_48px_rgba(22,56,112,0.1)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-blue)]">
              Experience Rules
            </p>
            <h2 className="text-lg font-black text-slate-950">경험치 보상 목록</h2>
          </div>
        </div>

        <div className="space-y-3">
          {forms.map((form, index) => (
            <div
              key={form.action}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div className="min-w-[180px] flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {RULE_LABELS[form.action] ?? form.action}
                </p>
                <p className="text-xs text-slate-500">{form.action}</p>
              </div>

              <div className="w-28">
                <AdminInputField
                  label="경험치"
                  type="number"
                  value={form.points}
                  onChange={(event) =>
                    setForms((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, points: event.target.value } : row,
                      ),
                    )
                  }
                />
              </div>

              <div className="flex items-end">
                <AdminCheckboxField
                  label="활성"
                  checked={form.is_active}
                  onChange={(checked) =>
                    setForms((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, is_active: checked } : row,
                      ),
                    )
                  }
                />
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      const response = await saveExperienceRule(form);
                      setResult(response);
                    });
                  }}
                  className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
                >
                  저장
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    if (!window.confirm("이 경험치 규칙을 삭제할까요?")) return;
                    startTransition(async () => {
                      const response = await deleteExperienceRule(form.action);
                      setResult(response);
                    });
                  }}
                  className="rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold text-rose-700"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AdminFormMessage message={result?.message ?? null} status={result?.status} />
    </div>
  );
}
