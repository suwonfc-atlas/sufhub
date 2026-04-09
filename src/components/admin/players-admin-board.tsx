"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  deletePlayerRosterEntry,
  savePlayer,
  savePlayerSeason,
  savePlayerStat,
  saveSeasonTeamStatsPayload,
  syncSeasonTeamPlayerStats,
  type AdminMutationResult,
  type PlayerMutationInput,
  type PlayerSeasonMutationInput,
  type PlayerStatMutationInput,
} from "@/app/admin/actions";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import {
  AdminCheckboxField,
  AdminFormMessage,
  AdminImageUploadField,
  AdminInputField,
  AdminSelectField,
  AdminTextareaField,
} from "@/components/admin/admin-field-controls";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { AdminPageResult, AdminPlayerRosterItem } from "@/lib/data/admin";
import type { PlayerPosition, Season, SeasonTeamLeague, Team } from "@/types";

interface PlayersAdminBoardProps {
  roster: AdminPageResult<AdminPlayerRosterItem>;
  seasons: Season[];
  seasonTeamLeagues: SeasonTeamLeague[];
  teams: Team[];
  initialSeasonFilter: string;
}

function getDefaultSeason(seasons: Season[]) {
  return seasons.find((season) => season.is_current) ?? seasons[0] ?? null;
}

function getPrimaryTeamId(teams: Team[]) {
  return teams.find((team) => team.is_primary)?.id ?? teams[0]?.id ?? "";
}

function createEmptyPlayerForm(): PlayerMutationInput {
  return {
    name: "",
    name_en: "",
    position: "MF",
    birth_date: "",
    nationality: "대한민국",
    profile_image_url: "",
    bio: "",
  };
}

function createEmptySeasonForm(seasons: Season[], primaryTeamId: string): PlayerSeasonMutationInput {
  const defaultSeason = getDefaultSeason(seasons);

  return {
    player_id: "",
    season_id: defaultSeason?.id ?? "",
    team_id: primaryTeamId,
    season: defaultSeason?.code ?? "",
    squad_number: "",
    is_captain: false,
    is_active: true,
    is_injured: false,
    injury_detail: "",
    is_loan: false,
    loan_team: "",
    is_national_team: false,
  };
}

function createEmptyStatForm(seasonCode = ""): PlayerStatMutationInput {
  return {
    player_id: "",
    season: seasonCode,
    appearances: "0",
    goals: "0",
    assists: "0",
    rating_average: "",
    yellow_cards: "0",
    red_cards: "0",
    minutes_played: "0",
    clean_sheets: "0",
  };
}

function createPlayerForm(record: AdminPlayerRosterItem): PlayerMutationInput {
  return {
    id: record.player.id,
    name: record.player.name,
    name_en: record.player.name_en ?? "",
    position: record.player.position,
    birth_date: record.player.birth_date ?? "",
    nationality: record.player.nationality,
    profile_image_url: record.player.profile_image_url ?? "",
    bio: record.player.bio ?? "",
  };
}

function createSeasonForm(record: AdminPlayerRosterItem, fallbackTeamId: string): PlayerSeasonMutationInput {
  return {
    id: record.id,
    player_id: record.player_id,
    season_id: record.season_id ?? record.season_record?.id ?? "",
    team_id: record.team_id ?? fallbackTeamId,
    season: record.season_record?.code ?? record.season,
    squad_number: record.squad_number?.toString() ?? "",
    is_captain: record.is_captain,
    is_active: record.is_active,
    is_injured: record.is_injured,
    injury_detail: record.injury_detail ?? "",
    is_loan: record.is_loan,
    loan_team: record.loan_team ?? "",
    is_national_team: record.is_national_team,
  };
}

function createStatForm(record: AdminPlayerRosterItem): PlayerStatMutationInput {
  return {
    id: record.stat?.id,
    player_id: record.player_id,
    season: record.season_record?.code ?? record.season,
    appearances: record.stat?.appearances.toString() ?? "0",
    goals: record.stat?.goals.toString() ?? "0",
    assists: record.stat?.assists.toString() ?? "0",
    rating_average: record.stat?.rating_average?.toString() ?? "",
    yellow_cards: record.stat?.yellow_cards.toString() ?? "0",
    red_cards: record.stat?.red_cards.toString() ?? "0",
    minutes_played: record.stat?.minutes_played.toString() ?? "0",
    clean_sheets: record.stat?.clean_sheets.toString() ?? "0",
  };
}

