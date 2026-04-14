"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  deleteNewsItem,
  saveNewsItem,
  type AdminMutationResult,
  type NewsMutationInput,
} from "@/app/admin/actions";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import {
  AdminCheckboxField,
  AdminFormMessage,
  AdminInputField,
} from "@/components/admin/admin-field-controls";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { AdminPageResult } from "@/lib/data/admin";
import { formatDateTimeInputValue } from "@/lib/utils";
import type { News } from "@/types";

function createEmptyNewsForm(): NewsMutationInput {
  return {
    title: "",
    source: "",
    url: "",
    thumbnail_url: "",
    published_at: "",
    is_active: true,
  };
}

function createNewsForm(item: News): NewsMutationInput {
  return {
    id: item.id,
    title: item.title,
    source: item.source ?? "",
    url: item.url,
    thumbnail_url: item.thumbnail_url ?? "",
    published_at: formatDateTimeInputValue(item.published_at ?? ""),
    is_active: item.is_active,
  };
}

export function NewsAdminBoard({
  news,
  pagination,
}: {
  news: News[];
  pagination: AdminPageResult<News>;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState<NewsMutationInput>(createEmptyNewsForm);
  const [result, setResult] = useState<AdminMutationResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPreviewPending, startPreviewTransition] = useTransition();

  const rows = useMemo(
    () =>
      news.map((item) => ({
        id: item.id,
        cells: [
          item.title,
          item.source ?? "-",
          item.published_at?.slice(0, 10) ?? "-",
          item.is_active ? "노출" : "숨김",
        ],
      })),
    [news],
  );

  const closeEditor = () => {
    setActiveId(null);
    setForm(createEmptyNewsForm());
    setResult(null);
  };

  const handleFetchPreview = () => {
    startPreviewTransition(async () => {
      const response = await fetch("/api/admin/news-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.url }),
      });

      const data = (await response.json()) as {
        message: string;
        title?: string;
        source?: string;
        thumbnail_url?: string;
      };

      setResult({ status: response.ok ? "success" : "error", message: data.message });

      if (response.ok) {
        setForm((current) => ({
          ...current,
          title: current.title || data.title || current.title,
          source: current.source || data.source || current.source,
          thumbnail_url: data.thumbnail_url || current.thumbnail_url,
        }));
      }
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      const next = await saveNewsItem(form);
      setResult(next);
      if (next.status === "success") {
        closeEditor();
        setSelectedIds([]);
        router.refresh();
      }
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedIds.length || !window.confirm(`선택한 뉴스 ${selectedIds.length}건을 삭제할까요?`)) {
      return;
    }

    startTransition(async () => {
      let lastResult: AdminMutationResult = { status: "success", message: "삭제했습니다." };
      for (const id of selectedIds) {
        lastResult = await deleteNewsItem(id);
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
        <h2 className="text-xl font-black text-slate-950">{form.id ? "뉴스 수정" : "뉴스 추가"}</h2>
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
          label="제목"
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          className="md:col-span-2"
        />
        <AdminInputField
          label="출처"
          value={form.source}
          onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}
        />
        <AdminInputField
          label="발행일"
          type="datetime-local"
          value={form.published_at}
          onChange={(event) =>
            setForm((current) => ({ ...current, published_at: event.target.value }))
          }
        />
        <AdminInputField
          label="기사 URL"
          value={form.url}
          onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
          className="md:col-span-2"
        />
        <div className="md:col-span-2 flex justify-end">
          <button
            type="button"
            onClick={handleFetchPreview}
            disabled={isPreviewPending}
            className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            {isPreviewPending ? "불러오는 중..." : "URL로 미리보기 채우기"}
          </button>
        </div>
        <AdminInputField
          label="썸네일 URL"
          value={form.thumbnail_url}
          onChange={(event) =>
            setForm((current) => ({ ...current, thumbnail_url: event.target.value }))
          }
          className="md:col-span-2"
        />
        <div className="self-start">
          <AdminCheckboxField
            label="노출 여부"
            checked={form.is_active}
            onChange={(checked) => setForm((current) => ({ ...current, is_active: checked }))}
          />
        </div>
      </div>
      <AdminFormMessage message={result?.message ?? null} status={result?.status} />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={handleSave}
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        >
          {isPending ? "저장 중..." : form.id ? "뉴스 저장" : "뉴스 등록"}
        </button>
      </div>
    </SurfaceCard>
  ) : (
    <div className="grid gap-6">
      <AdminDataTable
        title="뉴스 목록"
        description="사용자 페이지에 노출되는 기사를 관리합니다."
        columns={["제목", "출처", "발행일", "노출"]}
        rows={rows}
        selectedIds={selectedIds}
        activeId={activeId}
        onToggleRow={(id) =>
          setSelectedIds((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
          )
        }
        onToggleAll={() => setSelectedIds(selectedIds.length === news.length ? [] : news.map((item) => item.id))}
        onSelectRow={(id) => {
          const selected = news.find((item) => item.id === id);
          if (!selected) return;
          setActiveId(id);
          setForm(createNewsForm(selected));
          setResult(null);
        }}
        onCreate={() => {
          setActiveId("new");
          setSelectedIds([]);
          setForm(createEmptyNewsForm());
          setResult(null);
        }}
        onDeleteSelected={handleDeleteSelected}
        createLabel="뉴스 추가"
        deleteLabel="선택 삭제"
        pending={isPending}
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalCount={pagination.totalCount}
      />
    </div>
  );
}
