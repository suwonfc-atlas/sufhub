import Link from "next/link";

import { PageIntro } from "@/components/ui/page-intro";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getFanAwardsPageData } from "@/lib/data/fan-awards";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "팬 어워즈",
  description: "월간 수상자와 시즌 MVP 스냅샷을 시즌별로 확인합니다.",
};

export default async function HistoryFanAwardsPage({
  searchParams,
}: {
  searchParams?: Promise<{ season?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const data = await getFanAwardsPageData(params.season);

  return (
    <div className="page-grid max-w-full gap-4 overflow-x-hidden">
      <PageIntro
        eyebrow="Fan Awards"
        title="팬 어워즈"
        description="팬 평점 확정 데이터를 기준으로 월간 수상자와 시즌 MVP를 시즌별로 확인할 수 있습니다."
      />

      {data.seasons.length ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {data.seasons.map((season) => (
            <Link
              key={season.id}
              href={`/history/fan-awards?season=${season.code}`}
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

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-blue)]">
              Season MVP
            </p>
            <h2 className="text-xl font-black text-slate-950">
              {data.selectedSeason?.code ?? "-"} 시즌 어워드
            </h2>
          </div>

          {data.seasonEntries.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-950 text-sm text-white">
                  <tr>
                    {["순위", "선수", "평균 평점", "MOM", "월간 수상", "경기 수"].map(
                      (header) => (
                        <th key={header} className="px-3 py-3 font-semibold">
                          {header}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.seasonEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className={cn(
                        "border-t border-slate-100 text-sm text-slate-700",
                        entry.isMvp && "bg-sky-50/80 text-slate-950",
                      )}
                    >
                      <td className="px-3 py-3 font-black">{entry.rank}</td>
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
                      <td className="px-3 py-3">{entry.monthlyAwardCount}</td>
                      <td className="px-3 py-3">{entry.matchCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              아직 확정된 시즌 어워드 스냅샷이 없습니다.
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-blue)]">
              Monthly Winners
            </p>
            <h2 className="text-xl font-black text-slate-950">월간 수상자</h2>
          </div>

          {data.monthlyGroups.length ? (
            <div className="grid gap-3">
              {data.monthlyGroups.map((group) => (
                <div
                  key={group.month}
                  className="rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">{group.monthLabel}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {group.entries.length}명 스냅샷 저장
                      </p>
                    </div>
                    {group.winner ? (
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                        MVP {group.winner.playerName}
                      </span>
                    ) : null}
                  </div>

                  {group.winner ? (
                    <div className="mt-3 rounded-2xl bg-white px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{group.winner.playerName}</p>
                          <p className="text-xs text-slate-500">{group.winner.playerPosition}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-slate-950">
                            {group.winner.averageRating?.toFixed(2) ?? "-"}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            MOM {group.winner.momCount}회
                          </p>
                        </div>
                      </div>
                      {group.winner.topComment ? (
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {group.winner.topComment}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              아직 확정된 월간 어워드 스냅샷이 없습니다.
            </div>
          )}
        </SurfaceCard>
      </div>
    </div>
  );
}
