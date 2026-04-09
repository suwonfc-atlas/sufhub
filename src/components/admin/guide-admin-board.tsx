"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  deleteGuideContent,
  saveGuideContent,
  type AdminMutationResult,
  type GuideContentMutationInput,
} from "@/app/admin/actions";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import {
  AdminCheckboxField,
  AdminFormMessage,
  AdminImageUploadField,
  AdminInputField,
  AdminTextareaField,
} from "@/components/admin/admin-field-controls";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { AdminPageResult } from "@/lib/data/admin";
import type { GuideContent } from "@/types";

type CommunityCategory = "groups" | "community";

function createEmptyGuideContentForm(
  category: CommunityCategory = "groups",
): GuideContentMutationInput {
  return {
    category,
    title: "",
    description: "",
    content: "",
    image_url: "",
    external_url: "",
    sort_order: "0",
    is_active: true,
  };
}

function createGuideContentForm(content: GuideContent): GuideContentMutationInput {
  return {
    id: content.id,
    category: content.category,
    title: content.title,
    description: content.description ?? "",
    content: content.content ?? "",
    image_url: content.image_url ?? "",
    external_url: content.external_url ?? "",
    sort_order: content.sort_order.toString(),
    is_active: content.is_active,
  };
}

const contentLabels: Record<CommunityCategory, string> = {
  groups: "소모임",
  community: "커뮤니티",
};

export function GuideAdminBoard({
  guideContents,
  pagination,
  initialTab,
}: {
  guideContents: GuideContent[];
  pagination: AdminPageResult<GuideContent>;
  initialTab: CommunityCategory;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<CommunityCategory>(initialTab);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeContentId, setActiveContentId] = useState<string | null>(null);
  const [contentForm, setContentForm] = useState<GuideContentMutationInput>(
    createEmptyGuideContentForm(initialTab),
  );
  const [result, setResult] = useState<AdminMutationResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(
    () =>
      guideContents.map((content) => ({
        id: content.id,
        cells: [content.title, content.sort_order, content.is_active ? "노출" : "숨김"],
      })),
    [guideContents],
  );

  const resetEditor = (category: CommunityCategory = activeTab) => {
    setActiveContentId(null);
    setContentForm(createEmptyGuideContentForm(category));
    setResult(null);
  };

  const pushTab = (tab: CommunityCategory) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSave = () => {
    startTransition(async () => {
      const next = await saveGuideContent(contentForm);
      setResult(next);
      if (next.status === "success") {
        setSelectedIds([]);
        resetEditor(contentForm.category as CommunityCategory);
        router.refresh();
      }
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedIds.length || !window.confirm(`선택한 콘텐츠 ${selectedIds.length}건을 삭제할까요?`)) {
      return;
    }

    startTransition(async () => {
      let last: AdminMutationResult = { status: "success", message: "삭제했습니다." };

      for (const id of selectedIds) {
        last = await deleteGuideContent(id);
        if (last.status === "error") break;
      }

      setResult(last);
      if (last.status === "success") {
        setSelectedIds([]);
        resetEditor(activeTab);
        router.refresh();
      }
    });
  };

  return (
    <div className="grid auto-rows-min gap-3">
      <AdminSectionTabs
        tabs={[
          { key: "groups", label: "소모임" },
          { key: "community", label: "커뮤니티" },
        ]}
        activeKey={activeTab}
        onChange={(key) => {
          const next = key as CommunityCategory;
          setActiveTab(next);
          setSelectedIds([]);
          setActiveContentId(null);
          setContentForm(createEmptyGuideContentForm(next));
          setResult(null);
          pushTab(next);
        }}
      />

      {activeContentId ? (
        <SurfaceCard className="grid gap-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-slate-950">
              {contentForm.id ? `${contentLabels[activeTab]} 수정` : `${contentLabels[activeTab]} 추가`}
            </h2>
            <button
              type="button"
              disabled={isPending}
              onClick={() => resetEditor(activeTab)}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              목록으로
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AdminInputField
              label="제목"
              value={contentForm.title}
              onChange={(event) =>
                setContentForm((current) => ({ ...current, title: event.target.value }))
              }
            />
            <AdminInputField
              label="정렬"
              type="number"
              value={contentForm.sort_order}
              onChange={(event) =>
                setContentForm((current) => ({ ...current, sort_order: event.target.value }))
              }
            />
            <AdminInputField
              label="설명"
              value={contentForm.description}
              onChange={(event) =>
                setContentForm((current) => ({ ...current, description: event.target.value }))
              }
              className="md:col-span-2"
            />
            <AdminImageUploadField
              label="이미지 업로드"
              value={contentForm.image_url}
              onChange={(value) => setContentForm((current) => ({ ...current, image_url: value }))}
            />
            <AdminInputField
              label="링크"
              value={contentForm.external_url}
              onChange={(event) =>
                setContentForm((current) => ({ ...current, external_url: event.target.value }))
              }
            />
            <div className="self-start">
              <AdminCheckboxField
                label="노출 여부"
                checked={contentForm.is_active}
                onChange={(checked) =>
                  setContentForm((current) => ({ ...current, is_active: checked }))
                }
              />
            </div>
            <AdminTextareaField
              label="본문"
              value={contentForm.content}
              onChange={(event) =>
                setContentForm((current) => ({ ...current, content: event.target.value }))
              }
              className="md:col-span-2"
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
              {isPending ? "저장 중..." : contentForm.id ? "콘텐츠 저장" : "콘텐츠 등록"}
            </button>
          </div>
        </SurfaceCard>
      ) : (
        <AdminDataTable
          title={`${contentLabels[activeTab]} 목록`}
          description={
            activeTab === "groups" ? "소모임 정보를 관리합니다." : "커뮤니티 링크를 관리합니다."
          }
          columns={["제목", "정렬", "노출"]}
          rows={rows}
          selectedIds={selectedIds}
          activeId={activeContentId}
          onToggleRow={(id) =>
            setSelectedIds((current) =>
              current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
            )
          }
          onToggleAll={() =>
            setSelectedIds(
              selectedIds.length === guideContents.length ? [] : guideContents.map((content) => content.id),
            )
          }
          onSelectRow={(id) => {
            const selected = guideContents.find((content) => content.id === id);
            if (!selected) return;
            setActiveContentId(id);
            setContentForm(createGuideContentForm(selected));
            setResult(null);
          }}
          onCreate={() => {
            setActiveContentId("new");
            setSelectedIds([]);
            setContentForm(createEmptyGuideContentForm(activeTab));
            setResult(null);
          }}
          onDeleteSelected={handleDeleteSelected}
          createLabel="콘텐츠 추가"
          deleteLabel="선택 삭제"
          pending={isPending}
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
        />
      )}
    </div>
  );
}
