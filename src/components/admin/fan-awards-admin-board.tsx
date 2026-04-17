"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  createMonthlyFanAwardSnapshot,
  createSeasonFanAwardSnapshot,
  setFeaturedFanRatingComment,
  toggleFanRatingCommentVisibility,
  type AdminMutationResult,
} from "@/app/admin/actions";
import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import { AdminFormMessage } from "@/components/admin/admin-field-controls";
import { SurfaceCard } from "@/components/ui/surface-card";
import type {
  AdminFanAwardCommentItem,
  AdminFanAwardsPageData,
} from "@/lib/data/fan-awards";
import { parseKstDate } from "@/lib/utils";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(parseKstDate(value));
}

function formatMonthLabel(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    timeZone: "Asia/Seoul",
  }).format(parseKstDate(`${value}-01T00:00:00`));
}

export function FanAwardsAdminBoard({ data }: { data: AdminFanAwardsPageData }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<AdminMutationResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(data.commentsPage.items[0]?.id ?? null);

  useEffect(() => {
    setActiveId(data.commentsPage.items[0]?.id ?? null);
  }, [data.commentsPage.items]);

  const activeComment = useMemo(
    () => data.commentsPage.items.find((item) => item.id === activeId) ?? null,
    [activeId, data.commentsPage.items],
  );

  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const movePage = (page: number) => {
    updateQuery({ page: String(page) });
  };

  const runAction = (action: () => Promise<AdminMutationResult>) => {
    startTransition(async () => {
      const next = await action();
      setResult(next);
      if (next.status === "success") {
        router.refresh();
      }
    });
  };

  return (
    <div className="grid auto-rows-min gap-3">
      <AdminSectionTabs
        tabs={data.seasons.map((season) => ({
          key: season.code,
          label: `${season.code} 시즌`,
        }))}
        activeKey={data.selectedSeason?.code ?? ""}
        onChange={(key) =>
          updateQuery({
            season: key,
            month: null,
            page: null,
          })
        }
      />

      {data.monthOptions.length ? (
        <AdminSectionTabs
          tabs={data.monthOptions.map((month) => ({
            key: month,
            label: formatMonthLabel(month),
          }))}
          activeKey={data.selectedMonth ?? ""}
          onChange={(key) =>
            updateQuery({
              season: data.selectedSeason?.code ?? null,
              month: key,
              page: null,
            })
          }
        />
      ) : null}

      <div className="grid gap-3 xl:grid-cols-2">
        <SurfaceCard className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-blue)]">
                Snapshot
              </p>
              <h2 className="text-xl font-black text-slate-950">월간 팬 어워즈</h2>
              <p className="text-sm text-slate-500">
                선택한 월의 팬 평점 결과를 확정 스냅샷으로 저장합니다.
              </p>
            </div>
            <button
              type="button"
              disabled={isPending || !data.selectedSeason || !data.selectedMonth}
              onClick={() =>
                runAction(() =>
                  createMonthlyFanAwardSnapshot({
                    season_id: data.selectedSeason?.id ?? "",
                    award_month: data.selectedMonth ?? "",
                  }),
                )
              }
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              월간 스냅샷 생성
            </button>
          </div>

          {data.monthlyGroups.length ? (
            <div className="grid gap-2">
              {data.monthlyGroups.map((group) => (
                <div
                  key={group.month}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{group.monthLabel}</p>
                      <p className="text-xs text-slate-500">{group.entries.length}명 저장됨</p>
                    </div>
                    {group.winner ? (
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                        우승 {group.winner.playerName}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              아직 저장된 월간 스냅샷이 없습니다.
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-blue)]">
                Snapshot
              </p>
              <h2 className="text-xl font-black text-slate-950">시즌 팬 어워즈</h2>
              <p className="text-sm text-slate-500">
                월간 수상 누적과 시즌 팬 평점 결과를 기준으로 시즌 MVP를 확정합니다.
              </p>
            </div>
            <button
              type="button"
              disabled={isPending || !data.selectedSeason}
              onClick={() =>
                runAction(() =>
                  createSeasonFanAwardSnapshot({
                    season_id: data.selectedSeason?.id ?? "",
                  }),
                )
              }
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              시즌 스냅샷 생성
            </button>
          </div>

          {data.seasonEntries.length ? (
            <div className="grid gap-2">
              {data.seasonEntries.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-950">
                      {entry.rank}. {entry.playerName}
                    </p>
                    <p className="text-xs text-slate-500">
                      평균 {entry.averageRating?.toFixed(2) ?? "-"} · MOM {entry.momCount}회
                    </p>
                  </div>
                  {entry.isMvp ? (
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                      시즌 MVP
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500">
                      월간 수상 {entry.monthlyAwardCount}회
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              아직 저장된 시즌 스냅샷이 없습니다.
            </div>
          )}
        </SurfaceCard>
      </div>

      <AdminFormMessage message={result?.message ?? null} status={result?.status} />

      <SurfaceCard className="overflow-hidden p-0">
        <div className="border-b border-slate-100 px-4 py-3.5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-blue)]">
            Comment Moderation
          </p>
          <h2 className="mt-1 text-lg font-black text-slate-950">한줄평 운영</h2>
          <p className="mt-1 text-sm text-slate-500">
            최신순으로 한줄평을 확인하고 비노출 처리 또는 대표 문구 지정을 할 수 있습니다.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-950 text-sm text-white">
              <tr>
                {["시즌", "경기", "선수", "작성자", "좋아요", "상태"].map((header) => (
                  <th key={header} className="px-3 py-3 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.commentsPage.items.length ? (
                data.commentsPage.items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-t border-slate-100 text-sm ${
                      activeComment?.id === item.id ? "bg-sky-50/70" : "bg-white"
                    }`}
                  >
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => setActiveId(item.id)}
                        className="text-left font-semibold text-slate-700"
                      >
                        {item.seasonCode}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => setActiveId(item.id)}
                        className="max-w-[18rem] truncate text-left text-slate-700"
                      >
                        {item.matchTitle}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => setActiveId(item.id)}
                        className="text-left"
                      >
                        <span className="font-semibold text-slate-950">{item.playerName}</span>
                        <span className="ml-2 text-xs text-slate-500">{item.playerPosition}</span>
                      </button>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{item.userNickname}</td>
                    <td className="px-3 py-3 text-slate-700">{item.likeCount}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {item.isHidden ? (
                          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                            비노출
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            노출
                          </span>
                        )}
                        {item.isFeatured ? (
                          <span className="rounded-full bg-[rgba(21,93,252,0.12)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--brand-blue)]">
                            대표 문구
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    운영할 한줄평이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data.commentsPage.totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
            <p className="text-sm text-slate-500">
              {data.commentsPage.page} / {data.commentsPage.totalPages} 페이지
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => movePage(Math.max(1, data.commentsPage.page - 1))}
                disabled={data.commentsPage.page === 1}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                이전
              </button>
              <button
                type="button"
                onClick={() =>
                  movePage(
                    Math.min(data.commentsPage.totalPages, data.commentsPage.page + 1),
                  )
                }
                disabled={data.commentsPage.page === data.commentsPage.totalPages}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                다음
              </button>
            </div>
          </div>
        ) : null}
      </SurfaceCard>

      {activeComment ? (
        <SurfaceCard className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-blue)]">
                Comment Detail
              </p>
              <h2 className="text-xl font-black text-slate-950">한줄평 상세</h2>
              <p className="text-sm text-slate-500">
                {activeComment.matchTitle} · {activeComment.competition} · {activeComment.roundLabel}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  runAction(() => toggleFanRatingCommentVisibility(activeComment.id))
                }
                className="rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-60"
              >
                {activeComment.isHidden ? "다시 노출" : "비노출"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => runAction(() => setFeaturedFanRatingComment(activeComment.id))}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                대표 문구 지정
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                선수
              </p>
              <p className="mt-2 font-semibold text-slate-950">{activeComment.playerName}</p>
              <p className="text-xs text-slate-500">{activeComment.playerPosition}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                작성자
              </p>
              <p className="mt-2 font-semibold text-slate-950">{activeComment.userNickname}</p>
              <p className="text-xs text-slate-500">{formatDateTime(activeComment.createdAt)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                평점
              </p>
              <p className="mt-2 text-xl font-black text-slate-950">{activeComment.rating}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                좋아요
              </p>
              <p className="mt-2 text-xl font-black text-slate-950">{activeComment.likeCount}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Comment
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-800">
              {activeComment.comment}
            </p>
          </div>
        </SurfaceCard>
      ) : null}
    </div>
  );
}
