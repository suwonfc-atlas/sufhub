"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  deleteNotice,
  saveNotice,
  saveSitePage,
  type AdminMutationResult,
  type NoticeMutationInput,
  type SitePageMutationInput,
} from "@/app/admin/actions";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import {
  AdminCheckboxField,
  AdminFormMessage,
  AdminInputField,
  AdminTextareaField,
} from "@/components/admin/admin-field-controls";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { AdminPageResult } from "@/lib/data/admin";
import type { Notice, NoticePageContent } from "@/types";

function formatDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

function createNoticePageForm(page: NoticePageContent | null): SitePageMutationInput {
  return {
    id: page?.id,
    page_key: "notices",
    title: page?.title ?? "공지사항",
    description: page?.description ?? "",
    content: page?.content ?? "",
    is_active: page?.is_active ?? true,
  };
}

function createEmptyNoticeForm(): NoticeMutationInput {
  return {
    title: "",
    content: "",
    published_at: "",
    is_active: true,
    is_pinned: false,
  };
}

function createNoticeForm(item: Notice): NoticeMutationInput {
  return {
    id: item.id,
    title: item.title,
    content: item.content ?? "",
    published_at: formatDateTimeLocal(item.published_at ?? item.created_at),
    is_active: item.is_active,
    is_pinned: item.is_pinned,
  };
}

