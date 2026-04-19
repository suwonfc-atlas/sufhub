"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  saveMatch,
  saveMatchLineup,
  settlePendingFanRatings,
  type AdminMutationResult,
  type MatchLineupMutationInput,
  type MatchMutationInput,
} from "@/app/admin/actions";
import {
  AdminFormMessage,
  AdminInputField,
  AdminSelectField,
} from "@/components/admin/admin-field-controls";
import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn, formatDateTimeInputValue, formatRoundLabel, parseKstDate } from "@/lib/utils";
import type { AdminDashboardFanRatingContext } from "@/lib/data/admin";
import type { LeagueMatch, MatchLineup, MatchStatus, PlayerSeason, Season, Team } from "@/types";

function formatMatchDateLabel(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(parseKstDate(value));
}

function monthKeyOf(value: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).format(parseKstDate(value));
}

function monthLabelOf(key: string) {
  const [, month] = key.split("-");
  return `${Number(month)}월`;
}

function sortMatchesByDate(matches: LeagueMatch[]) {
  return [...matches].sort(
    (left, right) => parseKstDate(left.match_date).getTime() - parseKstDate(right.match_date).getTime(),
  );
}

function getMonthTabs(matches: LeagueMatch[]) {
  return Array.from(new Set(matches.map((match) => monthKeyOf(match.match_date)))).map((key) => ({
    key,
    label: monthLabelOf(key),
  }));
}

function getVisibleMatches(matches: LeagueMatch[], monthKey: string) {
  return matches.filter((match) => (monthKey ? monthKeyOf(match.match_date) === monthKey : true));
}

function shouldShowInDashboard(match: LeagueMatch) {
  return !(match.status === "finished" && Boolean(match.highlight_url?.trim()));
}

function createMatchForm(match: LeagueMatch): MatchMutationInput {
  return {
    id: match.id,
    season_id: match.season_id,
    competition_code: match.competition_code,
    league_code: match.league_code ?? "",
    round: match.round?.toString() ?? "",
    stage_label: match.stage_label ?? "",
    stage_order: match.stage_order?.toString() ?? "",
    match_date: formatDateTimeInputValue(match.match_date),
    home_team_id: match.home_team_id,
    away_team_id: match.away_team_id,
    highlight_url: match.highlight_url ?? "",
    stadium_name: match.stadium_name ?? "",
    home_score: match.home_score?.toString() ?? "",
    away_score: match.away_score?.toString() ?? "",
    status: match.status,
    competition: match.competition,
  };
}

function createLineupForm(
  match: LeagueMatch | null,
  primaryTeamId: string | null,
  lineups: MatchLineup[],
): MatchLineupMutationInput | null {
  if (!match || !primaryTeamId) {
    return null;
  }

  if (match.home_team_id !== primaryTeamId && match.away_team_id !== primaryTeamId) {
    return null;
  }

  const saved = lineups.find((item) => item.match_id === match.id && item.team_id === primaryTeamId);

  return {
    match_id: match.id,
    team_id: primaryTeamId,
    starters_player_ids: saved?.starters_player_ids ?? [],
    bench_player_ids: saved?.bench_player_ids ?? [],
    rating_excluded_player_ids: saved?.rating_excluded_player_ids ?? [],
  };
}

function getTeamName(team: Team | null | undefined, teamId: string, teams: Team[]) {
  return team?.name ?? teams.find((item) => item.id === teamId)?.name ?? "팀 미지정";
}

function getRosterLabel(playerSeason: PlayerSeason) {
  const numberLabel = playerSeason.squad_number ? `${playerSeason.squad_number}` : "-";
  return `${numberLabel} ${playerSeason.player?.name ?? "선수"}`;
}

