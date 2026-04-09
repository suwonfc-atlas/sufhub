"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  deleteChant,
  saveChant,
  type AdminMutationResult,
  type ChantMutationInput,
} from "@/app/admin/actions";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import {
  AdminCheckboxField,
  AdminFileUploadField,
  AdminFormMessage,
  AdminInputField,
  AdminSelectField,
  AdminTextareaField,
} from "@/components/admin/admin-field-controls";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { AdminPageResult } from "@/lib/data/admin";
import type { Chant } from "@/types";

function createEmptyChantForm(): ChantMutationInput {
  return {
    title: "",
    lyrics: "",
    audio_url: "",
    duration: "",
    category: "general",
    description: "",
    sort_order: "0",
    is_active: true,
  };
}

function createChantForm(chant: Chant): ChantMutationInput {
  return {
    id: chant.id,
    title: chant.title,
    lyrics: chant.lyrics ?? "",
    audio_url: chant.audio_url ?? "",
    duration: chant.duration?.toString() ?? "",
    category: chant.category,
    description: chant.description ?? "",
    sort_order: chant.sort_order.toString(),
    is_active: chant.is_active,
  };
}

export function ChantsAdminBoard({
  chants,
  pagination,
}: {
  chants: Chant[];
  pagination: AdminPageResult<Chant>;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState<ChantMutationInput>(createEmptyChantForm);
  const [result, setResult] = useState<AdminMutationResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(
    () =>
      chants.map((chant) => ({
        id: chant.id,
        cells: [chant.title, chant.category, chant.duration ?? "-", chant.is_active ? "노출" : "숨김"],
      })),
    [chants],
  );

  const closeEditor = () => {
    setActiveId(null);
    setForm(createEmptyChantForm());
    setResult(null);
  };

  const handleSave = () => {
    startTransition(async () => {
      const next = await saveChant(form);
      setResult(next);
      if (next.status === "success") {
        closeEditor();
        setSelectedIds([]);
        router.refresh();
      }
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedIds.length || !window.confirm(`선택한 응원가 ${selectedIds.length}건을 삭제할까요?`)) {
      return;
    }

    startTransition(async () => {
      let lastResult: AdminMutationResult = { status: "success", message: "삭제했습니다." };
      for (const id of selectedIds) {
        lastResult = await deleteChant(id);
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
        <h2 className="text-xl font-black text-slate-950">{form.id ? "응원가 수정" : "응원가 추가"}</h2>
        <button type="button" disabled={isPending} onClick={closeEditor} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">목록으로</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <AdminInputField label="제목" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
        <AdminSelectField
          label="카테고리"
          value={form.category}
          onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ChantMutationInput["category"] }))}
          options={[
            { label: "일반", value: "general" },
            { label: "선수별", value: "player" },
            { label: "상황별", value: "situation" },
          ]}
        />
        <AdminFileUploadField label="오디오 업로드" value={form.audio_url} onChange={(value) => setForm((current) => ({ ...current, audio_url: value }))} accept="audio/*" bucket="audio" emptyLabel="오디오 파일 업로드" />
        <AdminInputField label="재생 길이(초)" type="number" value={form.duration} onChange={(event) => setForm((current) => ({ ...current, duration: event.target.value }))} />
        <AdminInputField label="정렬" type="number" value={form.sort_order} onChange={(event) => setForm((current) => ({ ...current, sort_order: event.target.value }))} />
        <div className="self-start">
          <AdminCheckboxField label="노출 여부" checked={form.is_active} onChange={(checked) => setForm((current) => ({ ...current, is_active: checked }))} />
        </div>
        <AdminTextareaField label="설명" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="md:col-span-2" />
        <AdminTextareaField label="가사" value={form.lyrics} onChange={(event) => setForm((current) => ({ ...current, lyrics: event.target.value }))} className="md:col-span-2" />
      </div>
      <AdminFormMessage message={result?.message ?? null} status={result?.status} />
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={isPending} onClick={handleSave} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          {isPending ? "저장 중..." : form.id ? "응원가 저장" : "응원가 등록"}
        </button>
      </div>
    </SurfaceCard>
  ) : (
    <div className="grid gap-6">
      <AdminDataTable
        title="응원가 목록"
        description="응원가 페이지에 노출되는 곡 메타데이터를 관리합니다."
        columns={["제목", "카테고리", "길이", "노출"]}
        rows={rows}
        selectedIds={selectedIds}
        activeId={activeId}
        onToggleRow={(id) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}
        onToggleAll={() => setSelectedIds(selectedIds.length === chants.length ? [] : chants.map((item) => item.id))}
        onSelectRow={(id) => {
          const selected = chants.find((item) => item.id === id);
          if (!selected) return;
          setActiveId(id);
          setForm(createChantForm(selected));
          setResult(null);
        }}
        onCreate={() => {
          setActiveId("new");
          setSelectedIds([]);
          setForm(createEmptyChantForm());
          setResult(null);
        }}
        onDeleteSelected={handleDeleteSelected}
        createLabel="응원가 추가"
        deleteLabel="선택 삭제"
        pending={isPending}
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalCount={pagination.totalCount}
      />
    </div>
  );
}
