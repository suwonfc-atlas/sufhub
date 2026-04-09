"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  deleteSeason,
  deleteSeasonTeamLeague,
  saveSeason,
  saveSeasonTeamLeague,
  type AdminMutationResult,
  type SeasonMutationInput,
  type SeasonTeamLeagueMutationInput,
} from "@/app/admin/actions";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import {
  AdminCheckboxField,
  AdminFormMessage,
  AdminInputField,
  AdminSelectField,
} from "@/components/admin/admin-field-controls";
import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { AdminPageResult } from "@/lib/data/admin";
import type { Season, SeasonTeamLeague, Team } from "@/types";

function createEmptySeasonForm(): SeasonMutationInput {
  return {
    code: "",
    is_current: false,
    is_active: true,
  };
}

function createSeasonForm(season: Season): SeasonMutationInput {
  return {
    id: season.id,
    code: season.code,
    is_current: season.is_current,
    is_active: season.is_active,
  };
}

function createEmptyAssignmentForm(seasons: Season[], teams: Team[]): SeasonTeamLeagueMutationInput {
  return {
    season_id: seasons.find((season) => season.is_current)?.id ?? seasons[0]?.id ?? "",
    team_id: teams[0]?.id ?? "",
    league_code: "K1",
  };
}

function createAssignmentForm(assignment: SeasonTeamLeague): SeasonTeamLeagueMutationInput {
  return {
    id: assignment.id,
    season_id: assignment.season_id,
    team_id: assignment.team_id,
    league_code: assignment.league_code,
  };
}

