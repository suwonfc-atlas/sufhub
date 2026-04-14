import Link from "next/link";

import { PageIntro } from "@/components/ui/page-intro";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getUserFromSession } from "@/lib/auth/user";
import { getPredictionHistoryData } from "@/lib/data/predictions";
import { parseKstDate } from "@/lib/utils";

import type { PredictionChoice } from "@/types";

const CHOICE_LABELS: Record<PredictionChoice, string> = {
  win: "승",
  draw: "무",
  lose: "패",
};

function formatMatchDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Seoul",
  }).format(parseKstDate(value));
}

export const metadata = {
  title: "예측 기록",
  description: "시즌별 경기 예측 기록을 확인합니다.",
};

export default async function MyPredictionPage({
  searchParams,
}: {
  searchParams?: { season?: string };
}) {
  const user = await getUserFromSession();

  if (!user) {
    return (
      <div className="page-grid">
        <PageIntro
          eyebrow="My Page"
          title="예측 기록"
          description="로그인 후 예측 기록을 확인할 수 있습니다."
        />
        <SurfaceCard className="p-6 text-sm text-slate-600">로그인이 필요합니다.</SurfaceCard>
      </div>
    );
  }

  const data = await getPredictionHistoryData(user.id, searchParams?.season);

  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="My Page"
        title="예측 기록"
        description="시즌별 예측 결과와 적중률을 확인하세요."
      />

      <SurfaceCard className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {data.seasons.map((season) => (
              <Link
                key={season}
                href={`/mypage/predictions?season=${season}`}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  data.selectedSeason === season
                    ? "bg-slate-950 !text-white"
                    : "bg-white text-slate-700"
                }`}
              >
                {season} 시즌
              </Link>
            ))}
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700">
            적중률 {data.accuracy}% ({data.hits}/{data.total})
          </div>
        </div>

        <div className="space-y-3">
          {data.items.length ? (
            data.items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 bg-white px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.homeTeamName} vs {item.awayTeamName}
                    </p>
                    <p className="text-xs text-slate-500">{formatMatchDate(item.matchDate)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      예측 {CHOICE_LABELS[item.choice]}
                    </span>
                    {item.result ? (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.choice === item.result
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        결과 {CHOICE_LABELS[item.result]}
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                        경기 전
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
              예측 기록이 없습니다.
            </div>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}
