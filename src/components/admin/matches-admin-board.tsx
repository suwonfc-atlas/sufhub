"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  deleteMatch,
  saveMatch,
  syncSeasonLeagueMatchesFromJson,
  type AdminMutationResult,
  type MatchMutationInput,
} from "@/app/admin/actions";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import {
  AdminFormMessage,
  AdminInputField,
  AdminSelectField,
  AdminTextareaField,
} from "@/components/admin/admin-field-controls";
import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatRoundLabel } from "@/lib/utils";
import type { AdminPageResult } from "@/lib/data/admin";
import type { CompetitionCode, LeagueCode, LeagueMatch, Season, SeasonTeamLeague, Team } from "@/types";

const TEXT = {
  season: "시즌",
  seasonFilter: "시즌 필터",
  roundFilter: "라운드 필터",
  stageFilter: "단계 필터",
  league: "리그",
  competitionCode: "대회 구분",
  round: "라운드",
  stageLabel: "단계",
  datetime: "경기 일시",
  home: "홈팀",
  away: "원정팀",
  status: "상태",
  competition: "대회명",
  stadium: "경기장",
  highlightUrl: "하이라이트 URL",
  homeScore: "홈팀 점수",
  awayScore: "원정팀 점수",
  allSeasons: "전체 시즌",
  allRounds: "전체 라운드",
  allStages: "전체 단계",
  selectSeason: "시즌 선택",
  selectTeam: "팀 선택",
  selectStage: "단계 선택",
  teamPlaceholder: "팀 미지정",
  scheduled: "예정",
  live: "진행 중",
  finished: "종료",
  tableTitle: "전체 경기 목록",
  tableDescription:
    "시즌과 리그, 라운드 기준으로 경기 일정과 결과를 관리합니다.",
  create: "경기 추가",
  delete: "선택 삭제",
  edit: "경기 수정",
  back: "목록으로",
  save: "경기 저장",
  update: "경기 수정",
  saving: "저장 중...",
  deleted: "삭제되었습니다.",
  empty: "등록된 경기가 없습니다.",
  createTitle: "경기 추가",
  editTitle: "경기 수정",
  editorDescription:
    "시즌과 리그에 배정된 팀 기준으로 경기 일정과 결과를 관리합니다.",
  jsonSyncTitle: "경기 JSON 일괄 등록",
  jsonSyncDescription:
    "시즌과 리그를 고른 뒤 경기 결과 JSON을 붙여넣으면 종료 경기로 일괄 반영합니다.",
  jsonPayload: "경기 JSON",
  sync: "JSON 반영",
  syncing: "반영 중...",
  koreaCup: "코리아컵",
};

const KOREA_CUP_STAGES = [
  { label: "1라운드", order: 1 },
  { label: "2라운드", order: 2 },
  { label: "3라운드", order: 3 },
  { label: "4라운드", order: 4 },
  { label: "16강", order: 16 },
  { label: "8강", order: 20 },
  { label: "4강", order: 30 },
  { label: "결승", order: 40 },
] as const;