export function SeasonsAdminBoard({
  seasons,
  teams,
  pagedSeasons,
  pagedAssignments,
  initialTab,
}: {
  seasons: Season[];
  teams: Team[];
  pagedSeasons: AdminPageResult<Season>;
  pagedAssignments: AdminPageResult<SeasonTeamLeague>;
  initialTab: "seasons" | "assignments";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"seasons" | "assignments">(initialTab);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [seasonForm, setSeasonForm] = useState<SeasonMutationInput>(createEmptySeasonForm);
  const [assignmentForm, setAssignmentForm] = useState<SeasonTeamLeagueMutationInput>(() =>
    createEmptyAssignmentForm(seasons, teams),
  );
  const [result, setResult] = useState<AdminMutationResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const seasonRows = useMemo(
    () =>
      pagedSeasons.items.map((season) => ({
        id: season.id,
        cells: [season.code, season.is_current ? "현재 시즌" : "-", season.is_active ? "활성" : "비활성"],
      })),
    [pagedSeasons.items],
  );

  const assignmentRows = useMemo(
    () =>
      pagedAssignments.items.map((assignment) => ({
        id: assignment.id,
        cells: [assignment.season?.code ?? "-", assignment.league_code, assignment.team?.name ?? "팀 미지정"],
      })),
    [pagedAssignments.items],
  );

  const seasonOptions = useMemo(
    () => [
      { label: "시즌 선택", value: "" },
      ...seasons.map((season) => ({ label: season.code, value: season.id })),
    ],
    [seasons],
  );

  const teamOptions = useMemo(
    () => [{ label: "팀 선택", value: "" }, ...teams.map((team) => ({ label: team.name, value: team.id }))],
    [teams],
  );

  const closeEditor = () => {
    setActiveId(null);
    setSelectedIds([]);
    setSeasonForm(createEmptySeasonForm());
    setAssignmentForm(createEmptyAssignmentForm(seasons, teams));
    setResult(null);
  };

  const pushTab = (tab: "seasons" | "assignments") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSaveSeason = () => {
    startTransition(async () => {
      const next = await saveSeason(seasonForm);
      setResult(next);
      if (next.status === "success") {
        closeEditor();
        router.refresh();
      }
    });
  };

  const handleSaveAssignment = () => {
    startTransition(async () => {
      const next = await saveSeasonTeamLeague(assignmentForm);
      setResult(next);
      if (next.status === "success") {
        closeEditor();
        router.refresh();
      }
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedIds.length) return;

    const label = activeTab === "seasons" ? "시즌" : "팀 배정";
    if (!window.confirm(`선택한 ${label} ${selectedIds.length}건을 삭제할까요?`)) {
      return;
    }

    startTransition(async () => {
      let lastResult: AdminMutationResult = { status: "success", message: "삭제했습니다." };

      for (const id of selectedIds) {
        lastResult =
          activeTab === "seasons" ? await deleteSeason(id) : await deleteSeasonTeamLeague(id);
        if (lastResult.status === "error") break;
      }

      setResult(lastResult);
      if (lastResult.status === "success") {
        closeEditor();
        router.refresh();
      }
    });
  };

  const isSeasonEditor = activeId !== null && activeTab === "seasons";
  const isAssignmentEditor = activeId !== null && activeTab === "assignments";

  return (
    <div className="grid auto-rows-min gap-3">
      <AdminSectionTabs
        tabs={[
          { key: "seasons", label: "시즌" },
          { key: "assignments", label: "팀 리그 배정" },
        ]}
        activeKey={activeTab}
        onChange={(key) => {
          const nextTab = key as "seasons" | "assignments";
          setActiveTab(nextTab);
          closeEditor();
          pushTab(nextTab);
        }}
      />

      {isSeasonEditor ? (
        <SurfaceCard className="grid gap-5">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-950">
                {seasonForm.id ? "시즌 수정" : "시즌 추가"}
              </h2>
              <p className="text-sm leading-5 text-slate-600">
                시즌을 먼저 등록한 뒤 팀 리그 배정과 경기 등록을 진행합니다.
              </p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={closeEditor}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              목록으로
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AdminInputField
              label="시즌 코드"
              value={seasonForm.code}
              onChange={(event) => setSeasonForm((current) => ({ ...current, code: event.target.value }))}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <AdminCheckboxField
              label="현재 시즌"
              checked={seasonForm.is_current}
              onChange={(checked) => setSeasonForm((current) => ({ ...current, is_current: checked }))}
            />
            <AdminCheckboxField
              label="활성 여부"
              checked={seasonForm.is_active}
              onChange={(checked) => setSeasonForm((current) => ({ ...current, is_active: checked }))}
            />
          </div>

          <AdminFormMessage message={result?.message ?? null} status={result?.status} />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={handleSaveSeason}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              {isPending ? "저장 중..." : seasonForm.id ? "시즌 저장" : "시즌 등록"}
            </button>
          </div>
        </SurfaceCard>
      ) : null}

      {isAssignmentEditor ? (
        <SurfaceCard className="grid gap-5">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-950">
                {assignmentForm.id ? "팀 리그 배정 수정" : "팀 리그 배정 추가"}
              </h2>
              <p className="text-sm leading-5 text-slate-600">
                시즌별로 각 팀을 K1 또는 K2에 배정합니다.
              </p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={closeEditor}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              목록으로
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <AdminSelectField
              label="시즌"
              value={assignmentForm.season_id}
              onChange={(event) =>
                setAssignmentForm((current) => ({ ...current, season_id: event.target.value }))
              }
              options={seasonOptions}
            />
            <AdminSelectField
              label="리그"
              value={assignmentForm.league_code}
              onChange={(event) =>
                setAssignmentForm((current) => ({
                  ...current,
                  league_code: event.target.value as "K1" | "K2",
                }))
              }
              options={[
                { label: "K1", value: "K1" },
                { label: "K2", value: "K2" },
              ]}
            />
            <AdminSelectField
              label="팀"
              value={assignmentForm.team_id}
              onChange={(event) =>
                setAssignmentForm((current) => ({ ...current, team_id: event.target.value }))
              }
              options={teamOptions}
            />
          </div>

          <AdminFormMessage message={result?.message ?? null} status={result?.status} />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={handleSaveAssignment}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              {isPending ? "저장 중..." : assignmentForm.id ? "배정 저장" : "배정 등록"}
            </button>
          </div>
        </SurfaceCard>
      ) : null}

      {!activeId ? (
        activeTab === "seasons" ? (
          <AdminDataTable
            title="시즌 목록"
            description="시즌을 먼저 등록한 뒤 팀 리그 배정과 경기 등록을 진행합니다."
            columns={["시즌", "현재 시즌", "상태"]}
            rows={seasonRows}
            selectedIds={selectedIds}
            activeId={activeId}
            onToggleRow={(id) =>
              setSelectedIds((current) =>
                current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
              )
            }
            onToggleAll={() =>
              setSelectedIds(
                selectedIds.length === pagedSeasons.items.length ? [] : pagedSeasons.items.map((item) => item.id),
              )
            }
            onSelectRow={(id) => {
              const selected = pagedSeasons.items.find((item) => item.id === id);
              if (!selected) return;
              setActiveId(id);
              setSeasonForm(createSeasonForm(selected));
              setResult(null);
            }}
            onCreate={() => {
              setActiveId("new");
              setSeasonForm(createEmptySeasonForm());
              setResult(null);
            }}
            onDeleteSelected={handleDeleteSelected}
            createLabel="시즌 추가"
            deleteLabel="선택 삭제"
            pending={isPending}
            currentPage={pagedSeasons.page}
            totalPages={pagedSeasons.totalPages}
            totalCount={pagedSeasons.totalCount}
          />
        ) : (
          <AdminDataTable
            title="팀 리그 배정 목록"
            description="시즌별로 각 팀을 K1 또는 K2에 배정합니다."
            columns={["시즌", "리그", "팀"]}
            rows={assignmentRows}
            selectedIds={selectedIds}
            activeId={activeId}
            onToggleRow={(id) =>
              setSelectedIds((current) =>
                current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
              )
            }
            onToggleAll={() =>
              setSelectedIds(
                selectedIds.length === pagedAssignments.items.length
                  ? []
                  : pagedAssignments.items.map((item) => item.id),
              )
            }
            onSelectRow={(id) => {
              const selected = pagedAssignments.items.find((item) => item.id === id);
              if (!selected) return;
              setActiveId(id);
              setAssignmentForm(createAssignmentForm(selected));
              setResult(null);
            }}
            onCreate={() => {
              setActiveId("new");
              setAssignmentForm(createEmptyAssignmentForm(seasons, teams));
              setResult(null);
            }}
            onDeleteSelected={handleDeleteSelected}
            createLabel="배정 추가"
            deleteLabel="선택 삭제"
            pending={isPending}
            currentPage={pagedAssignments.page}
            totalPages={pagedAssignments.totalPages}
            totalCount={pagedAssignments.totalCount}
          />
        )
      ) : null}
    </div>
  );
}
