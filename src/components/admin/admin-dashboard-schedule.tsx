"use client";

import { X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  saveMatch,
  type AdminMutationResult,
  type MatchMutationInput,
} from "@/app/admin/actions";
import {
  AdminFormMessage,
  AdminInputField,
  AdminSelectField,
} from "@/components/admin/admin-field-controls";
import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn, formatRoundLabel } from "@/lib/utils";
import type { LeagueMatch, MatchStatus, Season, Team } from "@/types";

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function formatDateTimeLocal(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

function monthKeyOf(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelOf(key: string) {
  const [, month] = key.split("-");
  return `${Number(month)}월`;
}

function sortMatchesByDate(matches: LeagueMatch[]) {
  return [...matches].sort(
    (left, right) => new Date(left.match_date).getTime() - new Date(right.match_date).getTime(),
  );
}

function getSeasonMatches(matches: LeagueMatch[], seasonId: string) {
  return sortMatchesByDate(matches.filter((match) => match.season_id === seasonId));
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
    match_date: formatDateTimeLocal(match.match_date),
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

function getTeamName(team: Team | null | undefined, teamId: string, teams: Team[]) {
  return team?.name ?? teams.find((item) => item.id === teamId)?.name ?? "팀 미지정";
}

export function AdminDashboardSchedule({
  matches,
  teams,
  seasons,
}: {
  matches: LeagueMatch[];
  teams: Team[];
  seasons: Season[];
}) {
  const router = useRouter();
  const defaultSeasonId = seasons.find((season) => season.is_current)?.id ?? seasons[0]?.id ?? "";
  const initialSeasonMatches = getSeasonMatches(matches, defaultSeasonId);
  const initialMonthTabs = getMonthTabs(initialSeasonMatches);
  const initialMonthKey = initialMonthTabs[0]?.key ?? "";
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
  const [result, setResult] = useState<AdminMutationResult | null>(null);
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const seasonOptions = useMemo(
    () => seasons.map((season) => ({ label: season.code, value: season.id })),
    [seasons],
  );

  const seasonMatches = useMemo(
    () => getSeasonMatches(matches, selectedSeasonId),
    [matches, selectedSeasonId],
  );

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

  const handleSelectMatch = (match: LeagueMatch) => {
    setSelectedMatchId(match.id);
    setForm(createMatchForm(match));
    setResult(null);
    setMobileEditorOpen(true);
  };

  const handleSeasonChange = (seasonId: string) => {
    const nextSeasonMatches = getSeasonMatches(matches, seasonId);
    const nextMonthTabs = getMonthTabs(nextSeasonMatches);
    const nextMonthKey = nextMonthTabs[0]?.key ?? "";
    const nextVisibleMatches = getVisibleMatches(nextSeasonMatches, nextMonthKey).filter(
      shouldShowInDashboard,
    );
    const nextMatch = nextVisibleMatches[0] ?? null;

    setSelectedSeasonId(seasonId);
    setSelectedMonthKey(nextMonthKey);
    setSelectedMatchId(nextMatch?.id ?? null);
    setForm(nextMatch ? createMatchForm(nextMatch) : null);
    setResult(null);
    setMobileEditorOpen(false);
  };

  const handleMonthChange = (monthKey: string) => {
    const nextVisibleMatches = getVisibleMatches(seasonMatches, monthKey).filter(
      shouldShowInDashboard,
    );
    const nextMatch = nextVisibleMatches[0] ?? null;

    setSelectedMonthKey(monthKey);
    setSelectedMatchId(nextMatch?.id ?? null);
    setForm(nextMatch ? createMatchForm(nextMatch) : null);
    setResult(null);
    setMobileEditorOpen(false);
  };

  const handleSave = () => {
    if (!form) return;

    startTransition(async () => {
      const next = await saveMatch(form);
      setResult(next);
      if (next.status === "success") {
        router.refresh();
      }
    });
  };

  const renderEditor = (compact = false) => {
    if (!form || !selectedMatch) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          경기 일정을 선택하면 결과 입력 폼이 열립니다.
        </div>
      );
    }

    return (
      <>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">
            {getTeamName(selectedMatch.home_team, selectedMatch.home_team_id, teams)} vs{" "}
            {getTeamName(selectedMatch.away_team, selectedMatch.away_team_id, teams)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {selectedMatch.season} · {selectedMatch.league_code}
            {formatRoundLabel(selectedMatch.round) ? ` · ${formatRoundLabel(selectedMatch.round)}` : ""} ·{" "}
            {formatDateLabel(selectedMatch.match_date)}
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
          <div className={cn("grid gap-4", compact ? "grid-cols-1" : "grid-cols-1")}>
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
          disabled={isPending}
          onClick={handleSave}
          className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
        >
          {isPending ? "저장 중..." : "경기 결과 저장"}
        </button>
      </>
    );
  };

  return (
    <>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <SurfaceCard className="flex h-fit flex-col gap-4 self-start">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-700">
                Match Calendar
              </p>
              <h2 className="text-2xl font-black text-slate-950">전체 경기 일정</h2>
              <p className="text-sm text-slate-600">
                시즌과 월을 고른 뒤 경기를 눌러 결과를 바로 입력할 수 있습니다.
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
                        {match.season} · {match.league_code}
                        {formatRoundLabel(match.round) ? ` · ${formatRoundLabel(match.round)}` : ""}
                      </span>
                      <span>{formatDateLabel(match.match_date)}</span>
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
          {renderEditor()}
        </SurfaceCard>
      </div>

      {mobileEditorOpen && form && selectedMatch ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileEditorOpen(false)}
            className="absolute inset-0 bg-slate-950/40"
            aria-label="결과 입력 닫기"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 shadow-[0_-24px_64px_rgba(15,23,42,0.22)]">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-700">
                  Result Editor
                </p>
                <h3 className="text-xl font-black text-slate-950">경기 결과 입력</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileEditorOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                aria-label="결과 입력 닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid max-h-[72vh] gap-4 overflow-y-auto pb-2">
              {renderEditor(true)}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
