"use client";

import Image from "next/image";

import {
  cn,
  formatDateLabel,
  formatRoundLabel,
  formatTimeLabel,
  getMatchScoreLabel,
} from "@/lib/utils";
import type { Match } from "@/types";

import { MatchStatusBadge } from "./match-status-badge";

interface MatchCardProps {
  match: Match;
  eyebrow?: string;
  eyebrowTone?: "blue" | "red";
  className?: string;
}

const LABEL_WIN = "승";
const LABEL_LOSS = "패";
const LABEL_DRAW = "무";
const LABEL_HIGHLIGHT = "하이라이트";
const LABEL_STADIUM_TBD = "경기장 미정";
const LABEL_BEFORE = "경기 전";

export function MatchCard({
  match,
  eyebrow,
  eyebrowTone = "blue",
  className,
}: MatchCardProps) {
  const hasHighlight = match.status === "finished" && Boolean(match.highlight_url);
  const hasResult =
    match.status === "finished" &&
    match.score_home !== null &&
    match.score_away !== null;

  const eyebrowToneClass =
    eyebrowTone === "red"
      ? "text-[color:var(--brand-red)]"
      : "text-[color:var(--brand-blue)]";

  const venueBadgeLabel = match.venue === "home" ? "H" : "A";
  const teamScore = match.venue === "home" ? match.score_home ?? 0 : match.score_away ?? 0;
  const opponentScore = match.venue === "home" ? match.score_away ?? 0 : match.score_home ?? 0;

  const resultLabel = !hasResult
    ? null
    : teamScore > opponentScore
      ? LABEL_WIN
      : teamScore < opponentScore
        ? LABEL_LOSS
        : LABEL_DRAW;

  const resultTone =
    resultLabel === LABEL_WIN
      ? "bg-[rgba(21,93,252,0.10)] text-[color:var(--brand-blue)]"
      : resultLabel === LABEL_LOSS
        ? "bg-[rgba(227,62,62,0.10)] text-[color:var(--brand-red)]"
        : "bg-slate-100 text-slate-500";

  const openHighlight = () => {
    if (!match.highlight_url) return;
    window.open(match.highlight_url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={cn(
        "rounded-[22px] border border-[color:var(--line)] bg-white px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "text-[10px] font-semibold uppercase tracking-[0.18em] sm:text-[11px]",
            eyebrowToneClass,
          )}
        >
          {eyebrow}
        </p>
      ) : null}

      <div
        className={cn(
          "grid grid-cols-[3.5rem_minmax(0,1fr)_3.35rem] items-start gap-2.5 sm:grid-cols-[4.5rem_minmax(0,1fr)_4.25rem] sm:gap-3",
          eyebrow && "mt-2",
        )}
      >
        <div className="grid justify-items-center text-center">
          <p className="text-[11px] font-semibold text-[color:var(--brand-blue)] sm:text-xs">
            {formatDateLabel(match.match_date, false)}
          </p>
          <p className="mt-1 text-[10px] text-slate-500 sm:text-[11px]">
            {formatTimeLabel(match.match_date)}
          </p>
          <span
            className={cn(
              "mt-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[10px] font-black sm:h-7 sm:min-w-7 sm:text-[11px]",
              match.venue === "home"
                ? "bg-[color:var(--brand-blue)] text-white"
                : "border border-[rgba(227,62,62,0.24)] bg-white text-[color:var(--brand-red)]",
            )}
          >
            {venueBadgeLabel}
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 rounded-full bg-[rgba(21,93,252,0.08)] px-2 py-1 text-[10px] font-semibold text-[color:var(--brand-blue)] sm:px-2.5 sm:text-[11px]">
              {match.competition_code === "KOREA_CUP"
                ? (match.stage_label ?? match.competition)
                : (formatRoundLabel(match.round) ?? match.competition)}
            </span>

            <div className="flex min-w-0 items-center gap-1.5">
              <span className="shrink-0 text-[11px] font-bold uppercase text-slate-700 sm:text-xs">
                vs
              </span>
              {match.opponent_logo_url ? (
                <span className="relative h-[22px] w-[22px] shrink-0 overflow-hidden rounded-full border border-slate-100 bg-white sm:h-7 sm:w-7">
                  <Image
                    src={match.opponent_logo_url}
                    alt={`${match.opponent} 로고`}
                    fill
                    sizes="28px"
                    className="object-contain p-0.5"
                  />
                </span>
              ) : null}
              <p className="truncate text-[13px] font-black leading-none text-slate-950 sm:text-[15px]">
                {match.opponent}
              </p>
            </div>
          </div>

          <p className="mt-1 truncate text-[11px] text-slate-500 sm:text-xs">
            {match.stadium_name ?? LABEL_STADIUM_TBD}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {resultLabel ? (
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-[10px] font-black sm:px-2.5 sm:text-[11px]",
                  resultTone,
                )}
              >
                {resultLabel}
              </span>
            ) : null}

            {hasHighlight ? (
              <button
                type="button"
                onClick={openHighlight}
                className="highlight-pill inline-flex rounded-full bg-[color:var(--brand-red)] px-3 py-1.5 text-[11px] font-semibold sm:text-xs"
              >
                {LABEL_HIGHLIGHT}
              </button>
            ) : null}
          </div>
        </div>

        <div className="text-right">
          <p className="text-[14px] font-black text-slate-950 sm:text-lg">
            {match.status === "finished" ? getMatchScoreLabel(match) : LABEL_BEFORE}
          </p>
          <div className="mt-1 flex justify-end">
            <MatchStatusBadge status={match.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
