import Link from "next/link";

import { PageIntro } from "@/components/ui/page-intro";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getUserFromSession } from "@/lib/auth/user";
import {
  getMyPlayerRatingHistory,
  getMyPlayerRatingHistoryDetail,
} from "@/lib/data/my-player-ratings";
import { parseKstDate } from "@/lib/utils";

function formatMatchDate(value: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(parseKstDate(value));
}

function buildHref(params: {
  season: string;
  page?: number;
  entry?: string | null;
}) {
  const search = new URLSearchParams();
  if (params.season) search.set("season", params.season);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.entry) search.set("entry", params.entry);

  const query = search.toString();
  return query ? `/mypage/ratings?${query}` : "/mypage/ratings";
}

export const metadata = {
  title: "평점 입력 기록",
  description: "시즌별로 내가 남긴 선수 평점, MOM 선택, 한줄평과 좋아요 수를 확인합니다.",
};

export default async function MyPlayerRatingsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    season?: string;
    page?: string;
    entry?: string;
  }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = (await getUserFromSession()) as { id: string } | null;

  if (!user || Array.isArray(user)) {
    return (
      <div className="page-grid">
        <PageIntro
          eyebrow="My Page"
          title="평점 입력 기록"
          description="로그인 후 시즌별 선수 평점과 MOM 입력 기록을 확인할 수 있습니다."
        />
        <SurfaceCard className="p-6 text-sm text-slate-600">
          로그인이 필요합니다.
        </SurfaceCard>
      </div>
    );
  }

  const currentPage = Math.max(1, Number(resolvedSearchParams?.page ?? "1") || 1);
  const history = await getMyPlayerRatingHistory(user.id, resolvedSearchParams?.season, currentPage);
  const selectedEntryId = resolvedSearchParams?.entry ?? history.selectedEntryId;
  const selectedEntry =
    selectedEntryId && selectedEntryId !== history.selectedEntryId
      ? await getMyPlayerRatingHistoryDetail(user.id, selectedEntryId, history.selectedSeason)
      : history.selectedEntry;

  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="My Page"
        title="평점 입력 기록"
        description="시즌별, 경기별로 내가 남긴 선수 평점과 MOM, 한줄평과 좋아요 수를 확인할 수 있습니다."
      />

      <SurfaceCard className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {history.seasons.map((season) => (
              <Link
                key={season}
                href={buildHref({ season })}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  history.selectedSeason === season
                    ? "bg-slate-950 !text-white"
                    : "bg-white text-slate-700"
                }`}
              >
                {season} 시즌
              </Link>
            ))}
          </div>

          <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700">
            총 {history.totalItems}경기
          </div>
        </div>

        {history.items.length ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
            <div className="space-y-3">
              {history.items.map((item) => {
                const isActive = selectedEntryId === item.matchId;

                return (
                  <Link
                    key={item.matchId}
                    href={buildHref({
                      season: history.selectedSeason,
                      page: history.page,
                      entry: item.matchId,
                    })}
                    className={`block rounded-2xl border px-4 py-3 transition ${
                      isActive
                        ? "border-[color:var(--brand-blue)] bg-[rgba(21,93,252,0.06)]"
                        : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-blue)]">
                          {item.competition} · {item.roundLabel}
                        </p>
                        <p className="text-sm font-black text-slate-950">
                          {item.homeTeamName} vs {item.awayTeamName}
                        </p>
                        <p className="text-xs text-slate-500">{formatMatchDate(item.matchDate)}</p>
                      </div>

                      <div className="text-right text-xs text-slate-500">
                        <p>{item.ratedPlayerCount}명 평점</p>
                        <p>{item.myMomPlayerName ? `MOM ${item.myMomPlayerName}` : "MOM 미선택"}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                        제출 {formatMatchDate(item.submittedAt)}
                      </span>
                      {item.isUpdated ? (
                        <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                          수정됨
                        </span>
                      ) : null}
                    </div>
                  </Link>
                );
              })}

              {history.totalPages > 1 ? (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <Link
                    href={buildHref({
                      season: history.selectedSeason,
                      page: Math.max(1, history.page - 1),
                      entry: selectedEntryId,
                    })}
                    className={`rounded-full px-4 py-2 text-xs font-semibold ${
                      history.page <= 1
                        ? "pointer-events-none bg-slate-100 text-slate-400"
                        : "bg-white text-slate-700"
                    }`}
                  >
                    이전
                  </Link>

                  <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700">
                    {history.page} / {history.totalPages}
                  </span>

                  <Link
                    href={buildHref({
                      season: history.selectedSeason,
                      page: Math.min(history.totalPages, history.page + 1),
                      entry: selectedEntryId,
                    })}
                    className={`rounded-full px-4 py-2 text-xs font-semibold ${
                      history.page >= history.totalPages
                        ? "pointer-events-none bg-slate-100 text-slate-400"
                        : "bg-white text-slate-700"
                    }`}
                  >
                    다음
                  </Link>
                </div>
              ) : null}
            </div>

            <SurfaceCard className="space-y-4 border-slate-100 bg-slate-50 p-4 shadow-none">
              {selectedEntry ? (
                <>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-blue)]">
                      {selectedEntry.entry.competition} · {selectedEntry.entry.roundLabel}
                    </p>
                    <h2 className="text-xl font-black text-slate-950">
                      {selectedEntry.entry.homeTeamName} vs {selectedEntry.entry.awayTeamName}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {formatMatchDate(selectedEntry.entry.matchDate)}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        내가 선택한 MOM
                      </p>
                      <p className="mt-2 text-base font-black text-slate-950">
                        {selectedEntry.myMomPlayerName ?? "선택 없음"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        최종 MOM
                      </p>
                      <p className="mt-2 text-base font-black text-slate-950">
                        {selectedEntry.momWinnerPlayerName ?? "집계 전"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedEntry.players.map((player) => (
                      <div
                        key={player.playerId}
                        className="rounded-2xl border border-slate-100 bg-white px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-black text-slate-950">
                              {player.squadNumber ? `${player.squadNumber}. ` : ""}
                              {player.name}
                            </p>
                            <p className="text-xs font-semibold text-slate-400">{player.position}</p>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-black text-slate-950">{player.rating}점</p>
                            <p className="text-xs text-slate-500">
                              평균 {player.finalAverage?.toFixed(2) ?? "-"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                          {player.comment || "남긴 한줄평이 없습니다."}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                            좋아요 {player.commentLikeCount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  선택한 평점 기록이 없습니다.
                </div>
              )}
            </SurfaceCard>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            아직 평점 입력 기록이 없습니다.
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
