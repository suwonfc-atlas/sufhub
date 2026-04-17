"use client";

import { Crown, X } from "lucide-react";

import { SurfaceCard } from "@/components/ui/surface-card";
import { parseKstDate } from "@/lib/utils";

interface PlayerDetailModalPlayer {
  name: string;
  nameEn?: string | null;
  birthDate?: string | null;
  nationality?: string | null;
  bio?: string | null;
  position: string;
  squadNumber?: number | null;
  isCaptain?: boolean;
  appearances?: number;
  goals?: number;
  assists?: number;
  attackPoints?: number;
  ratingAverage?: number | null;
  minutesPlayed?: number;
  yellowCards?: number;
  redCards?: number;
  fanRatingAverage?: number | null;
  fanRatingMatches?: number;
  fanMomCount?: number;
  fanTopComment?: string | null;
  fanTopCommentLikes?: number;
}

interface PlayerDetailModalProps {
  open: boolean;
  onClose: () => void;
  player: PlayerDetailModalPlayer | null;
}

function formatBirthDate(value?: string | null) {
  if (!value) {
    return "정보 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(parseKstDate(value));
}

function formatStatNumber(value?: number | null, suffix = "") {
  if (value === null || value === undefined) {
    return "-";
  }

  if (suffix) {
    return `${value.toLocaleString("ko-KR")}${suffix}`;
  }

  return value.toLocaleString("ko-KR");
}

export function PlayerDetailModal({
  open,
  onClose,
  player,
}: PlayerDetailModalProps) {
  if (!open || !player) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(2,6,23,0.72)] px-4 py-4 md:py-6">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0"
        onClick={onClose}
      />

      <SurfaceCard className="relative z-10 flex max-h-[calc(100dvh-7rem)] w-full max-w-[32rem] flex-col overflow-hidden px-0 py-0 md:max-h-[calc(100dvh-4rem)]">
        <div className="flex items-start justify-between gap-4 border-b border-[color:var(--line)] px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-blue)]">
              Player Detail
            </p>
            <div className="mt-1 flex items-center gap-2">
              <h3 className="truncate text-xl font-black text-slate-950">{player.name}</h3>
              {player.isCaptain ? (
                <span className="rounded-full bg-amber-100 p-1 text-amber-700">
                  <Crown className="h-3.5 w-3.5" />
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {player.position}
              {player.squadNumber ? ` / No. ${player.squadNumber}` : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(13,27,112,0.06)] text-[color:var(--brand-navy)]"
            aria-label="모달 닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
              <div className="grid gap-3">
                <div className="rounded-[20px] bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    English Name
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {player.nameEn || "정보 없음"}
                  </p>
                </div>

                <div className="rounded-[20px] bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Birth Date
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatBirthDate(player.birthDate)}
                  </p>
                </div>

                <div className="rounded-[20px] bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Nationality
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {player.nationality || "정보 없음"}
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-[color:var(--line)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Stats
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <div className="rounded-[18px] bg-slate-50 px-3 py-3">
                    <p className="text-[11px] font-semibold text-slate-400">출전</p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {formatStatNumber(player.appearances)}
                    </p>
                  </div>
                  <div className="rounded-[18px] bg-slate-50 px-3 py-3">
                    <p className="text-[11px] font-semibold text-slate-400">득점</p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {formatStatNumber(player.goals)}
                    </p>
                  </div>
                  <div className="rounded-[18px] bg-slate-50 px-3 py-3">
                    <p className="text-[11px] font-semibold text-slate-400">도움</p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {formatStatNumber(player.assists)}
                    </p>
                  </div>
                  <div className="rounded-[18px] bg-slate-50 px-3 py-3">
                    <p className="text-[11px] font-semibold text-slate-400">공격포인트</p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {formatStatNumber(player.attackPoints)}
                    </p>
                  </div>
                  <div className="rounded-[18px] bg-slate-50 px-3 py-3">
                    <p className="text-[11px] font-semibold text-slate-400">평균 평점</p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {player.ratingAverage !== null && player.ratingAverage !== undefined
                        ? player.ratingAverage.toFixed(2)
                        : "-"}
                    </p>
                  </div>
                  <div className="rounded-[18px] bg-slate-50 px-3 py-3">
                    <p className="text-[11px] font-semibold text-slate-400">출전 시간</p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {formatStatNumber(player.minutesPlayed, "분")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[color:var(--line)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Fan Record
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div className="rounded-[18px] bg-slate-50 px-3 py-3">
                <p className="text-[11px] font-semibold text-slate-400">팬 평균 평점</p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {player.fanRatingAverage !== null && player.fanRatingAverage !== undefined
                    ? player.fanRatingAverage.toFixed(2)
                    : "-"}
                </p>
              </div>
              <div className="rounded-[18px] bg-slate-50 px-3 py-3">
                <p className="text-[11px] font-semibold text-slate-400">팬 평점 경기 수</p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {formatStatNumber(player.fanRatingMatches)}
                </p>
              </div>
              <div className="rounded-[18px] bg-slate-50 px-3 py-3">
                <p className="text-[11px] font-semibold text-slate-400">팬 MOM</p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {formatStatNumber(player.fanMomCount)}
                </p>
              </div>
              <div className="rounded-[18px] bg-slate-50 px-3 py-3">
                <p className="text-[11px] font-semibold text-slate-400">대표 한줄평 좋아요</p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {formatStatNumber(player.fanTopCommentLikes)}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-[18px] bg-slate-50 px-3 py-3">
              <p className="text-[11px] font-semibold text-slate-400">대표 한줄평</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">
                {player.fanTopComment || "아직 대표 한줄평이 없습니다."}
              </p>
            </div>
          </div>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}
