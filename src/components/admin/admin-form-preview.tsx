import type { ReactNode } from "react";

import { SurfaceCard } from "@/components/ui/surface-card";

export function AdminFormPreview({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <SurfaceCard>
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-5 grid gap-4">{children}</div>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        >
          저장 액션 연결 예정
        </button>
        <button
          type="button"
          className="rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700"
        >
          폼 초기화
        </button>
      </div>
    </SurfaceCard>
  );
}
