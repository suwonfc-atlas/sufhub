"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Star, ThumbsUp, Trophy } from "lucide-react";

import {
  submitPlayerRatings,
  togglePlayerRatingLike,
  type CommunityMutationResult,
} from "@/app/community/actions";
import { Modal } from "@/components/ui/modal";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  type CommunityPlayerRatingComment,
  type CommunityPlayerRatingRow,
  type CommunityPlayerRatingsData,
} from "@/lib/data/player-ratings";
import { cn, formatDateLabel, formatRoundLabel, parseKstDate } from "@/lib/utils";

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

function TeamLogo({ name, logoUrl }: { name: string; logoUrl: string | null | undefined }) {
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

function groupPlayers(players: CommunityPlayerRatingRow[]) {
  const groups = new Map<string, CommunityPlayerRatingRow[]>();

  for (const player of players) {
    const bucket = groups.get(player.position) ?? [];
    bucket.push(player);
    groups.set(player.position, bucket);
  }

  return ["GK", "DF", "MF", "FW"]
    .map((position) => ({ position, players: groups.get(position) ?? [] }))
    .filter((group) => group.players.length > 0);
}

function CommentItem({
  comment,
  canLike,
  onLike,
  isPending,
}: {
  comment: CommunityPlayerRatingComment;
  canLike: boolean;
  onLike: (ratingId: string) => void;
  isPending: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{comment.nickname}</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500">
              {comment.rating}점
            </span>
          </div>
          <p className="mt-1 break-words text-sm leading-6 text-slate-700">{comment.comment}</p>
        </div>

        <button
          type="button"
          disabled={!canLike || isPending}
          onClick={() => onLike(comment.ratingId)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition",
            comment.likedByMe
              ? "bg-[rgba(21,93,252,0.12)] text-[color:var(--brand-blue)]"
              : "bg-white text-slate-500",
            (!canLike || isPending) && "cursor-not-allowed opacity-60",
          )}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          {comment.likeCount}
        </button>
      </div>
    </div>
  );
}

