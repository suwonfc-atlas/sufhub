import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { PageIntro } from "@/components/ui/page-intro";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getPlayerArchiveDetail } from "@/lib/data/public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const player = await getPlayerArchiveDetail(id);

  if (!player) {
    return {};
  }

  return {
    title: `${player.name} 선수`,
    description: `${player.name}의 시즌별 이력과 기록을 확인합니다.`,
  };
}

export default async function HistoryPlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await getPlayerArchiveDetail(id);

  if (!player) {
    notFound();
  }

  return (
    <div className="page-grid">
      <Link
        href="/history/players"
        className="hidden items-center gap-2 text-sm font-semibold text-sky-700 lg:inline-flex"
      >
        <ArrowLeft className="h-4 w-4" />
        선수단으로 돌아가기
      </Link>
      <PageIntro
        eyebrow={player.position}
        title={player.name}
        description={player.bio ?? `${player.name_en ?? player.name} 선수 아카이브`}
      />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SurfaceCard className="space-y-4">
          <h2 className="text-2xl font-black text-slate-950">기본 정보</h2>
          <dl className="space-y-3 text-sm leading-6 text-slate-600">
            <div>
              <dt className="font-semibold text-slate-950">영문명</dt>
              <dd>{player.name_en}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">생년월일</dt>
              <dd>{player.birth_date}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">국적</dt>
              <dd>{player.nationality}</dd>
            </div>
          </dl>
        </SurfaceCard>
        <SurfaceCard className="space-y-4">
          <h2 className="text-2xl font-black text-slate-950">시즌별 이력</h2>
          <div className="space-y-3">
            {player.player_seasons.map((season) => (
              <div key={season.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-lg font-black text-slate-950">{season.season}</p>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                    No. {season.squad_number ?? "-"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  합류: {season.joined_from ?? "기존 선수"} / 이탈: {season.left_to ?? "재적중"}
                </p>
                {season.notes ? (
                  <p className="mt-1 text-sm leading-6 text-slate-600">{season.notes}</p>
                ) : null}
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
      <SurfaceCard className="space-y-4">
        <h2 className="text-2xl font-black text-slate-950">시즌별 스탯</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-950 text-sm text-white">
              <tr>
                {["시즌", "출장", "골", "도움", "경고", "퇴장"].map((header) => (
                  <th key={header} className="px-4 py-4 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {player.stats.map((stat) => (
                <tr key={stat.id} className="border-t border-slate-100 text-slate-700">
                  <td className="px-4 py-4 font-semibold text-slate-950">{stat.season}</td>
                  <td className="px-4 py-4">{stat.appearances}</td>
                  <td className="px-4 py-4">{stat.goals}</td>
                  <td className="px-4 py-4">{stat.assists}</td>
                  <td className="px-4 py-4">{stat.yellow_cards}</td>
                  <td className="px-4 py-4">{stat.red_cards}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
}
