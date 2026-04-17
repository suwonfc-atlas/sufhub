import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { PageIntro } from "@/components/ui/page-intro";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getPlayerArchiveDetail } from "@/lib/data/public";
import { parseKstDate } from "@/lib/utils";

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(parseKstDate(value));
}

function formatMatchDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(parseKstDate(value));
}

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
    description: `${player.name} 선수의 시즌별 이력과 팬 평점 기록을 확인할 수 있습니다.`,
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
    <div className="page-grid max-w-full overflow-x-hidden">
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
        <SurfaceCard className="min-w-0 space-y-4">
          <h2 className="text-2xl font-black text-slate-950">기본 정보</h2>
          <dl className="space-y-3 text-sm leading-6 text-slate-600">
            <div>
              <dt className="font-semibold text-slate-950">영문명</dt>
              <dd>{player.name_en || "-"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">생년월일</dt>
              <dd>{formatDate(player.birth_date)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">국적</dt>
              <dd>{player.nationality || "-"}</dd>
            </div>
          </dl>
        </SurfaceCard>

        <SurfaceCard className="min-w-0 space-y-4">
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
                  입단: {season.joined_from ?? "기존 선수"} / 이적: {season.left_to ?? "소속 중"}
                </p>
                {season.notes ? (
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {season.notes}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <SurfaceCard className="min-w-0 space-y-4">
          <h2 className="text-2xl font-black text-slate-950">팬 평점 요약</h2>

          {player.fanSummary ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    시즌
                  </p>
                  <p className="mt-2 text-base font-black text-slate-950">
                    {player.fanSummary.season}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    팬 평균 평점
                  </p>
                  <p className="mt-2 text-base font-black text-slate-950">
                    {player.fanSummary.fanRatingAverage?.toFixed(2) ?? "-"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    평점 경기 수
                  </p>
                  <p className="mt-2 text-base font-black text-slate-950">
                    {player.fanSummary.fanRatingMatches}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    팬 MOM
                  </p>
                  <p className="mt-2 text-base font-black text-slate-950">
                    {player.fanSummary.fanMomCount}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  대표 한줄평
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                  {player.fanSummary.fanTopComment || "아직 대표 한줄평이 없습니다."}
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  좋아요 {player.fanSummary.fanTopCommentLikes}
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              아직 확정된 팬 평점 기록이 없습니다.
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard className="min-w-0 space-y-4">
          <h2 className="text-2xl font-black text-slate-950">최근 팬 평점 경기</h2>

          {player.recentFanResults.length ? (
            <div className="space-y-3">
              {player.recentFanResults.map((result) => (
                <div
                  key={result.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-blue)]">
                        {result.competition} {result.roundLabel}
                      </p>
                      <p className="mt-1 text-base font-black text-slate-950">
                        vs {result.opponentName}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatMatchDate(result.matchDate)}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-lg font-black text-slate-950">
                        {result.fanRatingAverage?.toFixed(2) ?? "-"}
                      </p>
                      <p className="text-xs text-slate-500">MOM 투표 {result.momVoteCount}</p>
                    </div>
                  </div>

                  {result.topComment ? (
                    <div className="mt-3 rounded-xl bg-white px-3 py-2.5 text-sm text-slate-700">
                      {result.topComment}
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        좋아요 {result.topCommentLikeCount}
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              최근 팬 평점 결과가 없습니다.
            </div>
          )}
        </SurfaceCard>
      </div>

      <SurfaceCard className="min-w-0 space-y-4">
        <h2 className="text-2xl font-black text-slate-950">시즌별 스탯</h2>
        <div className="w-full max-w-full overflow-x-auto">
          <table className="min-w-[42rem] text-left sm:min-w-full">
            <thead className="bg-slate-950 text-sm text-white">
              <tr>
                {["시즌", "출전", "득점", "도움", "경고", "퇴장", "팬 평점", "팬 MOM"].map(
                  (header) => (
                    <th key={header} className="px-3 py-4 font-semibold sm:px-4">
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {player.stats.map((stat) => (
                <tr key={stat.id} className="border-t border-slate-100 text-sm text-slate-700">
                  <td className="px-3 py-4 font-semibold text-slate-950 sm:px-4">
                    {stat.season}
                  </td>
                  <td className="px-3 py-4 sm:px-4">{stat.appearances}</td>
                  <td className="px-3 py-4 sm:px-4">{stat.goals}</td>
                  <td className="px-3 py-4 sm:px-4">{stat.assists}</td>
                  <td className="px-3 py-4 sm:px-4">{stat.yellow_cards}</td>
                  <td className="px-3 py-4 sm:px-4">{stat.red_cards}</td>
                  <td className="px-3 py-4 sm:px-4">
                    {stat.fan_rating_average?.toFixed(2) ?? "-"}
                  </td>
                  <td className="px-3 py-4 sm:px-4">{stat.fan_mom_count ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
}