export function CommunityPlayerRatingsCard({ data }: { data: CommunityPlayerRatingsData }) {
  const router = useRouter();
  const [voteOpen, setVoteOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLikePending, startLikeTransition] = useTransition();
  const [feedback, setFeedback] = useState<CommunityMutationResult | null>(null);
  const [momPlayerId, setMomPlayerId] = useState<string | null>(data.userMomPlayerId);
  const [form, setForm] = useState<Record<string, { rating: number | null; comment: string }>>(() =>
    Object.fromEntries(
      data.players.map((player) => [
        player.playerId,
        {
          rating: player.userRating,
          comment: player.userComment ?? "",
        },
      ]),
    ),
  );

  const groupedPlayers = useMemo(() => groupPlayers(data.players), [data.players]);
  const latestCommentsByPlayerId = useMemo(
    () =>
      new Map(
        data.players.map((player) => [
          player.playerId,
          [...player.comments].sort(
            (left, right) =>
              parseKstDate(right.createdAt).getTime() - parseKstDate(left.createdAt).getTime(),
          ),
        ]),
      ),
    [data.players],
  );

  if (!data.match || !data.primaryTeam) {
    return (
      <SurfaceCard className="p-4 text-sm text-slate-600">
        {data.message ?? "평점을 남길 종료 경기가 없습니다."}
      </SurfaceCard>
    );
  }

  const myTeamName = data.primaryTeam.short_name ?? data.primaryTeam.name;
  const opponentName = data.match.opponent;
  const roundLabel = formatRoundLabel(data.match.round);

  const formReady =
    data.players.every((player) => {
      const row = form[player.playerId];
      return Number.isInteger(row?.rating) && (row?.rating ?? 0) >= 1 && (row?.rating ?? 0) <= 10;
    }) && Boolean(momPlayerId);

  const handleLike = (ratingId: string) => {
    startLikeTransition(async () => {
      const result = await togglePlayerRatingLike({ ratingId });
      setFeedback(result);
      if (result.status === "success") {
        router.refresh();
      }
    });
  };

  return (
    <>
      <SurfaceCard className="space-y-3 p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0 space-y-1">
            <h2 className="text-sm font-black text-slate-950">우리끼리 평점</h2>
            <p className="text-xs text-slate-500">{formatMatchDate(data.match.match_date)}</p>
          </div>

          <div className="min-w-[7.25rem] rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-right">
            <p className="text-[11px] font-semibold text-slate-400">참여 인원</p>
            <div className="mt-1 flex items-end justify-end gap-1">
              <span className="text-base font-black text-slate-950">{data.participationCount}</span>
              <span className="text-[11px] text-slate-500">명</span>
            </div>
            <p className="mt-1 whitespace-nowrap text-[11px] text-slate-500">
              한줄평 {data.totalComments}개
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-3">
          <div className="flex items-center gap-1.5">
            <TeamLogo name={myTeamName} logoUrl={data.primaryTeam.logo_url} />
            <span className="text-sm font-semibold text-slate-800">{myTeamName}</span>
          </div>
          <span className="text-xs font-semibold text-slate-400">VS</span>
          <div className="flex items-center gap-1.5">
            <TeamLogo name={opponentName} logoUrl={data.match.opponent_logo_url} />
            <span className="text-sm font-semibold text-slate-800">{opponentName}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Top Rating
            </p>
            {data.topRatedPlayer ? (
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-950">{data.topRatedPlayer.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-slate-950">
                    {data.topRatedPlayer.averageRating?.toFixed(2)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-1.5 text-sm text-slate-500">아직 평점이 없습니다.</p>
            )}
          </div>

          <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              MOM
            </p>
            {data.topMomPlayer ? (
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-950">{data.topMomPlayer.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-slate-950">{data.topMomPlayer.momVoteCount}</p>
                </div>
              </div>
            ) : (
              <p className="mt-1.5 text-sm text-slate-500">아직 MOM 투표가 없습니다.</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            {roundLabel ? `${roundLabel} / ` : ""}
            {formatDateLabel(data.match.match_date)} 종료 경기 평가
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVoteOpen(true)}
              disabled={!data.available}
              className="rounded-full bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              평점 입력
            </button>
            <button
              type="button"
              onClick={() => setResultOpen(true)}
              className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700"
            >
              결과 보기
            </button>
          </div>
        </div>

        {feedback ? (
          <div
            className={cn(
              "rounded-xl px-3.5 py-2.5 text-sm",
              feedback.status === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700",
            )}
          >
            {feedback.message}
          </div>
        ) : null}
      </SurfaceCard>

      <Modal
        isOpen={voteOpen}
        onClose={() => {
          setVoteOpen(false);
          setFeedback(null);
        }}
        title="우리끼리 평점 입력"
        className="max-w-4xl"
        bodyClassName="overflow-y-auto overflow-x-visible"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              {myTeamName} vs {opponentName}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {data.match.competition}
              {roundLabel ? ` / ${roundLabel}` : ""}
              {data.match.stage_label ? ` / ${data.match.stage_label}` : ""}
              {` / ${formatMatchDate(data.match.match_date)}`}
            </p>
          </div>

          {!data.userId ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              로그인 후에 평점과 MOM 투표에 참여할 수 있습니다.
            </div>
          ) : null}

          {groupedPlayers.map((group) => (
            <div key={group.position} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {group.position}
              </p>
              <div className="grid gap-3">
                {group.players.map((player) => {
                  const row = form[player.playerId] ?? { rating: null, comment: "" };

                  return (
                    <div
                      key={player.playerId}
                      className="rounded-[22px] border border-slate-100 bg-white px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-base font-bold text-slate-950">
                            {player.squadNumber ? `${player.squadNumber}. ` : ""}
                            {player.name}
                            {player.isCaptain ? " (C)" : ""}
                          </p>
                          <p className="text-xs text-slate-500">{player.position}</p>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2">
                        <div className="grid grid-cols-[3.75rem_minmax(0,1fr)] items-center gap-2">
                          <select
                            value={row.rating?.toString() ?? ""}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                [player.playerId]: {
                                  ...current[player.playerId],
                                  rating: event.target.value ? Number(event.target.value) : null,
                                },
                              }))
                            }
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-[color:var(--brand-blue)]"
                          >
                            <option value="">평점 선택</option>
                            {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
                              <option key={score} value={score}>
                                {score}점
                              </option>
                            ))}
                          </select>
                          <input
                            value={row.comment}
                            maxLength={50}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                [player.playerId]: {
                                  ...current[player.playerId],
                                  comment: event.target.value,
                                },
                              }))
                            }
                            placeholder="한줄평을 남겨 주세요."
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--brand-blue)]"
                          />
                        </div>

                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                          <span className="text-[11px] text-slate-400">{row.comment.length} / 50</span>
                          <button
                            type="button"
                            onClick={() => setMomPlayerId(player.playerId)}
                            className={cn(
                              "inline-flex items-center justify-center gap-1 rounded-full px-3 py-2 text-xs font-semibold transition",
                              momPlayerId === player.playerId
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600",
                            )}
                          >
                            <Trophy className="h-3.5 w-3.5" />
                            MOM
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

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
              disabled={isPending || !data.userId || !formReady}
              onClick={() => {
                startTransition(async () => {
                  const result = await submitPlayerRatings({
                    matchId: data.match!.id,
                    ratings: data.players.map((player) => ({
                      playerId: player.playerId,
                      rating: form[player.playerId]?.rating ?? 0,
                      comment: form[player.playerId]?.comment ?? "",
                    })),
                    momPlayerId: momPlayerId ?? "",
                  });
                  setFeedback(result);
                  if (result.status === "success") {
                    setVoteOpen(false);
                    router.refresh();
                  }
                });
              }}
              className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isPending ? "저장 중..." : "평점 제출"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={resultOpen}
        onClose={() => {
          setResultOpen(false);
          setFeedback(null);
        }}
        title="우리끼리 평점 결과"
        className="max-w-5xl"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {myTeamName} vs {opponentName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  참여 {data.participationCount}명 / 한줄평 {data.totalComments}개
                </p>
              </div>
              <div className="flex gap-2 text-xs">
                {data.topRatedPlayer ? (
                  <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-slate-700">
                    최고 평점 {data.topRatedPlayer.name}
                  </span>
                ) : null}
                {data.topMomPlayer ? (
                  <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-slate-700">
                    MOM 1위 {data.topMomPlayer.name}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {data.players.map((player) => {
              const latestComments = latestCommentsByPlayerId.get(player.playerId) ?? [];

              return (
                <div
                  key={player.playerId}
                  className="rounded-[22px] border border-slate-100 bg-white px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-slate-950">
                        {player.squadNumber ? `${player.squadNumber}. ` : ""}
                        {player.name}
                        {player.isCaptain ? " (C)" : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{player.position}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
                        <Star className="h-3.5 w-3.5" />
                        {player.averageRating?.toFixed(2) ?? "-"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
                        <Trophy className="h-3.5 w-3.5" />
                        MOM {player.momVoteCount}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {player.comments.length}개
                      </span>
                    </div>
                  </div>

                  {player.topComment ? (
                    <div className="mt-3 rounded-2xl border border-[rgba(21,93,252,0.12)] bg-[rgba(21,93,252,0.05)] px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--brand-blue)]">
                        대표 한줄평
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {player.topComment.comment}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {player.topComment.nickname} · 좋아요 {player.topComment.likeCount}
                      </p>
                    </div>
                  ) : null}

                  {latestComments.length ? (
                    <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto pr-1">
                      {latestComments.map((comment) => (
                        <CommentItem
                          key={comment.ratingId}
                          comment={comment}
                          canLike={Boolean(data.userId) && !comment.isMine}
                          onLike={handleLike}
                          isPending={isLikePending}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">등록된 한줄평이 없습니다.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </>
  );
}
