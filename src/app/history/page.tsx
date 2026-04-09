import Link from "next/link";

import { PageIntro } from "@/components/ui/page-intro";
import { SurfaceCard } from "@/components/ui/surface-card";
import { historyPreviewSections } from "@/lib/constants/site";

export const metadata = {
  title: "히스토리",
  description: "구단 연표와 시즌, 선수, 유니폼 아카이브를 위한 랜딩 페이지입니다.",
};

export default function HistoryPage() {
  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="Club Archive"
        title="시간을 따라 보는 수원FC 아카이브"
        description="역대 시즌과 구단 연표, 선수단, 경기장, 유니폼 기록을 한곳에서 탐색할 수 있습니다."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {historyPreviewSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <SurfaceCard className="h-full transition hover:-translate-y-1 hover:border-sky-200">
              <h2 className="text-xl font-bold text-slate-950">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{section.description}</p>
            </SurfaceCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