function formatDateTimeLocal(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

function formatMatchDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function resolveDefaultSeasonId(seasons: Season[]) {
  return seasons.find((season) => season.is_current)?.id ?? seasons[0]?.id ?? "";
}

function getCompetitionLabel(competitionCode: CompetitionCode) {
  if (competitionCode === "K2") return "K리그2";
  if (competitionCode === "KOREA_CUP") return TEXT.koreaCup;
  return "K리그1";
}

function createEmptyMatchForm(
  seasons: Season[],
  competitionCode: CompetitionCode = "K1",
): MatchMutationInput {
  return {
    season_id: resolveDefaultSeasonId(seasons),
    competition_code: competitionCode,
    league_code: competitionCode === "KOREA_CUP" ? "" : competitionCode,
    round: "",
    stage_label: "",
    stage_order: "",
    match_date: "",
    home_team_id: "",
    away_team_id: "",
    highlight_url: "",
    stadium_name: "",
    home_score: "",
    away_score: "",
    status: "scheduled",
    competition: getCompetitionLabel(competitionCode),
  };
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

function getTeamName(teams: Team[], teamId: string) {
  return teams.find((team) => team.id === teamId)?.name ?? TEXT.teamPlaceholder;
}

function getTeamHomeStadiumName(teams: Team[], teamId: string) {
  return teams.find((team) => team.id === teamId)?.home_stadium_name ?? "";
}

export function MatchesAdminBoard({
  matches,
  teams,
  seasons,
  seasonTeamLeagues,
  pagination,
  initialCompetitionTab,
  initialSeasonFilter,
  initialRoundFilter,
  initialStageFilter,
}: {
  matches: LeagueMatch[];
  teams: Team[];
  seasons: Season[];
  seasonTeamLeagues: SeasonTeamLeague[];
  pagination: AdminPageResult<LeagueMatch>;
  initialCompetitionTab: "all" | CompetitionCode;
  initialSeasonFilter: string;
  initialRoundFilter: string;
  initialStageFilter: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeCompetitionTab, setActiveCompetitionTab] = useState<"all" | CompetitionCode>(
    initialCompetitionTab,
  );
  const [seasonFilter, setSeasonFilter] = useState(initialSeasonFilter);
  const [roundFilter, setRoundFilter] = useState(initialRoundFilter);
  const [stageFilter, setStageFilter] = useState(initialStageFilter);
  const [editorCompetitionCode, setEditorCompetitionCode] = useState<CompetitionCode>(
    initialCompetitionTab === "all" ? "K1" : initialCompetitionTab,
  );
  const [form, setForm] = useState<MatchMutationInput>(() =>
    createEmptyMatchForm(seasons, initialCompetitionTab === "all" ? "K1" : initialCompetitionTab),
  );
  const [result, setResult] = useState<AdminMutationResult | null>(null);
  const [syncSeasonId, setSyncSeasonId] = useState(resolveDefaultSeasonId(seasons));
  const [syncLeagueCode, setSyncLeagueCode] = useState<LeagueCode>(
    initialCompetitionTab === "K2" ? "K2" : "K1",
  );
  const [matchesPayloadJson, setMatchesPayloadJson] = useState("");
  const [syncResult, setSyncResult] = useState<AdminMutationResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const effectiveCompetitionCode =
    activeId === "new" ? editorCompetitionCode : form.competition_code;
  const effectiveLeagueCode: LeagueCode | null =
    effectiveCompetitionCode === "KOREA_CUP"
      ? null
      : ((activeId === "new" ? editorCompetitionCode : form.league_code) as LeagueCode);
  const effectiveCompetition =
    activeId === "new" ? getCompetitionLabel(effectiveCompetitionCode) : form.competition;

  const seasonFilterOptions = useMemo(
    () => [{ label: TEXT.allSeasons, value: "all" }, ...seasons.map((season) => ({ label: season.code, value: season.id }))],
    [seasons],
  );
  const seasonEditorOptions = useMemo(
    () => [{ label: TEXT.selectSeason, value: "" }, ...seasons.map((season) => ({ label: season.code, value: season.id }))],
    [seasons],
  );
  const roundOptions = useMemo(
    () => [
      { label: TEXT.allRounds, value: "all" },
      ...Array.from({ length: 50 }, (_, index) => ({
        label: `${index + 1}R`,
        value: String(index + 1),
      })),
      { label: "PO", value: "99" },
    ],
    [],
  );
  const stageOptions = useMemo(
    () => [
      { label: TEXT.allStages, value: "all" },
      ...KOREA_CUP_STAGES.map((stage) => ({ label: stage.label, value: stage.label })),
    ],
    [],
  );
  const stageEditorOptions = useMemo(
    () => [
      { label: TEXT.selectStage, value: "" },
      ...KOREA_CUP_STAGES.map((stage) => ({ label: stage.label, value: stage.label })),
    ],
    [],
  );

  const availableTeamIds = useMemo(
    () =>
      seasonTeamLeagues
        .filter(
          (assignment) =>
            assignment.season_id === form.season_id &&
            (effectiveCompetitionCode === "KOREA_CUP"
              ? true
              : assignment.league_code === effectiveLeagueCode),
        )
        .map((assignment) => assignment.team_id),
    [effectiveCompetitionCode, effectiveLeagueCode, form.season_id, seasonTeamLeagues],
  );

  const teamOptions = useMemo(
    () => [
      { label: TEXT.selectTeam, value: "" },
      ...availableTeamIds
        .map((teamId) => teams.find((team) => team.id === teamId))
        .filter((team): team is Team => Boolean(team))
        .map((team) => ({ label: team.name, value: team.id })),
    ],
    [availableTeamIds, teams],
  );

  const rows = useMemo(
    () =>
      matches.map((match) => ({
        id: match.id,
        cells: [
          match.season,
          match.competition,
          formatMatchDateTime(match.match_date),
          match.competition_code === "KOREA_CUP"
            ? match.stage_label ?? "-"
            : (formatRoundLabel(match.round) ?? "-"),
          `${getTeamName(teams, match.home_team_id)} vs ${getTeamName(teams, match.away_team_id)}`,
          match.status === "finished"
            ? TEXT.finished
            : match.status === "live"
              ? TEXT.live
              : TEXT.scheduled,
          match.home_score !== null && match.away_score !== null
            ? `${match.home_score} : ${match.away_score}`
            : "-",
        ],
      })),
    [matches, teams],
  );

  const pushFilters = (
    competition: "all" | CompetitionCode,
    nextSeason: string,
    nextRound: string,
    nextStage: string,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("competition", competition);
    if (nextSeason !== "all") params.set("season", nextSeason);
    else params.delete("season");
    if (nextRound !== "all") params.set("round", nextRound);
    else params.delete("round");
    if (nextStage !== "all") params.set("stage", nextStage);
    else params.delete("stage");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const closeEditor = () => {
    setActiveId(null);
    setEditorCompetitionCode(initialCompetitionTab === "all" ? "K1" : initialCompetitionTab);
    setForm(createEmptyMatchForm(seasons, initialCompetitionTab === "all" ? "K1" : initialCompetitionTab));
    setResult(null);
  };

  const openCreateEditor = (competitionTab: "all" | CompetitionCode) => {
    const nextCompetitionCode: CompetitionCode = competitionTab === "all" ? "K1" : competitionTab;
    setActiveId("new");
    setSelectedIds([]);
    setEditorCompetitionCode(nextCompetitionCode);
    setForm(createEmptyMatchForm(seasons, nextCompetitionCode));
    setResult(null);
  };

  const handleSave = () => {
    startTransition(async () => {
      const next = await saveMatch({
        ...form,
        competition_code: effectiveCompetitionCode,
        league_code: effectiveLeagueCode ?? "",
        competition: effectiveCompetition,
      });

      setResult(next);
      if (next.status === "success") {
        closeEditor();
        setSelectedIds([]);
        router.refresh();
      }
    });
  };

  const handleDeleteSelected = () => {
    if (
      !selectedIds.length ||
      !window.confirm(`선택한 경기 ${selectedIds.length}건을 삭제할까요?`)
    ) {
      return;
    }

    startTransition(async () => {
      let lastResult: AdminMutationResult = { status: "success", message: TEXT.deleted };
      for (const id of selectedIds) {
        lastResult = await deleteMatch(id);
        if (lastResult.status === "error") break;
      }
      setResult(lastResult);
      if (lastResult.status === "success") {
        setSelectedIds([]);
        closeEditor();
        router.refresh();
      }
    });
  };

  const handleJsonSync = () => {
    startTransition(async () => {
      const nextResult = await syncSeasonLeagueMatchesFromJson({
        season_id: syncSeasonId,
        league_code: syncLeagueCode,
        matches_payload_json: matchesPayloadJson,
      });

      setSyncResult(nextResult);
      if (nextResult.status === "success") {
        setMatchesPayloadJson("");
        router.refresh();
      }
    });
  };

  if (activeId) {
    return (
      <div className="grid auto-rows-min gap-3">
        <AdminSectionTabs
          tabs={[
            { key: "all", label: "전체" },
            { key: "K1", label: "K1" },
            { key: "K2", label: "K2" },
            { key: "KOREA_CUP", label: TEXT.koreaCup },
          ]}
          activeKey={activeCompetitionTab}
          onChange={(key) => {
            const nextCompetitionTab = key as "all" | CompetitionCode;
            setActiveCompetitionTab(nextCompetitionTab);
            setSelectedIds([]);
            if (nextCompetitionTab !== "KOREA_CUP") {
              setSyncLeagueCode(nextCompetitionTab === "K2" ? "K2" : "K1");
            }
            if (activeId === "new") {
              openCreateEditor(nextCompetitionTab);
            }
          }}
        />

        <SurfaceCard className="grid gap-5">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-950">
                {form.id ? TEXT.editTitle : TEXT.createTitle}
              </h2>
              <p className="text-sm leading-5 text-slate-600">{TEXT.editorDescription}</p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={closeEditor}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              {TEXT.back}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AdminSelectField
              label={TEXT.season}
              value={form.season_id}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  season_id: event.target.value,
                  home_team_id: "",
                  away_team_id: "",
                  stadium_name: "",
                }))
              }
              options={seasonEditorOptions}
            />
            <AdminSelectField
              label={TEXT.competitionCode}
              value={effectiveCompetitionCode}
              onChange={(event) => {
                const nextCompetitionCode = event.target.value as CompetitionCode;
                const nextStage = KOREA_CUP_STAGES[0];
                setEditorCompetitionCode(nextCompetitionCode);
                setForm((current) => ({
                  ...current,
                  competition_code: nextCompetitionCode,
                  league_code: nextCompetitionCode === "KOREA_CUP" ? "" : nextCompetitionCode,
                  round: nextCompetitionCode === "KOREA_CUP" ? "" : current.round,
                  stage_label: nextCompetitionCode === "KOREA_CUP" ? nextStage.label : "",
                  stage_order: nextCompetitionCode === "KOREA_CUP" ? String(nextStage.order) : "",
                  home_team_id: "",
                  away_team_id: "",
                  stadium_name: "",
                  competition: getCompetitionLabel(nextCompetitionCode),
                }));
              }}
              options={[
                { label: "K1", value: "K1" },
                { label: "K2", value: "K2" },
                { label: TEXT.koreaCup, value: "KOREA_CUP" },
              ]}
            />
            {effectiveCompetitionCode === "KOREA_CUP" ? (
              <AdminSelectField
                label={TEXT.stageLabel}
                value={form.stage_label}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    stage_label: event.target.value,
                    stage_order: String(
                      KOREA_CUP_STAGES.find((stage) => stage.label === event.target.value)?.order ?? "",
                    ),
                  }))
                }
                options={stageEditorOptions}
              />
            ) : (
              <AdminInputField
                label={TEXT.round}
                type="number"
                value={form.round}
                onChange={(event) => setForm((current) => ({ ...current, round: event.target.value }))}
              />
            )}
            <AdminInputField
              label={TEXT.datetime}
              type="datetime-local"
              value={form.match_date}
              onChange={(event) =>
                setForm((current) => ({ ...current, match_date: event.target.value }))
              }
            />
            <AdminSelectField
              key={`home-${form.season_id}-${effectiveCompetitionCode}`}
              label={TEXT.home}
              value={form.home_team_id}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  home_team_id: event.target.value,
                  stadium_name: getTeamHomeStadiumName(teams, event.target.value),
                }))
              }
              options={teamOptions}
            />
            <AdminSelectField
              key={`away-${form.season_id}-${effectiveCompetitionCode}`}
              label={TEXT.away}
              value={form.away_team_id}
              onChange={(event) =>
                setForm((current) => ({ ...current, away_team_id: event.target.value }))
              }
              options={teamOptions}
            />
            <AdminSelectField
              label={TEXT.status}
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as MatchMutationInput["status"],
                }))
              }
              options={[
                { label: TEXT.scheduled, value: "scheduled" },
                { label: TEXT.live, value: "live" },
                { label: TEXT.finished, value: "finished" },
              ]}
            />
            <AdminInputField
              label={TEXT.competition}
              value={effectiveCompetition}
              onChange={(event) =>
                setForm((current) => ({ ...current, competition: event.target.value }))
              }
            />
            <AdminInputField
              label={TEXT.stadium}
              value={form.stadium_name}
              onChange={(event) =>
                setForm((current) => ({ ...current, stadium_name: event.target.value }))
              }
            />
            <AdminInputField
              label={TEXT.highlightUrl}
              value={form.highlight_url}
              onChange={(event) =>
                setForm((current) => ({ ...current, highlight_url: event.target.value }))
              }
            />
            <AdminInputField
              label={TEXT.homeScore}
              type="number"
              value={form.home_score}
              onChange={(event) =>
                setForm((current) => ({ ...current, home_score: event.target.value }))
              }
            />
            <AdminInputField
              label={TEXT.awayScore}
              type="number"
              value={form.away_score}
              onChange={(event) =>
                setForm((current) => ({ ...current, away_score: event.target.value }))
              }
            />
          </div>

          <AdminFormMessage message={result?.message ?? null} status={result?.status} />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={handleSave}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              {isPending ? TEXT.saving : form.id ? TEXT.update : TEXT.save}
            </button>
          </div>
        </SurfaceCard>
      </div>
    );
  }

  return (
    <div className="grid auto-rows-min gap-3">
      <AdminSectionTabs
        tabs={[
          { key: "all", label: "전체" },
          { key: "K1", label: "K1" },
          { key: "K2", label: "K2" },
          { key: "KOREA_CUP", label: TEXT.koreaCup },
        ]}
        activeKey={activeCompetitionTab}
        onChange={(key) => {
          const nextCompetitionTab = key as "all" | CompetitionCode;
          setActiveCompetitionTab(nextCompetitionTab);
          setSelectedIds([]);
          if (nextCompetitionTab !== "KOREA_CUP") {
            setSyncLeagueCode(nextCompetitionTab === "K2" ? "K2" : "K1");
          }
          setStageFilter("all");
          pushFilters(nextCompetitionTab, seasonFilter, roundFilter, "all");
        }}
      />

      <SurfaceCard className="grid gap-4 md:grid-cols-2">
        <AdminSelectField
          label={TEXT.seasonFilter}
          value={seasonFilter}
          onChange={(event) => {
            const value = event.target.value;
            setSeasonFilter(value);
            pushFilters(activeCompetitionTab, value, roundFilter, stageFilter);
          }}
          options={seasonFilterOptions}
        />
        {activeCompetitionTab === "KOREA_CUP" ? (
          <AdminSelectField
            label={TEXT.stageFilter}
            value={stageFilter}
            onChange={(event) => {
              const value = event.target.value;
              setStageFilter(value);
              pushFilters(activeCompetitionTab, seasonFilter, "all", value);
            }}
            options={stageOptions}
          />
        ) : (
          <AdminSelectField
            label={TEXT.roundFilter}
            value={roundFilter}
            onChange={(event) => {
              const value = event.target.value;
              setRoundFilter(value);
              pushFilters(activeCompetitionTab, seasonFilter, value, "all");
            }}
            options={roundOptions}
          />
        )}
      </SurfaceCard>

      {activeCompetitionTab !== "KOREA_CUP" ? (
      <SurfaceCard className="grid gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-950">{TEXT.jsonSyncTitle}</h2>
          <p className="text-sm leading-5 text-slate-600">{TEXT.jsonSyncDescription}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <AdminSelectField
            label={TEXT.season}
            value={syncSeasonId}
            onChange={(event) => setSyncSeasonId(event.target.value)}
            options={seasonEditorOptions}
          />
          <AdminSelectField
            label={TEXT.league}
            value={syncLeagueCode}
            onChange={(event) => setSyncLeagueCode(event.target.value as LeagueCode)}
            options={[
              { label: "K1", value: "K1" },
              { label: "K2", value: "K2" },
            ]}
          />
        </div>

        <AdminTextareaField
          label={TEXT.jsonPayload}
          value={matchesPayloadJson}
          onChange={(event) => setMatchesPayloadJson(event.target.value)}
          placeholder="games 배열 또는 result.games 형태의 JSON을 붙여넣어 주세요."
          rows={10}
        />

        <AdminFormMessage message={syncResult?.message ?? null} status={syncResult?.status} />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isPending || !syncSeasonId || !matchesPayloadJson.trim()}
            onClick={handleJsonSync}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending ? TEXT.syncing : TEXT.sync}
          </button>
        </div>
      </SurfaceCard>
      ) : null}

      <AdminDataTable
        title={TEXT.tableTitle}
        description={TEXT.tableDescription}
        columns={[
          "시즌",
          "대회",
          "경기 일시",
          "단계",
          "경기",
          "상태",
          "스코어",
        ]}
        rows={rows}
        selectedIds={selectedIds}
        activeId={activeId}
        onToggleRow={(id) =>
          setSelectedIds((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
          )
        }
        onToggleAll={() =>
          setSelectedIds(selectedIds.length === matches.length ? [] : matches.map((item) => item.id))
        }
        onSelectRow={(id) => {
          const selected = matches.find((item) => item.id === id);
          if (!selected) return;
          setActiveId(id);
          setEditorCompetitionCode(selected.competition_code);
          setForm(createMatchForm(selected));
          setResult(null);
        }}
        onCreate={() => openCreateEditor(activeCompetitionTab)}
        onDeleteSelected={handleDeleteSelected}
        createLabel={TEXT.create}
        deleteLabel={TEXT.delete}
        pending={isPending}
        emptyMessage={activeCompetitionTab === "all" ? TEXT.empty : `${getCompetitionLabel(activeCompetitionTab)} ${TEXT.empty}`}
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalCount={pagination.totalCount}
      />
    </div>
  );
}
