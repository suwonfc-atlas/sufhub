import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { News } from "@/types";
import { formatPublishedAt } from "@/lib/utils";

interface NewsCardListProps {
  news: News[];
  title?: string;
  description?: string;
}

export function NewsCardList({
  news,
  title = "최신 뉴스",
  description = "수원FC 관련 기사만 빠르게 이어서 확인할 수 있게 정리했습니다.",
}: NewsCardListProps) {
  if (!news.length) {
    return (
      <EmptyState
        title="등록된 뉴스가 없습니다"
        description="Supabase `news` 테이블에 링크를 등록하면 이 영역에 자동으로 표시됩니다."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="grid gap-3">
        {news.map((item) => (
          <Link
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            <SurfaceCard className="flex items-start justify-between gap-4 p-4 transition duration-200 hover:border-[rgba(21,93,252,0.18)]">
              <div className="min-w-0 space-y-2">
                <span className="inline-flex rounded-full bg-[rgba(13,27,112,0.08)] px-3 py-1 text-[11px] font-semibold text-[color:var(--brand-navy)]">
                  {item.source ?? "뉴스"}
                </span>
                <h3 className="text-base font-bold leading-6 text-slate-950">{item.title}</h3>
                <p className="text-xs font-medium text-slate-500">
                  {formatPublishedAt(item.published_at)}
                </p>
              </div>
              <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-[color:var(--brand-blue)]" />
            </SurfaceCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
