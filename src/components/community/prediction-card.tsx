"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { submitPrediction } from "@/app/community/actions";
import { Modal } from "@/components/ui/modal";
import { SurfaceCard } from "@/components/ui/surface-card";
import { parseKstDate } from "@/lib/utils";
import type { PredictionChoice } from "@/types";

import type { CommunityPredictionData, PredictionRankingRow } from "@/lib/data/predictions";

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
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(parseKstDate(value));
}

function TeamLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className="h-10 w-10 rounded-full border border-white/70 bg-white object-contain"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
      {name.slice(0, 2)}
    </div>
  );
}

function RankingRow({
  row,
  isCurrentUser,
}: {
  row: PredictionRankingRow;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
        isCurrentUser ? "bg-[rgba(21,93,252,0.12)] text-slate-950" : "bg-slate-50 text-slate-700"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-500">#{row.rank}</span>
        <span className="font-semibold">{row.nickname}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span>{row.hits}/{row.total}</span>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700">
          {row.accuracy}%
        </span>
      </div>
    </div>
  );
}

export function CommunityPredictionCard({ data }: { data: CommunityPredictionData }) {
  const router = useRouter();
  const [voteOpen, setVoteOpen] = useState(false);
  const [rankOpen, setRankOpen] = useState(false);
  const [choice, setChoice] = useState<PredictionChoice | null>(data.userChoice);
  const [result, setResult] = useState<{ status: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const isLoggedIn = Boolean(data.userId);

  const voteLabel = choice ? CHOICE_LABELS[choice] : "투표 전";
  const match = data.displayMatch ?? data.nextMatch;
  const isPostMatch = data.mode === "post";
  const postMessage = data.postMessage;

  const voteStats = useMemo(() => data.voteCounts, [data.voteCounts]);

  if (!match || !data.primaryTeam) {
    return (
      <SurfaceCard className="p-6 text-sm text-slate-600">
        다음 경기가 아직 등록되지 않았습니다.
      </SurfaceCard>
    );
  }

  const opponentName = match.opponent;
  const opponentLogoUrl = match.opponent_logo_url;
  const myTeamName = data.primaryTeam.short_name ?? data.primaryTeam.name;
  const myTeamLogoUrl = data.primaryTeam.logo_url ?? null;

  const isHome = match.venue === "home";
  const primaryScore = isHome ? match.score_home : match.score_away;
  const opponentScore = isHome ? match.score_away : match.score_home;
  const outcome =
    match.status === "finished" && primaryScore !== null && opponentScore !== null
      ? primaryScore === opponentScore
        ? "draw"
        : primaryScore > opponentScore
          ? "win"
          : "lose"
      : null;
  const winner =
    outcome === "draw"
      ? null
      : outcome === "win"
        ? { name: myTeamName, logoUrl: myTeamLogoUrl }
        : { name: opponentName, logoUrl: opponentLogoUrl };

  return (
    <>
    <SurfaceCard className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-black text-slate-950">경기 예측</h2>
            <p className="text-xs text-slate-500">{formatMatchDate(match.match_date)}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
            <span>내 적중률</span>
            <span className="font-black text-slate-950">
              {data.userAccuracy.total ? `${data.userAccuracy.accuracy}%` : "-"}
            </span>
            <span className="text-[10px] text-slate-500">
              ({data.userAccuracy.hits}/{data.userAccuracy.total})
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-3">
          {isPostMatch && winner ? (
            <div className="flex items-center gap-2">
              <TeamLogo name={winner.name} logoUrl={winner.logoUrl} />
              <span className="text-sm font-semibold text-slate-800">{winner.name}</span>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                승
              </span>
            </div>
          ) : isPostMatch && outcome === "draw" ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              무승부
            </span>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <TeamLogo name={myTeamName} logoUrl={myTeamLogoUrl} />
                <span className="text-sm font-semibold text-slate-800">{myTeamName}</span>
              </div>
              <span className="text-xs font-semibold text-slate-400">VS</span>
              <div className="flex items-center gap-1.5">
                <TeamLogo name={opponentName} logoUrl={opponentLogoUrl} />
                <span className="text-sm font-semibold text-slate-800">{opponentName}</span>
              </div>
            </>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>승 {voteStats.winRate}%</span>
            <span>무 {voteStats.drawRate}%</span>
            <span>패 {voteStats.loseRate}%</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-2 bg-[color:var(--brand-blue)]" style={{ width: `${voteStats.winRate}%` }} />
            <div className="h-2 bg-slate-300" style={{ width: `${voteStats.drawRate}%` }} />
            <div className="h-2 bg-rose-400" style={{ width: `${voteStats.loseRate}%` }} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>참여 {voteStats.total}명</span>
            <span>내 선택: {voteLabel}</span>
            {isPostMatch && outcome ? (
              <span
                className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                  choice && choice === outcome
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {choice ? (choice === outcome ? "적중" : "불일치") : "미참여"}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            {isPostMatch
              ? postMessage ?? "경기 종료 24시간 후 다음 경기 예측이 시작됩니다."
              : "경기 시작 전까지 예측을 수정할 수 있습니다."}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVoteOpen(true)}
              disabled={!isLoggedIn || isPostMatch}
              className="rounded-full bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-white"
            >
              투표
            </button>
            <button
              type="button"
              onClick={() => setRankOpen(true)}
              className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700"
            >
              랭킹
            </button>
          </div>
        </div>
      </SurfaceCard>

      <Modal
        isOpen={voteOpen}
        onClose={() => {
          setVoteOpen(false);
          setResult(null);
        }}
        title="예측 투표"
      >
        <div className="space-y-4">
          {!isLoggedIn ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              로그인 후 예측에 참여할 수 있습니다.
            </div>
          ) : null}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              {myTeamName} vs {opponentName}
            </p>
            <p className="text-xs text-slate-500">{formatMatchDate(match.match_date)}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {(["win", "draw", "lose"] as PredictionChoice[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setChoice(item)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  choice === item
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {CHOICE_LABELS[item]}
              </button>
            ))}
          </div>

          {result ? (
            <div
              className={`rounded-xl px-3.5 py-2.5 text-sm ${
                result.status === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {result.message}
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setVoteOpen(false)}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              취소
            </button>
            <button
              type="button"
              disabled={isPending || !choice}
              onClick={() => {
                if (!choice) return;
                startTransition(async () => {
                  const next = await submitPrediction({ matchId: match.id, choice });
                  setResult(next);
                  if (next.status === "success") {
                    setVoteOpen(false);
                    setResult(null);
                    router.refresh();
                  }
                });
              }}
              className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isPending ? "저장 중..." : "투표 저장"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={rankOpen} onClose={() => setRankOpen(false)} title="예측 랭킹">
        <div className="space-y-2">
          {data.ranking.length ? (
            data.ranking.map((row) => (
              <RankingRow
                key={row.userId}
                row={row}
                isCurrentUser={row.userId === data.userId}
              />
            ))
          ) : (
            <p className="text-sm text-slate-500">아직 랭킹 데이터가 없습니다.</p>
          )}
        </div>
      </Modal>
    </>
  );
}
