import Image from "next/image";

import { SurfaceCard } from "@/components/ui/surface-card";
import { getHistoryTimeline } from "@/lib/data/public";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "구단 연표",
  description: "수원FC의 주요 장면을 세로 타임라인으로 정리했습니다.",
};

export default async function HistoryTimelinePage() {
  const timeline = await getHistoryTimeline();

  return (
    <div className="page-grid gap-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-blue)]">
          Timeline
        </p>
        <h1 className="text-[1.55rem] font-black leading-tight text-slate-950">
          수원FC 연표
        </h1>
      </div>

      <div className="relative pl-2">
        <div className="absolute bottom-2 left-[5.15rem] top-2 w-px bg-[rgba(13,27,112,0.12)]" />
        <div className="grid gap-3">
          {timeline.map((item, index) => (
            <div key={item.id} className="grid grid-cols-[4.5rem_1fr] gap-4">
              <div
                className={cn(
                  "pt-1 text-right text-[1.85rem] font-black leading-none",
                  index % 2 === 0
                    ? "text-[color:var(--brand-navy)]"
                    : "text-[color:var(--brand-blue)]",
                )}
              >
                {item.year}
              </div>

              <div className="relative pb-3">
                <div
                  className={cn(
                    "absolute -left-[0.67rem] top-3 h-3.5 w-3.5 rounded-full border-4 border-[color:var(--surface)]",
                    index % 2 === 0
                      ? "bg-[color:var(--brand-navy)]"
                      : "bg-[color:var(--brand-red)]",
                  )}
                />

                <SurfaceCard className="px-4 py-4">
                  <h2 className="text-base font-black text-slate-950">{item.title}</h2>

                  {item.image_url ? (
                    <div className="relative mt-3 overflow-hidden rounded-[18px] border border-[color:var(--line)] bg-slate-50">
                      <Image
                        src={item.image_url}
                        alt={`${item.title} 이미지`}
                        width={1200}
                        height={675}
                        className="h-auto w-full object-cover"
                      />
                    </div>
                  ) : null}

                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {item.description ?? "연표 설명이 아직 등록되지 않았습니다."}
                  </p>
                </SurfaceCard>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
