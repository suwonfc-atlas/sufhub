import Link from "next/link";

import { PageIntro } from "@/components/ui/page-intro";
import { SurfaceCard } from "@/components/ui/surface-card";
import { NEWS_EXTERNAL_URL } from "@/lib/constants/site";

export const metadata = {
  title: "수원FC 인포",
  description: "히스토리, 가이드, 뉴스 정보를 한 번에 확인하세요.",
};

const infoSections = [
  {
    title: "히스토리",
    description: "역대 시즌, 구단 연혁, 경기장과 유니폼 기록을 한 번에 확인합니다.",
    href: "/history",
    external: false,
  },
  {
    title: "가이드",
    description: "좌석, 원정버스, 굿즈, 멤버십 등 직관 준비 정보를 모았습니다.",
    href: "/guide",
    external: false,
  },
  {
    title: "뉴스",
    description: "수원FC 공식 카페의 최신 게시판으로 이동합니다.",
    href: NEWS_EXTERNAL_URL,
    external: true,
  },
];

export default function InfoPage() {
  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="Suwon FC Info"
        title="수원FC 인포"
        description="히스토리와 가이드, 뉴스 흐름을 하나로 묶어 확인할 수 있습니다."
      />

      <div className="grid gap-3 md:grid-cols-3">
        {infoSections.map((section) => {
          const content = (
            <SurfaceCard className="flex h-full flex-col gap-3 p-5">
              <div>
                <p className="text-lg font-semibold text-slate-950">{section.title}</p>
                <p className="mt-1 text-sm text-slate-600">{section.description}</p>
              </div>
              <span className="mt-auto text-sm font-semibold text-[color:var(--brand-blue)]">
                자세히 보기
              </span>
            </SurfaceCard>
          );

          if (section.external) {
            return (
              <a key={section.title} href={section.href} className="block">
                {content}
              </a>
            );
          }

          return (
            <Link key={section.title} href={section.href} className="block">
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
