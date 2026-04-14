import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

import { GuideImageModalCard } from "@/components/guide/guide-image-modal-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageIntro } from "@/components/ui/page-intro";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  staticAwayBusGuide,
  staticMerchGuide,
  staticSeatGuide,
} from "@/lib/constants/guide-static";
import { getGuideContents } from "@/lib/data/public";
import type { GuideCategory } from "@/types";

const guidePageMap = {
  seats: {
    title: "좌석 가이드",
    description: "직관 전에 미리 참고하면 좋은 좌석 정보를 안내합니다.",
  },
  "away-bus": {
    title: "원정버스",
    description: "원정 버스 신청 링크와 기본 확인 사항을 안내합니다.",
  },
  merch: {
    title: "굿즈",
    description: "굿즈 구매 링크와 경기장 MD 안내를 함께 정리했습니다.",
  },
  groups: {
    title: "소모임",
    description: "응원을 함께하는 소모임과 참여 링크를 확인합니다.",
  },
  community: {
    title: "채널",
    description: "공식 채널과 커뮤니티 링크를 안내합니다.",
  },
} as const satisfies Record<string, { title: string; description: string }>;

type GuideSlug = keyof typeof guidePageMap;

function isGuideSlug(value: string): value is GuideSlug {
  return value in guidePageMap;
}

export function generateStaticParams() {
  return Object.keys(guidePageMap).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  if (!isGuideSlug(slug)) {
    return {};
  }

  return guidePageMap[slug];
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isGuideSlug(slug)) {
    notFound();
  }

  const page = guidePageMap[slug];

  if (slug === "seats") {
    return (
      <div className="page-grid gap-4">
        <PageIntro eyebrow="Guide Detail" title={page.title} description={page.description} />
        <SurfaceCard className="overflow-hidden bg-[linear-gradient(135deg,rgba(10,79,204,0.92),rgba(15,23,42,0.94))] text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-100">
            Stadium Guide
          </p>
          <h2 className="mt-2 text-2xl font-black">수원종합운동장 좌석 안내</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-sky-50/88">
            좌석 가이드는 고정 정보로 제공됩니다. 가격과 상세 정보는 해당 경기장 공식 공지를
            확인해 주세요.
          </p>
        </SurfaceCard>
        <div className="grid gap-4 lg:grid-cols-3">
          {staticSeatGuide.map((zone) => (
            <SurfaceCard key={zone.title} className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
                  {zone.atmosphere}
                </p>
                <h2 className="text-2xl font-black text-slate-950">{zone.title}</h2>
              </div>
              <p className="text-sm leading-6 text-slate-600">{zone.description}</p>
              <dl className="space-y-3 text-sm text-slate-600">
                <div>
                  <dt className="font-semibold text-slate-950">가격</dt>
                  <dd>{zone.price}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-950">팁</dt>
                  <dd>{zone.tips}</dd>
                </div>
              </dl>
            </SurfaceCard>
          ))}
        </div>
      </div>
    );
  }

  if (slug === "away-bus") {
    return (
      <div className="page-grid gap-4">
        <PageIntro eyebrow="Guide Detail" title={page.title} description={page.description} />
        <SurfaceCard className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-950">{staticAwayBusGuide.title}</h2>
            <p className="text-sm leading-6 text-slate-600">{staticAwayBusGuide.description}</p>
          </div>
          <div className="grid gap-2 rounded-[20px] bg-[rgba(13,27,112,0.04)] p-4 text-sm text-slate-700">
            {staticAwayBusGuide.body.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
          <Link
            href={staticAwayBusGuide.linkUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-sky-700"
          >
            {staticAwayBusGuide.linkLabel}
            <ExternalLink className="h-4 w-4" />
          </Link>
        </SurfaceCard>
      </div>
    );
  }

  if (slug === "merch") {
    return (
      <div className="page-grid gap-4">
        <PageIntro eyebrow="Guide Detail" title={page.title} description={page.description} />
        <div className="grid gap-4 md:grid-cols-2">
          <SurfaceCard className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-950">
                {staticMerchGuide.store.title}
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                {staticMerchGuide.store.description}
              </p>
            </div>
            <Link
              href={staticMerchGuide.store.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700"
            >
              링크 열기
              <ExternalLink className="h-4 w-4" />
            </Link>
          </SurfaceCard>

          <GuideImageModalCard
            title={staticMerchGuide.matchdayMd.title}
            description={staticMerchGuide.matchdayMd.description}
            imageSrc={staticMerchGuide.matchdayMd.imageSrc}
            fallbackLabel={staticMerchGuide.matchdayMd.fallbackLabel}
          />
        </div>
      </div>
    );
  }

  const contents = await getGuideContents(
    slug as Extract<GuideCategory, "groups" | "community">,
  );

  if (!contents.length) {
    return (
      <div className="page-grid gap-4">
        <PageIntro eyebrow="Guide Detail" title={page.title} description={page.description} />
        <EmptyState
          title="등록된 콘텐츠가 없습니다"
          description="현재 카테고리에 표시할 항목이 없습니다."
        />
      </div>
    );
  }

  return (
    <div className="page-grid gap-4">
      <PageIntro eyebrow="Guide Detail" title={page.title} description={page.description} />
      <div className="grid gap-4 md:grid-cols-2">
        {contents.map((content) => (
          <SurfaceCard key={content.id} className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-950">{content.title}</h2>
              <p className="text-sm leading-6 text-slate-600">{content.description}</p>
            </div>
            {content.content ? (
              <p className="text-sm leading-6 text-slate-700">{content.content}</p>
            ) : null}
            {content.external_url ? (
              <Link
                href={content.external_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700"
              >
                링크 열기
                <ExternalLink className="h-4 w-4" />
              </Link>
            ) : null}
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