export function PlayersAdminBoard({
  roster,
  seasons,
  seasonTeamLeagues,
  teams,
  initialSeasonFilter,
}: PlayersAdminBoardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const primaryTeamId = getPrimaryTeamId(teams);
  const primaryTeam = teams.find((team) => team.id === primaryTeamId) ?? null;
  const activeTeams = useMemo(() => teams.filter((team) => team.is_active), [teams]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [seasonFilter, setSeasonFilter] = useState(initialSeasonFilter);
  const [playerForm, setPlayerForm] = useState<PlayerMutationInput>(createEmptyPlayerForm);
  const [seasonForm, setSeasonForm] = useState<PlayerSeasonMutationInput>(() =>
    createEmptySeasonForm(seasons, primaryTeamId),
  );
  const [statForm, setStatForm] = useState<PlayerStatMutationInput>(() =>
    createEmptyStatForm(getDefaultSeason(seasons)?.code ?? ""),
  );
  const [result, setResult] = useState<AdminMutationResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const seasonFilterOptions = useMemo(
    () =>
      [{ label: "전체 시즌", value: "all" }].concat(
        seasons.map((season) => ({
          label: season.code,
          value: season.id,
        })),
      ),
    [seasons],
  );

  const seasonEditorOptions = useMemo(
    () =>
      seasons.map((season) => ({
        label: season.code,
        value: season.id,
      })),
    [seasons],
  );

  const teamOptions = useMemo(
    () =>
      activeTeams.map((team) => ({
        label: team.name,
        value: team.id,
      })),
    [activeTeams],
  );

  const defaultSeason = getDefaultSeason(seasons);
  const syncSeasonId = seasonFilter !== "all" ? seasonFilter : (defaultSeason?.id ?? "");
  const syncSeason = seasons.find((season) => season.id === syncSeasonId) ?? defaultSeason ?? null;
  const syncAssignment =
    seasonTeamLeagues.find(
      (assignment) => assignment.season_id === syncSeasonId && assignment.team_id === primaryTeamId,
    ) ?? null;
  const statsPayloadSourceKey = `${syncSeasonId}:${primaryTeamId}:${syncAssignment?.stats_payload_json ?? ""}`;
  const [statsPayloadState, setStatsPayloadState] = useState({
    sourceKey: statsPayloadSourceKey,
    value: syncAssignment?.stats_payload_json ?? "",
  });
  const statsPayloadJson =
    statsPayloadState.sourceKey === statsPayloadSourceKey
      ? statsPayloadState.value
      : (syncAssignment?.stats_payload_json ?? "");

  const rows = roster.items.map((item) => ({
    id: item.id,
    cells: [
      item.season_record?.code ?? item.season,
      item.player.name,
      item.player.position,
      item.squad_number ?? "-",
    ],
  }));

  const pushSeasonFilter = (nextSeason: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextSeason !== "all") params.set("season", nextSeason);
    else params.delete("season");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSaveStatsPayload = () => {
    if (!syncSeasonId) {
      setResult({ status: "error", message: "시즌을 먼저 선택해 주세요." });
      return;
    }

    startTransition(async () => {
      const nextResult = await saveSeasonTeamStatsPayload({
        season_id: syncSeasonId,
        team_id: primaryTeamId,
        stats_payload_json: statsPayloadJson,
      });
      setResult(nextResult);
      if (nextResult.status === "success") {
        router.refresh();
      }
    });
  };

  const handleSyncStats = () => {
    if (!syncSeasonId) {
      setResult({ status: "error", message: "시즌을 먼저 선택해 주세요." });
      return;
    }

    startTransition(async () => {
      const nextResult = await syncSeasonTeamPlayerStats({
        season_id: syncSeasonId,
        team_id: primaryTeamId,
        stats_payload_json: statsPayloadJson,
      });
      setResult(nextResult);
      if (nextResult.status === "success") {
        router.refresh();
      }
    });
  };

  const resetEditor = () => {
    setActiveId(null);
    setSelectedIds([]);
    setPlayerForm(createEmptyPlayerForm());
    setSeasonForm(createEmptySeasonForm(seasons, primaryTeamId));
    setStatForm(createEmptyStatForm(getDefaultSeason(seasons)?.code ?? ""));
    setResult(null);
  };

  const syncSeasonState = (seasonId: string) => {
    const selectedSeason = seasons.find((season) => season.id === seasonId);
    const seasonCode = selectedSeason?.code ?? "";
    setSeasonForm((current) => ({
      ...current,
      season_id: seasonId,
      season: seasonCode,
    }));
    setStatForm((current) => ({
      ...current,
      season: seasonCode,
    }));
  };

  const handleCreate = () => {
    setActiveId("new");
    setSelectedIds([]);
    setPlayerForm(createEmptyPlayerForm());
    setSeasonForm(createEmptySeasonForm(seasons, primaryTeamId));
    setStatForm(createEmptyStatForm(getDefaultSeason(seasons)?.code ?? ""));
    setResult(null);
  };

  const handleSave = () => {
    startTransition(async () => {
      if (!playerForm.id) {
        const response = await fetch("/api/admin/players/bundle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            player: playerForm,
            season: seasonForm,
            stat: statForm,
          }),
        });

        const data = (await response.json()) as AdminMutationResult;
        const nextResult = {
          status: response.ok ? "success" : "error",
          message: data.message,
          entityId: data.entityId,
        } as AdminMutationResult;

        setResult(nextResult);
        if (response.ok) {
          resetEditor();
          router.refresh();
        }
        return;
      }

      const playerResult = await savePlayer(playerForm);
      if (playerResult.status === "error") {
        setResult(playerResult);
        return;
      }

      const playerId = playerResult.entityId ?? playerForm.id;
      const nextSeasonForm = { ...seasonForm, player_id: playerId };
      const seasonResult = await savePlayerSeason(nextSeasonForm);
      if (seasonResult.status === "error") {
        setResult(seasonResult);
        return;
      }

      const nextStatForm = {
        ...statForm,
        player_id: playerId,
        season: nextSeasonForm.season,
      };
      const statResult = await savePlayerStat(nextStatForm);
      setResult(statResult);

      if (statResult.status === "success") {
        resetEditor();
        router.refresh();
      }
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedIds.length || !window.confirm(`선택한 선수 등록 ${selectedIds.length}건을 삭제할까요?`)) {
      return;
    }

    startTransition(async () => {
      let lastResult: AdminMutationResult = { status: "success", message: "삭제했습니다." };

      for (const id of selectedIds) {
        lastResult = await deletePlayerRosterEntry(id);
        if (lastResult.status === "error") break;
      }

      setResult(lastResult);
      if (lastResult.status === "success") {
        resetEditor();
        router.refresh();
      }
    });
  };

  if (activeId) {
    return (
      <SurfaceCard className="grid gap-5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-950">
              {playerForm.id ? "선수 수정" : "선수 추가"}
            </h2>
            <p className="text-sm leading-5 text-slate-600">
              시즌과 팀을 정하고, 선수 기본 정보와 상태, 스탯을 함께 입력합니다.
            </p>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={resetEditor}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            목록으로
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <AdminSelectField
            label="시즌"
            value={seasonForm.season_id}
            onChange={(event) => syncSeasonState(event.target.value)}
            options={seasonEditorOptions}
          />
          <AdminSelectField
            label="팀"
            value={seasonForm.team_id}
            onChange={(event) =>
              setSeasonForm((current) => ({ ...current, team_id: event.target.value }))
            }
            options={teamOptions}
          />
          <AdminInputField
            label="이름"
            value={playerForm.name}
            onChange={(event) => setPlayerForm((current) => ({ ...current, name: event.target.value }))}
          />
          <AdminInputField
            label="영문명"
            value={playerForm.name_en}
            onChange={(event) =>
              setPlayerForm((current) => ({ ...current, name_en: event.target.value }))
            }
          />
          <AdminSelectField
            label="포지션"
            value={playerForm.position}
            onChange={(event) =>
              setPlayerForm((current) => ({
                ...current,
                position: event.target.value as PlayerPosition,
              }))
            }
            options={[
              { label: "GK", value: "GK" },
              { label: "DF", value: "DF" },
              { label: "MF", value: "MF" },
              { label: "FW", value: "FW" },
            ]}
          />
          <AdminInputField
            label="등번호"
            type="number"
            value={seasonForm.squad_number}
            onChange={(event) =>
              setSeasonForm((current) => ({ ...current, squad_number: event.target.value }))
            }
          />
          <AdminInputField
            label="국적"
            value={playerForm.nationality}
            onChange={(event) =>
              setPlayerForm((current) => ({ ...current, nationality: event.target.value }))
            }
          />
          <AdminInputField
            label="생년월일"
            type="date"
            value={playerForm.birth_date}
            onChange={(event) =>
              setPlayerForm((current) => ({ ...current, birth_date: event.target.value }))
            }
          />
          <AdminImageUploadField
            label="프로필 이미지 업로드"
            value={playerForm.profile_image_url}
            onChange={(value) =>
              setPlayerForm((current) => ({ ...current, profile_image_url: value }))
            }
          />
        </div>

        <SurfaceCard className="grid gap-4 border border-slate-200 bg-slate-50/70 p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-950">선수 상태</h3>
            <p className="text-sm text-slate-500">현재 시즌 기준 상태를 체크해 주세요.</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <AdminCheckboxField
              label="주장 여부"
              checked={seasonForm.is_captain}
              onChange={(checked) =>
                setSeasonForm((current) => ({ ...current, is_captain: checked }))
              }
            />
            <AdminCheckboxField
              label="활성 여부"
              checked={seasonForm.is_active}
              onChange={(checked) =>
                setSeasonForm((current) => ({ ...current, is_active: checked }))
              }
            />
            <AdminCheckboxField
              label="국대 발탁 여부"
              checked={seasonForm.is_national_team}
              onChange={(checked) =>
                setSeasonForm((current) => ({ ...current, is_national_team: checked }))
              }
            />
            <AdminCheckboxField
              label="부상 여부"
              checked={seasonForm.is_injured}
              onChange={(checked) =>
                setSeasonForm((current) => ({
                  ...current,
                  is_injured: checked,
                  injury_detail: checked ? current.injury_detail : "",
                }))
              }
            />
            <AdminCheckboxField
              label="임대 여부"
              checked={seasonForm.is_loan}
              onChange={(checked) =>
                setSeasonForm((current) => ({
                  ...current,
                  is_loan: checked,
                  loan_team: checked ? current.loan_team : "",
                }))
              }
            />
          </div>

          {seasonForm.is_injured || seasonForm.is_loan ? (
            <div className="grid gap-4 md:grid-cols-2">
              {seasonForm.is_injured ? (
                <AdminTextareaField
                  label="부상 내용"
                  value={seasonForm.injury_detail}
                  onChange={(event) =>
                    setSeasonForm((current) => ({ ...current, injury_detail: event.target.value }))
                  }
                />
              ) : (
                <div />
              )}
              {seasonForm.is_loan ? (
                <AdminInputField
                  label="임대 팀"
                  value={seasonForm.loan_team}
                  onChange={(event) =>
                    setSeasonForm((current) => ({ ...current, loan_team: event.target.value }))
                  }
                />
              ) : null}
            </div>
          ) : null}
        </SurfaceCard>

        <div className="h-px bg-[color:var(--line)]" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AdminInputField
            label="출전"
            type="number"
            value={statForm.appearances}
            onChange={(event) =>
              setStatForm((current) => ({ ...current, appearances: event.target.value }))
            }
          />
          <AdminInputField
            label="득점"
            type="number"
            value={statForm.goals}
            onChange={(event) =>
              setStatForm((current) => ({ ...current, goals: event.target.value }))
            }
          />
          <AdminInputField
            label="도움"
            type="number"
            value={statForm.assists}
            onChange={(event) =>
              setStatForm((current) => ({ ...current, assists: event.target.value }))
            }
          />
          <AdminInputField
            label="평균 평점"
            type="number"
            step="0.01"
            value={statForm.rating_average}
            onChange={(event) =>
              setStatForm((current) => ({ ...current, rating_average: event.target.value }))
            }
          />
          <AdminInputField
            label="출전 시간"
            type="number"
            value={statForm.minutes_played}
            onChange={(event) =>
              setStatForm((current) => ({ ...current, minutes_played: event.target.value }))
            }
          />
          <AdminInputField
            label="경고"
            type="number"
            value={statForm.yellow_cards}
            onChange={(event) =>
              setStatForm((current) => ({ ...current, yellow_cards: event.target.value }))
            }
          />
          <AdminInputField
            label="퇴장"
            type="number"
            value={statForm.red_cards}
            onChange={(event) =>
              setStatForm((current) => ({ ...current, red_cards: event.target.value }))
            }
          />
          <AdminInputField
            label="클린시트"
            type="number"
            value={statForm.clean_sheets}
            onChange={(event) =>
              setStatForm((current) => ({ ...current, clean_sheets: event.target.value }))
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
            {isPending ? "저장 중..." : playerForm.id ? "선수 수정" : "선수 등록"}
          </button>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <div className="grid auto-rows-min gap-3">
      <SurfaceCard className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(12rem,14rem)_1fr]">
          <AdminSelectField
            label="시즌 필터"
            value={seasonFilter}
            onChange={(event) => {
              const value = event.target.value;
              setSeasonFilter(value);
              pushSeasonFilter(value);
            }}
            options={seasonFilterOptions}
          />
          <AdminTextareaField
            label="선수 스탯 JSON"
            value={statsPayloadJson}
            onChange={(event) =>
              setStatsPayloadState({
                sourceKey: statsPayloadSourceKey,
                value: event.target.value,
              })
            }
            placeholder={
              syncSeason && primaryTeam
                ? `${syncSeason.code} / ${primaryTeam.name} 응답 JSON 또는 seasonPlayerStats 배열을 붙여넣어 주세요.`
                : "선수 스탯 JSON을 붙여넣어 주세요."
            }
            className="min-h-32"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            응답 전체 JSON과 `seasonPlayerStats` 배열만 따로 복사한 JSON 둘 다 사용할 수 있습니다.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isPending || !syncSeasonId}
              onClick={handleSaveStatsPayload}
              className="rounded-full bg-slate-100 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
            >
              JSON 저장
            </button>
            <button
              type="button"
              disabled={isPending || !syncSeasonId || !statsPayloadJson.trim()}
              onClick={handleSyncStats}
              className="rounded-full bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
            >
              선수 스탯 갱신
            </button>
          </div>
        </div>
      </SurfaceCard>

      <AdminFormMessage message={result?.message ?? null} status={result?.status} />

      <AdminDataTable
        title="선수 목록"
        description={
          primaryTeam
            ? `${primaryTeam.name} 로스터를 시즌별로 관리합니다.`
            : "선수 기본 정보와 시즌별 로스터를 관리합니다."
        }
        columns={["시즌", "이름", "포지션", "등번호"]}
        rows={rows}
        selectedIds={selectedIds}
        activeId={activeId}
        onToggleRow={(id) =>
          setSelectedIds((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
          )
        }
        onToggleAll={() =>
          setSelectedIds(selectedIds.length === roster.items.length ? [] : roster.items.map((item) => item.id))
        }
        onSelectRow={(id) => {
          const selected = roster.items.find((item) => item.id === id);
          if (!selected) return;
          setActiveId(id);
          setPlayerForm(createPlayerForm(selected));
          setSeasonForm(createSeasonForm(selected, primaryTeamId));
          setStatForm(createStatForm(selected));
          setResult(null);
        }}
        onCreate={handleCreate}
        onDeleteSelected={handleDeleteSelected}
        createLabel="선수 추가"
        deleteLabel="선택 삭제"
        pending={isPending}
        currentPage={roster.page}
        totalPages={roster.totalPages}
        totalCount={roster.totalCount}
      />
    </div>
  );
}
