import Link from "next/link";

import { PageIntro } from "@/components/ui/page-intro";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getFanRatingsArchivePageData } from "@/lib/data/fan-awards";
import { cn, formatDateLabel, parseKstDate } from "@/lib/utils";

export const metadata = {
  title: "팬 평점 아카이브",
  description: "시즌별 팬 평점과 경기별 대표 기록을 확인합니다.",
};

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

export default async function HistoryFanRatingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ season?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const data = await getFanRatingsArchivePageData(params.season);

  return (
    <div className="page-grid max-w-full gap-4 overflow-x-hidden">
      <PageIntro
        eyebrow="Fan Ratings"
        title="팬 평점 아카이브"
        description="시즌별 팬 평균 평점과 경기별 MOM, 대표 한줄평을 모아볼 수 있습니다."
      />

      {data.seasons.length ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {data.seasons.map((season) => (
            <Link
              key={season.id}
              href={`/history/fan-ratings?season=${season.code}`}
              scroll={false}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                data.selectedSeason?.code === season.code
                  ? "bg-slate-950 !text-white"
                  : "bg-white text-slate-600",
              )}
            >
              {season.code} 시즌
            </Link>
          ))}
        </div>
      ) : null}

      <SurfaceCard className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-blue)]">
            Leaderboard
          </p>
          <h2 className="text-xl font-black text-slate-950">
            {data.selectedSeason?.code ?? "-"} 시즌 팬 평점 순위
          </h2>
        </div>

        {data.leaderboard.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-950 text-sm text-white">
                <tr>
                  {["순위", "선수", "평균 평점", "MOM", "경기 수", "투표 수"].map(
                    (header) => (
                      <th key={header} className="px-3 py-3 font-semibold">
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data.leaderboard.map((entry, index) => (
                  <tr key={entry.playerId} className="border-t border-slate-100 text-sm text-slate-700">
                    <td className="px-3 py-3 font-black">{index + 1}</td>
                    <td className="px-3 py-3">
                      <div>
                        <p className="font-semibold text-slate-950">{entry.playerName}</p>
                        <p className="text-xs text-slate-500">{entry.playerPosition}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-semibold">
                      {entry.averageRating?.toFixed(2) ?? "-"}
                    </td>
                    <td className="px-3 py-3">{entry.momCount}</td>
                    <td className="px-3 py-3">{entry.matchCount}</td>
                    <td className="px-3 py-3">{entry.voteCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            아직 확정된 팬 평점 기록이 없습니다.
          </div>
        )}
      </SurfaceCard>

      <div className="grid gap-3">
        {data.matches.length ? (
          data.matches.map((match) => (
            <SurfaceCard key={match.matchId} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">{match.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {match.competition} · {match.roundLabel} · {formatMatchDate(match.matchDate)}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {formatDateLabel(match.matchDate, false)}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Top Rating
                  </p>
                  <p className="mt-2 text-base font-black text-slate-950">
                    {match.topRatedPlayer?.name ?? "-"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {match.topRatedPlayer?.averageRating?.toFixed(2) ?? "-"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    MOM
                  </p>
                  <p className="mt-2 text-base font-black text-slate-950">
                    {match.momPlayer?.name ?? "-"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {match.momPlayer ? `${match.momPlayer.momVoteCount}표` : "-"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    대표 한줄평
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">
                    {match.topComment?.comment ?? "아직 대표 한줄평이 없습니다."}
                  </p>
                  {match.topComment ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {match.topComment.playerName} · 좋아요 {match.topComment.likes}
                    </p>
                  ) : null}
                </div>
              </div>
            </SurfaceCard>
          ))
        ) : (
          <SurfaceCard className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            아직 확정된 팬 평점 경기 기록이 없습니다.
          </SurfaceCard>
        )}
      </div>
    </div>
  );
}