export function AdminDashboardSchedule({
  matches,
  teams,
  seasons,
  activeSeasonId,
  primaryTeamId,
  roster,
  lineups,
  fanRatingContext,
}: {
  matches: LeagueMatch[];
  teams: Team[];
  seasons: Season[];
  activeSeasonId: string;
  primaryTeamId: string | null;
  roster: PlayerSeason[];
  lineups: MatchLineup[];
  fanRatingContext: AdminDashboardFanRatingContext;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultSeasonId = activeSeasonId;
  const initialSeasonMatches = sortMatchesByDate(matches);
  const initialMonthTabs = getMonthTabs(initialSeasonMatches);
  const monthQueryKey = searchParams.get("month") ?? "";
  const initialMonthKey = initialMonthTabs.some((tab) => tab.key === monthQueryKey)
    ? monthQueryKey
    : initialMonthTabs[0]?.key ?? "";
  const initialVisibleMatches = getVisibleMatches(initialSeasonMatches, initialMonthKey).filter(
    shouldShowInDashboard,
  );
  const initialMatch = initialVisibleMatches[0] ?? null;

  const [selectedSeasonId, setSelectedSeasonId] = useState(defaultSeasonId);
  const [selectedMonthKey, setSelectedMonthKey] = useState(initialMonthKey);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(initialMatch?.id ?? null);
  const [form, setForm] = useState<MatchMutationInput | null>(
    initialMatch ? createMatchForm(initialMatch) : null,
  );
  const [lineupForm, setLineupForm] = useState<MatchLineupMutationInput | null>(
    createLineupForm(initialMatch, primaryTeamId, lineups),
  );
  const [result, setResult] = useState<AdminMutationResult | null>(null);
  const [lineupResult, setLineupResult] = useState<AdminMutationResult | null>(null);
  const [lineupHint, setLineupHint] = useState<string | null>(null);
  const [settlementResult, setSettlementResult] = useState<AdminMutationResult | null>(null);
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const [isSavingMatch, startMatchTransition] = useTransition();
  const [isSavingLineup, startLineupTransition] = useTransition();
  const [isSettling, startSettlementTransition] = useTransition();

  const seasonOptions = useMemo(
    () => seasons.map((season) => ({ label: season.code, value: season.id })),
    [seasons],
  );

  const seasonMatches = useMemo(() => sortMatchesByDate(matches), [matches]);

  const monthTabs = useMemo(() => getMonthTabs(seasonMatches), [seasonMatches]);
  const activeMonthKey = monthTabs.some((tab) => tab.key === selectedMonthKey)
    ? selectedMonthKey
    : monthTabs[0]?.key ?? "";

  const visibleMatches = useMemo(
    () => getVisibleMatches(seasonMatches, activeMonthKey).filter(shouldShowInDashboard),
    [seasonMatches, activeMonthKey],
  );

  const selectedMatch =
    visibleMatches.find((match) => match.id === selectedMatchId) ?? visibleMatches[0] ?? null;

  const seasonRoster = useMemo(() => {
    if (!selectedMatch || !primaryTeamId) return [] as PlayerSeason[];

    return roster
      .filter(
        (item) =>
          item.team_id === primaryTeamId &&
          (item.season_id === selectedMatch.season_id || item.season === selectedMatch.season) &&
          item.player,
      )
      .sort((left, right) => {
        const leftNumber = left.squad_number ?? 999;
        const rightNumber = right.squad_number ?? 999;
        if (leftNumber !== rightNumber) return leftNumber - rightNumber;
        return (left.player?.name ?? "").localeCompare(right.player?.name ?? "", "ko");
      });
  }, [primaryTeamId, roster, selectedMatch]);

  const lineupPlayersById = useMemo(
    () => new Map(seasonRoster.map((item) => [item.player_id, item])),
    [seasonRoster],
  );

  const starters = useMemo(
    () => (lineupForm?.starters_player_ids ?? []).map((id) => lineupPlayersById.get(id)).filter(Boolean) as PlayerSeason[],
    [lineupForm, lineupPlayersById],
  );
  const bench = useMemo(
    () => (lineupForm?.bench_player_ids ?? []).map((id) => lineupPlayersById.get(id)).filter(Boolean) as PlayerSeason[],
    [lineupForm, lineupPlayersById],
  );
  const ratingExcludedSet = useMemo(
    () => new Set(lineupForm?.rating_excluded_player_ids ?? []),
    [lineupForm],
  );

  useEffect(() => {
    const nextSeasonMatches = sortMatchesByDate(matches);
    const nextMonthTabs = getMonthTabs(nextSeasonMatches);
    const nextMonthKey = nextMonthTabs.some((tab) => tab.key === selectedMonthKey)
      ? selectedMonthKey
      : nextMonthTabs.some((tab) => tab.key === monthQueryKey)
        ? monthQueryKey
        : nextMonthTabs[0]?.key ?? "";
    const nextVisibleMatches = getVisibleMatches(nextSeasonMatches, nextMonthKey).filter(
      shouldShowInDashboard,
    );
    const nextMatch =
      nextVisibleMatches.find((match) => match.id === selectedMatchId) ?? nextVisibleMatches[0] ?? null;

    setSelectedSeasonId(activeSeasonId);
    setSelectedMonthKey(nextMonthKey);
    setSelectedMatchId(nextMatch?.id ?? null);
    setForm(nextMatch ? createMatchForm(nextMatch) : null);
    setLineupForm(createLineupForm(nextMatch, primaryTeamId, lineups));
    setResult(null);
    setLineupResult(null);
    setLineupHint(null);
  }, [activeSeasonId, lineups, matches, monthQueryKey, primaryTeamId, selectedMatchId, selectedMonthKey]);

  useEffect(() => {
    if (!lineupForm) return;

    const validPlayerIds = new Set(seasonRoster.map((player) => player.player_id));
    const nextStarters = lineupForm.starters_player_ids.filter((id) => validPlayerIds.has(id));
    const nextBench = lineupForm.bench_player_ids.filter(
      (id) => validPlayerIds.has(id) && !nextStarters.includes(id),
    );
    const nextExcluded = lineupForm.rating_excluded_player_ids.filter((id) =>
      nextBench.includes(id),
    );

    const changed =
      nextStarters.length !== lineupForm.starters_player_ids.length ||
      nextBench.length !== lineupForm.bench_player_ids.length ||
      nextExcluded.length !== lineupForm.rating_excluded_player_ids.length;

    if (!changed) return;

    setLineupForm((current) =>
      current
        ? (() => {
            const sanitizedStarters = current.starters_player_ids.filter((id) =>
              validPlayerIds.has(id),
            );
            const sanitizedBench = current.bench_player_ids.filter(
              (id) => validPlayerIds.has(id) && !sanitizedStarters.includes(id),
            );
            const sanitizedExcluded = current.rating_excluded_player_ids.filter((id) =>
              sanitizedBench.includes(id),
            );

            return {
              ...current,
              starters_player_ids: sanitizedStarters,
              bench_player_ids: sanitizedBench,
              rating_excluded_player_ids: sanitizedExcluded,
            };
          })()
        : current,
    );
    setLineupHint("기존 라인업에 현재 시즌 선수 목록과 맞지 않는 항목이 있어 자동으로 정리했습니다. 확인 후 다시 저장해 주세요.");
  }, [lineupForm, seasonRoster]);

  const handleSelectMatch = (match: LeagueMatch) => {
    setSelectedMatchId(match.id);
    setForm(createMatchForm(match));
    setLineupForm(createLineupForm(match, primaryTeamId, lineups));
    setResult(null);
    setLineupResult(null);
    setLineupHint(null);
    setMobileEditorOpen(true);
  };

  const handleSeasonChange = (seasonId: string) => {
    setSelectedSeasonId(seasonId);
    setMobileEditorOpen(false);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("season", seasonId);
    router.replace(`/admin?${nextParams.toString()}`, { scroll: false });
  };

  const handleMonthChange = (monthKey: string) => {
    const nextVisibleMatches = getVisibleMatches(seasonMatches, monthKey).filter(
      shouldShowInDashboard,
    );
    const nextMatch = nextVisibleMatches[0] ?? null;

    setSelectedMonthKey(monthKey);
    setSelectedMatchId(nextMatch?.id ?? null);
    setForm(nextMatch ? createMatchForm(nextMatch) : null);
    setLineupForm(createLineupForm(nextMatch, primaryTeamId, lineups));
    setResult(null);
    setLineupResult(null);
    setLineupHint(null);
    setMobileEditorOpen(false);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("month", monthKey);
    router.replace(`/admin?${nextParams.toString()}`, { scroll: false });
  };

  const assignLineupPlayer = (playerId: string, target: "starter" | "bench" | "remove") => {
    setLineupForm((current) => {
      if (!current) return current;

      const startersSet = current.starters_player_ids.filter((id) => id !== playerId);
      const benchSet = current.bench_player_ids.filter((id) => id !== playerId);

      if (target === "starter") {
        if (!current.starters_player_ids.includes(playerId) && startersSet.length >= 11) {
          setLineupHint("선발은 최대 11명까지 선택할 수 있습니다.");
          return current;
        }

        setLineupHint(null);
        return {
          ...current,
          starters_player_ids: [...startersSet, playerId],
          bench_player_ids: benchSet,
          rating_excluded_player_ids: current.rating_excluded_player_ids.filter((id) => id !== playerId),
        };
      }

      if (target === "bench") {
        setLineupHint(null);
        return {
          ...current,
          starters_player_ids: startersSet,
          bench_player_ids: [...benchSet, playerId],
        };
      }

      setLineupHint(null);
      return {
        ...current,
        starters_player_ids: startersSet,
        bench_player_ids: benchSet,
        rating_excluded_player_ids: current.rating_excluded_player_ids.filter((id) => id !== playerId),
      };
    });
  };

  const toggleRatingExclusion = (playerId: string) => {
    setLineupForm((current) => {
      if (!current) return current;
      if (!current.bench_player_ids.includes(playerId)) {
        return {
          ...current,
          rating_excluded_player_ids: current.rating_excluded_player_ids.filter((id) => id !== playerId),
        };
      }

      const alreadyExcluded = current.rating_excluded_player_ids.includes(playerId);
      return {
        ...current,
        rating_excluded_player_ids: alreadyExcluded
          ? current.rating_excluded_player_ids.filter((id) => id !== playerId)
          : [...current.rating_excluded_player_ids, playerId],
      };
    });
  };

  const handleSaveMatch = () => {
    if (!form) return;

    startMatchTransition(async () => {
      const next = await saveMatch(form);
      setResult(next);
      if (next.status === "success") {
        router.refresh();
      }
    });
  };

  const handleSaveLineup = () => {
    if (!lineupForm) return;

    startLineupTransition(async () => {
      const next = await saveMatchLineup(lineupForm);
      setLineupResult(next);
      if (next.status === "success") {
        router.refresh();
      }
    });
  };

  const renderMatchEditor = () => {
    if (!form || !selectedMatch) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          경기 일정을 선택하면 결과 입력 폼이 열립니다.
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">
            {getTeamName(selectedMatch.home_team, selectedMatch.home_team_id, teams)} vs{" "}
            {getTeamName(selectedMatch.away_team, selectedMatch.away_team_id, teams)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {selectedMatch.season} / {selectedMatch.competition_code}
            {formatRoundLabel(selectedMatch.round)
              ? ` / ${formatRoundLabel(selectedMatch.round)}`
              : selectedMatch.stage_label
                ? ` / ${selectedMatch.stage_label}`
                : ""}{" "}
            / {formatMatchDateLabel(selectedMatch.match_date)}
          </p>
        </div>

        <div className="grid gap-4">
          <AdminSelectField
            label="경기 상태"
            value={form.status}
            onChange={(event) =>
              setForm((current) =>
                current ? { ...current, status: event.target.value as MatchStatus } : current,
              )
            }
            options={[
              { label: "예정", value: "scheduled" },
              { label: "진행 중", value: "live" },
              { label: "종료", value: "finished" },
            ]}
          />
          <div className="grid gap-4">
            <AdminInputField
              label="홈팀 점수"
              type="number"
              value={form.home_score}
              onChange={(event) =>
                setForm((current) =>
                  current ? { ...current, home_score: event.target.value } : current,
                )
              }
            />
            <AdminInputField
              label="원정팀 점수"
              type="number"
              value={form.away_score}
              onChange={(event) =>
                setForm((current) =>
                  current ? { ...current, away_score: event.target.value } : current,
                )
              }
            />
          </div>
          <AdminInputField
            label="하이라이트 URL"
            value={form.highlight_url}
            onChange={(event) =>
              setForm((current) =>
                current ? { ...current, highlight_url: event.target.value } : current,
              )
            }
          />
        </div>

        <AdminFormMessage message={result?.message ?? null} status={result?.status} />

        <button
          type="button"
          disabled={isSavingMatch}
          onClick={handleSaveMatch}
          className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
        >
          {isSavingMatch ? "저장 중..." : "경기 결과 저장"}
        </button>
      </div>
    );
  };

  const renderLineupEditor = () => {
    if (!selectedMatch) {
      return null;
    }

    if (!lineupForm || !primaryTeamId) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          내 팀 경기에서만 라인업을 등록할 수 있습니다.
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">라인업 등록</p>
          <p className="mt-1 text-xs text-slate-500">
            {selectedMatch.season} 시즌 내 팀 선수 중 선발 11명과 후보를 선택해 저장합니다.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-900">선발 11명</p>
              <span className="text-xs font-semibold text-slate-500">{starters.length}/11</span>
            </div>
            {starters.length ? (
              <div className="grid gap-2">
                {starters.map((player) => (
                  <div
                    key={`starter-${player.id}`}
                    className="grid gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="break-keep text-sm font-semibold text-slate-800">
                      {getRosterLabel(player)}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-sky-700">선발 고정</span>
                      <button
                        type="button"
                        onClick={() => assignLineupPlayer(player.player_id, "remove")}
                        className="rounded-full bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700"
                      >
                        제거
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">아직 선발 선수가 없습니다.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-900">후보</p>
              <span className="text-xs font-semibold text-slate-500">
                {bench.length}명 / 평점 제외 {lineupForm.rating_excluded_player_ids.length}명
              </span>
            </div>
            {bench.length ? (
              <div className="grid gap-2">
                {bench.map((player) => (
                  <div
                    key={`bench-${player.id}`}
                    className="grid gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0 space-y-1">
                      <span className="block break-keep font-semibold text-slate-800">
                        {getRosterLabel(player)}
                      </span>
                      <span className="mt-1 block text-xs font-semibold text-slate-500">
                        {ratingExcludedSet.has(player.player_id) ? "평점 제외" : "평점 포함"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleRatingExclusion(player.player_id)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold",
                          ratingExcludedSet.has(player.player_id)
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700",
                        )}
                      >
                        {ratingExcludedSet.has(player.player_id) ? "투표 제외" : "투표 포함"}
                      </button>
                      <button
                        type="button"
                        onClick={() => assignLineupPlayer(player.player_id, "remove")}
                        className="text-xs font-semibold text-rose-600"
                      >
                        제거
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">후보를 추가할 수 있습니다.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-900">이번 시즌 선수 선택</p>
            <span className="text-xs text-slate-500">선발 또는 후보로 배치하세요.</span>
          </div>

          {seasonRoster.length ? (
            <div className="grid max-h-[38vh] gap-2 overflow-y-auto pr-1 lg:max-h-[26rem]">
              {seasonRoster.map((player) => {
                const isStarter = lineupForm.starters_player_ids.includes(player.player_id);
                const isBench = lineupForm.bench_player_ids.includes(player.player_id);

                return (
                  <div
                    key={player.id}
                    className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="break-keep text-sm font-semibold text-slate-900">
                        {getRosterLabel(player)}
                        {player.is_captain ? " (C)" : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {player.player?.position ?? "-"}
                        {player.is_injured && player.injury_detail ? ` / ${player.injury_detail}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => assignLineupPlayer(player.player_id, "starter")}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold",
                          isStarter
                            ? "bg-sky-600 text-white"
                            : "bg-white text-slate-700 ring-1 ring-slate-200",
                        )}
                      >
                        선발
                      </button>
                      <button
                        type="button"
                        onClick={() => assignLineupPlayer(player.player_id, "bench")}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold",
                          isBench
                            ? "bg-amber-500 text-white"
                            : "bg-white text-slate-700 ring-1 ring-slate-200",
                        )}
                      >
                        후보
                      </button>
                      {isBench ? (
                        <button
                          type="button"
                          onClick={() => toggleRatingExclusion(player.player_id)}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-semibold",
                            ratingExcludedSet.has(player.player_id)
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
                          )}
                        >
                          {ratingExcludedSet.has(player.player_id) ? "평점 제외" : "평점 포함"}
                        </button>
                      ) : null}
                      {(isStarter || isBench) ? (
                        <button
                          type="button"
                          onClick={() => assignLineupPlayer(player.player_id, "remove")}
                          className="rounded-full bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700"
                        >
                          제거
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              선택한 시즌의 내 팀 선수 데이터가 없습니다.
            </div>
          )}
        </div>

        <AdminFormMessage message={lineupHint} status="error" />
        <p className="text-xs text-slate-500">
          후보 중 실제로 출전하지 않은 선수는 `평점 제외`로 바꾸면 사용자 평점 대상에서 빠집니다.
        </p>
        <AdminFormMessage message={lineupResult?.message ?? null} status={lineupResult?.status} />

        <div className="sticky bottom-0 z-10 -mx-1 bg-white/95 px-1 pb-1 pt-2 backdrop-blur">
          <button
            type="button"
            disabled={isSavingLineup}
            onClick={handleSaveLineup}
            className="w-full rounded-full bg-[color:var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            {isSavingLineup ? "저장 중..." : "라인업 저장"}
          </button>
        </div>
      </div>
    );
  };

  const renderFanRatingSettlement = () => (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">팬 평점 정산</p>
        <p className="mt-1 text-xs text-slate-500">
          가장 최근 종료 경기는 팬 평점 입력 기간으로 열어두고, 그 이전 종료 경기만 정산합니다.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            정산 대기
          </p>
          <p className="mt-2 text-base font-black text-slate-950">
            {fanRatingContext.pendingCount}경기
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            현재 열려 있는 경기
          </p>
          <p className="mt-2 text-sm font-black text-slate-950">
            {fanRatingContext.openMatch?.title ?? "없음"}
          </p>
          {fanRatingContext.openMatch ? (
            <p className="mt-1 text-xs text-slate-500">
              {fanRatingContext.openMatch.seasonCode} / {fanRatingContext.openMatch.roundLabel} /{" "}
              {formatMatchDateLabel(fanRatingContext.openMatch.matchDate)}
            </p>
          ) : null}
        </div>
      </div>

      <AdminFormMessage
        message={settlementResult?.message ?? null}
        status={settlementResult?.status}
      />

      <button
        type="button"
        disabled={isSettling}
        onClick={() => {
          startSettlementTransition(async () => {
            const next = await settlePendingFanRatings();
            setSettlementResult(next);
            if (next.status === "success") {
              router.refresh();
            }
          });
        }}
        className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
      >
        {isSettling ? "정산 중..." : "팬 평점 정산 실행"}
      </button>
    </div>
  );

  return (
    <>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.95fr)]">
        <SurfaceCard className="flex h-fit flex-col gap-4 self-start">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-700">
                Match Calendar
              </p>
              <h2 className="text-2xl font-black text-slate-950">전체 경기 일정</h2>
              <p className="text-sm text-slate-600">
                시즌과 월을 선택한 뒤 경기를 누르면 결과와 라인업을 바로 입력할 수 있습니다.
              </p>
            </div>
            <div className="w-full max-w-[220px] shrink-0">
              <AdminSelectField
                label="시즌"
                value={selectedSeasonId}
                onChange={(event) => handleSeasonChange(event.target.value)}
                options={seasonOptions}
              />
            </div>
          </div>

          {monthTabs.length ? (
            <AdminSectionTabs
              tabs={monthTabs}
              activeKey={activeMonthKey}
              onChange={handleMonthChange}
            />
          ) : null}

          {visibleMatches.length ? (
            <div className="grid gap-3">
              {visibleMatches.map((match) => {
                const active = match.id === selectedMatchId;
                const homeName = getTeamName(match.home_team, match.home_team_id, teams);
                const awayName = getTeamName(match.away_team, match.away_team_id, teams);

                return (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => handleSelectMatch(match)}
                    className={cn(
                      "grid gap-2 rounded-2xl border px-4 py-3 text-left transition",
                      active
                        ? "border-sky-300 bg-sky-50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                      <span>
                        {match.season} / {match.competition_code}
                        {formatRoundLabel(match.round)
                          ? ` / ${formatRoundLabel(match.round)}`
                          : match.stage_label
                            ? ` / ${match.stage_label}`
                            : ""}
                      </span>
                      <span>{formatMatchDateLabel(match.match_date)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {homeName} vs {awayName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {match.stadium_name ?? "경기장 미입력"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-black text-slate-950">
                          {match.home_score !== null && match.away_score !== null
                            ? `${match.home_score} : ${match.away_score}`
                            : "- : -"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {match.status === "finished"
                            ? "종료"
                            : match.status === "live"
                              ? "진행 중"
                              : "예정"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              선택한 시즌과 월에 등록된 경기가 없습니다.
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard className="hidden h-fit flex-col gap-4 self-start lg:flex lg:sticky lg:top-[calc(4.875rem+1.5rem)]">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-700">
              Result Editor
            </p>
            <h3 className="text-2xl font-black text-slate-950">경기 결과 입력</h3>
          </div>
          {renderMatchEditor()}
          {selectedMatch ? <div className="h-px bg-slate-100" /> : null}
          {renderLineupEditor()}
          <div className="h-px bg-slate-100" />
          {renderFanRatingSettlement()}
        </SurfaceCard>
      </div>

      {mobileEditorOpen && selectedMatch ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileEditorOpen(false)}
            className="absolute inset-0 bg-slate-950/40"
            aria-label="편집기 닫기"
          />
          <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] rounded-t-[28px] bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 shadow-[0_-24px_64px_rgba(15,23,42,0.22)]">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-700">
                  Match Editor
                </p>
                <h3 className="text-xl font-black text-slate-950">경기 편집</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileEditorOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                aria-label="편집기 닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid max-h-[calc(100dvh-15rem)] gap-4 overflow-y-auto pb-2">
              {renderMatchEditor()}
              <div className="h-px bg-slate-100" />
              {renderLineupEditor()}
              <div className="h-px bg-slate-100" />
              {renderFanRatingSettlement()}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
