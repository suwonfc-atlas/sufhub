import Link from "next/link";

import { PageIntro } from "@/components/ui/page-intro";
import { SurfaceCard } from "@/components/ui/surface-card";
import { guidePreviewSections } from "@/lib/constants/site";

export const metadata = {
  title: "직관 가이드",
  description: "처음 경기장에 가는 팬을 위한 수원FC 직관 가이드 페이지입니다.",
};

export default function GuidePage() {
  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="Starter Guide"
        title="직관 전에 필요한 정보만 빠르게 모아뒀습니다"
        description="좌석, 원정버스, 굿즈, 소모임, 커뮤니티까지 가이드 하위 페이지로 바로 들어갈 수 있습니다."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {guidePreviewSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            target={section.external ? "_blank" : undefined}
            rel={section.external ? "noreferrer" : undefined}
          >
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