export function NoticesAdminBoard({
  pageContent,
  notices,
  pagination,
}: {
  pageContent: NoticePageContent | null;
  notices: Notice[];
  pagination: AdminPageResult<Notice>;
}) {
  const router = useRouter();
  const [pageForm, setPageForm] = useState<SitePageMutationInput>(() => createNoticePageForm(pageContent));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [noticeForm, setNoticeForm] = useState<NoticeMutationInput>(createEmptyNoticeForm);
  const [pageResult, setPageResult] = useState<AdminMutationResult | null>(null);
  const [noticeResult, setNoticeResult] = useState<AdminMutationResult | null>(null);
  const [isPagePending, startPageTransition] = useTransition();
  const [isNoticePending, startNoticeTransition] = useTransition();

  const rows = useMemo(
    () =>
      notices.map((item) => ({
        id: item.id,
        cells: [
          item.is_pinned ? "고정" : "일반",
          item.title,
          item.published_at?.slice(0, 10) ?? item.created_at.slice(0, 10),
          item.is_active ? "노출" : "숨김",
        ],
      })),
    [notices],
  );

  const closeEditor = () => {
    setActiveId(null);
    setNoticeForm(createEmptyNoticeForm());
    setNoticeResult(null);
  };

  const handleSavePage = () => {
    startPageTransition(async () => {
      const next = await saveSitePage(pageForm);
      setPageResult(next);
      if (next.status === "success") {
        if (next.entityId) {
          setPageForm((current) => ({ ...current, id: next.entityId }));
        }
        router.refresh();
      }
    });
  };

  const handleSaveNotice = () => {
    startNoticeTransition(async () => {
      const next = await saveNotice(noticeForm);
      setNoticeResult(next);
      if (next.status === "success") {
        closeEditor();
        setSelectedIds([]);
        router.refresh();
      }
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedIds.length || !window.confirm(`선택한 공지 ${selectedIds.length}건을 삭제할까요?`)) {
      return;
    }

    startNoticeTransition(async () => {
      let lastResult: AdminMutationResult = { status: "success", message: "삭제했습니다." };
      for (const id of selectedIds) {
        lastResult = await deleteNotice(id);
        if (lastResult.status === "error") break;
      }
      setNoticeResult(lastResult);
      if (lastResult.status === "success") {
        setSelectedIds([]);
        closeEditor();
        router.refresh();
      }
    });
  };

  return (
    <div className="grid gap-6">
      <SurfaceCard className="grid gap-5">
        <div>
          <h2 className="text-xl font-black text-slate-950">공지 페이지 소개</h2>
          <p className="mt-1 text-sm text-slate-500">
            사용자 페이지 공지사항 상단에 보일 소개 문구를 관리합니다.
          </p>
        </div>
        <div className="grid gap-4">
          <AdminInputField
            label="제목"
            value={pageForm.title}
            onChange={(event) => setPageForm((current) => ({ ...current, title: event.target.value }))}
          />
          <AdminInputField
            label="설명"
            value={pageForm.description}
            onChange={(event) =>
              setPageForm((current) => ({ ...current, description: event.target.value }))
            }
          />
          <AdminTextareaField
            label="간단한 소개"
            value={pageForm.content}
            onChange={(event) => setPageForm((current) => ({ ...current, content: event.target.value }))}
          />
          <div className="self-start">
            <AdminCheckboxField
              label="노출 여부"
              checked={pageForm.is_active}
              onChange={(checked) => setPageForm((current) => ({ ...current, is_active: checked }))}
            />
          </div>
        </div>
        <AdminFormMessage message={pageResult?.message ?? null} status={pageResult?.status} />
        <div>
          <button
            type="button"
            onClick={handleSavePage}
            disabled={isPagePending}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            {isPagePending ? "저장 중..." : "소개 저장"}
          </button>
        </div>
      </SurfaceCard>

      {activeId ? (
        <SurfaceCard className="grid gap-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-slate-950">
              {noticeForm.id ? "공지사항 수정" : "공지사항 추가"}
            </h2>
            <button
              type="button"
              disabled={isNoticePending}
              onClick={closeEditor}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              목록으로
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <AdminInputField
              label="제목"
              value={noticeForm.title}
              onChange={(event) =>
                setNoticeForm((current) => ({ ...current, title: event.target.value }))
              }
              className="md:col-span-2"
            />
            <AdminInputField
              label="공지 시각"
              type="datetime-local"
              value={noticeForm.published_at}
              onChange={(event) =>
                setNoticeForm((current) => ({ ...current, published_at: event.target.value }))
              }
            />
            <div className="flex flex-wrap gap-3 self-end pb-1">
              <AdminCheckboxField
                label="고정"
                checked={noticeForm.is_pinned}
                onChange={(checked) =>
                  setNoticeForm((current) => ({ ...current, is_pinned: checked }))
                }
              />
              <AdminCheckboxField
                label="노출 여부"
                checked={noticeForm.is_active}
                onChange={(checked) =>
                  setNoticeForm((current) => ({ ...current, is_active: checked }))
                }
              />
            </div>
            <AdminTextareaField
              label="내용"
              value={noticeForm.content}
              onChange={(event) =>
                setNoticeForm((current) => ({ ...current, content: event.target.value }))
              }
              className="md:col-span-2"
            />
          </div>
          <AdminFormMessage message={noticeResult?.message ?? null} status={noticeResult?.status} />
          <div>
            <button
              type="button"
              onClick={handleSaveNotice}
              disabled={isNoticePending}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              {isNoticePending ? "저장 중..." : noticeForm.id ? "공지 저장" : "공지 등록"}
            </button>
          </div>
        </SurfaceCard>
      ) : (
        <AdminDataTable
          title="공지사항 목록"
          description="사용자 페이지에 노출할 공지사항을 관리합니다."
          columns={["구분", "제목", "공지일", "노출"]}
          rows={rows}
          selectedIds={selectedIds}
          activeId={activeId}
          onToggleRow={(id) =>
            setSelectedIds((current) =>
              current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
            )
          }
          onToggleAll={() =>
            setSelectedIds(selectedIds.length === notices.length ? [] : notices.map((item) => item.id))
          }
          onSelectRow={(id) => {
            const selected = notices.find((item) => item.id === id);
            if (!selected) return;
            setActiveId(id);
            setNoticeForm(createNoticeForm(selected));
            setNoticeResult(null);
          }}
          onCreate={() => {
            setActiveId("new");
            setSelectedIds([]);
            setNoticeForm(createEmptyNoticeForm());
            setNoticeResult(null);
          }}
          onDeleteSelected={handleDeleteSelected}
          createLabel="공지 추가"
          deleteLabel="선택 삭제"
          pending={isNoticePending}
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
        />
      )}
    </div>
  );
}
