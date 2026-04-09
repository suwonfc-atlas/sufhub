"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  deleteTeam,
  saveTeam,
  type AdminMutationResult,
  type TeamMutationInput,
} from "@/app/admin/actions";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import {
  AdminCheckboxField,
  AdminFormMessage,
  AdminImageUploadField,
  AdminInputField,
} from "@/components/admin/admin-field-controls";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { AdminPageResult } from "@/lib/data/admin";
import type { Team } from "@/types";

function createEmptyTeamForm(): TeamMutationInput {
  return {
    name: "",
    short_name: "",
    logo_url: "",
    home_stadium_name: "",
    is_primary: false,
    is_active: true,
  };
}

function createTeamForm(team: Team): TeamMutationInput {
  return {
    id: team.id,
    name: team.name,
    short_name: team.short_name ?? "",
    logo_url: team.logo_url ?? "",
    home_stadium_name: team.home_stadium_name ?? "",
    is_primary: team.is_primary,
    is_active: team.is_active,
  };
}

export function TeamsAdminBoard({
  teams,
  pagination,
}: {
  teams: Team[];
  pagination: AdminPageResult<Team>;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState<TeamMutationInput>(createEmptyTeamForm);
  const [result, setResult] = useState<AdminMutationResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(
    () =>
      teams.map((team) => ({
        id: team.id,
        cells: [
          team.name,
          team.short_name ?? "-",
          team.home_stadium_name ?? "-",
          team.is_primary ? "기준 팀" : "-",
          team.is_active ? "활성" : "비활성",
        ],
      })),
    [teams],
  );

  const closeEditor = () => {
    setActiveId(null);
    setForm(createEmptyTeamForm());
    setResult(null);
  };

  const handleSave = () => {
    startTransition(async () => {
      const next = await saveTeam(form);
      setResult(next);

      if (next.status === "success") {
        closeEditor();
        setSelectedIds([]);
        router.refresh();
      }
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedIds.length || !window.confirm(`선택한 팀 ${selectedIds.length}건을 삭제할까요?`)) {
      return;
    }

    startTransition(async () => {
      let lastResult: AdminMutationResult = { status: "success", message: "삭제했습니다." };

      for (const id of selectedIds) {
        lastResult = await deleteTeam(id);
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

  return activeId ? (
    <SurfaceCard className="grid gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-950">{form.id ? "팀 수정" : "팀 추가"}</h2>
          <p className="text-sm leading-5 text-slate-600">
            팀 기본 정보와 홈경기장, 기준 팀 여부를 관리합니다.
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
          label="팀 이름"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
        <AdminInputField
          label="짧은 이름"
          value={form.short_name}
          onChange={(event) =>
            setForm((current) => ({ ...current, short_name: event.target.value }))
          }
        />
        <AdminInputField
          label="홈경기장"
          value={form.home_stadium_name}
          onChange={(event) =>
            setForm((current) => ({ ...current, home_stadium_name: event.target.value }))
          }
        />
        <AdminImageUploadField
          label="팀 로고 업로드"
          value={form.logo_url}
          onChange={(value) => setForm((current) => ({ ...current, logo_url: value }))}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <AdminCheckboxField
          label="수원FC 기준 팀"
          checked={form.is_primary}
          onChange={(checked) => setForm((current) => ({ ...current, is_primary: checked }))}
        />
        <AdminCheckboxField
          label="활성 여부"
          checked={form.is_active}
          onChange={(checked) => setForm((current) => ({ ...current, is_active: checked }))}
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
          {isPending ? "저장 중..." : form.id ? "팀 저장" : "팀 등록"}
        </button>
      </div>
    </SurfaceCard>
  ) : (
    <AdminDataTable
      title="팀 목록"
      description="리그와 시즌 배정에 사용할 팀 기본 정보를 관리합니다."
      columns={["팀 이름", "짧은 이름", "홈경기장", "기준 팀", "상태"]}
      rows={rows}
      selectedIds={selectedIds}
      activeId={activeId}
      onToggleRow={(id) =>
        setSelectedIds((current) =>
          current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        )
      }
      onToggleAll={() =>
        setSelectedIds(selectedIds.length === teams.length ? [] : teams.map((item) => item.id))
      }
      onSelectRow={(id) => {
        const selected = teams.find((item) => item.id === id);
        if (!selected) return;
        setActiveId(id);
        setForm(createTeamForm(selected));
        setResult(null);
      }}
      onCreate={() => {
        setActiveId("new");
        setSelectedIds([]);
        setForm(createEmptyTeamForm());
        setResult(null);
      }}
      onDeleteSelected={handleDeleteSelected}
      createLabel="팀 추가"
      deleteLabel="선택 삭제"
      pending={isPending}
      currentPage={pagination.page}
      totalPages={pagination.totalPages}
      totalCount={pagination.totalCount}
    />
  );
}
