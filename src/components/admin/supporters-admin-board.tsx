"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  deleteSupporter,
  saveSupporter,
  type AdminMutationResult,
  type SupporterMutationInput,
} from "@/app/admin/actions";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminFormMessage, AdminInputField } from "@/components/admin/admin-field-controls";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { AdminPageResult } from "@/lib/data/admin";
import type { Supporter } from "@/types";

function createEmptySupporterForm(): SupporterMutationInput {
  return {
    name: "",
    amount: "",
    donated_at: "",
  };
}

function createSupporterForm(item: Supporter): SupporterMutationInput {
  return {
    id: item.id,
    name: item.name,
    amount: String(item.amount),
    donated_at: item.donated_at,
  };
}

function formatCurrency(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(`${value}T00:00:00+09:00`));
}

export function SupportersAdminBoard({
  supporters,
  pagination,
}: {
  supporters: Supporter[];
  pagination: AdminPageResult<Supporter>;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [supporterForm, setSupporterForm] =
    useState<SupporterMutationInput>(createEmptySupporterForm);
  const [result, setResult] = useState<AdminMutationResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(
    () =>
      supporters.map((item) => ({
        id: item.id,
        cells: [
          <span key="order" className="font-semibold text-slate-500">
            {item.display_order}번
          </span>,
          <span key="name" className="font-semibold text-slate-900">
            {item.name}
          </span>,
          <span key="amount" className="text-slate-700">
            {formatCurrency(item.amount)}
          </span>,
          <span key="donated_at" className="text-slate-700">
            {formatDate(item.donated_at)}
          </span>,
        ],
      })),
    [supporters],
  );

  const closeEditor = () => {
    setActiveId(null);
    setSupporterForm(createEmptySupporterForm());
    setResult(null);
  };

  const handleSave = () => {
    startTransition(async () => {
      const next = await saveSupporter(supporterForm);
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
      !window.confirm(`선택한 후원회 명단 ${selectedIds.length}건을 삭제할까요?`)
    ) {
      return;
    }

    startTransition(async () => {
      let lastResult: AdminMutationResult = {
        status: "success",
        message: "후원회 명단을 삭제했습니다.",
      };

      for (const id of selectedIds) {
        lastResult = await deleteSupporter(id);
        if (lastResult.status === "error") break;
      }

      setResult(lastResult);
      if (lastResult.status === "success") {
        closeEditor();
        setSelectedIds([]);
        router.refresh();
      }
    });
  };

  return (
    <div className="grid auto-rows-min gap-3">
      {activeId ? (
        <SurfaceCard className="grid max-w-5xl gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-950">
                {supporterForm.id ? "후원회 명단 수정" : "후원회 명단 추가"}
              </h2>
              <p className="text-sm text-slate-500">
                번호는 입력 순서대로 1번부터 자동 부여됩니다.
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
            <AdminInputField
              label="이름"
              value={supporterForm.name}
              onChange={(event) =>
                setSupporterForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="후원자 이름"
            />
            <AdminInputField
              label="후원금액"
              type="number"
              min="0"
              value={supporterForm.amount}
              onChange={(event) =>
                setSupporterForm((current) => ({ ...current, amount: event.target.value }))
              }
              placeholder="10000"
            />
            <AdminInputField
              label="후원날짜"
              type="date"
              value={supporterForm.donated_at}
              onChange={(event) =>
                setSupporterForm((current) => ({ ...current, donated_at: event.target.value }))
              }
            />
          </div>

          <AdminFormMessage message={result?.message ?? null} status={result?.status} />

          <div>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              {isPending
                ? "저장 중..."
                : supporterForm.id
                  ? "후원회 명단 수정"
                  : "후원회 명단 등록"}
            </button>
          </div>
        </SurfaceCard>
      ) : (
        <AdminDataTable
          title="후원회 명단"
          description="후원자 이름, 금액, 날짜를 입력 순서대로 관리합니다."
          columns={["번호", "이름", "후원금액", "후원날짜"]}
          rows={rows}
          selectedIds={selectedIds}
          activeId={activeId}
          onToggleRow={(id) =>
            setSelectedIds((current) =>
              current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
            )
          }
          onToggleAll={() =>
            setSelectedIds(
              selectedIds.length === supporters.length ? [] : supporters.map((item) => item.id),
            )
          }
          onSelectRow={(id) => {
            const selected = supporters.find((item) => item.id === id);
            if (!selected) return;
            setActiveId(id);
            setSupporterForm(createSupporterForm(selected));
            setResult(null);
          }}
          onCreate={() => {
            setActiveId("new");
            setSelectedIds([]);
            setSupporterForm(createEmptySupporterForm());
            setResult(null);
          }}
          onDeleteSelected={handleDeleteSelected}
          createLabel="후원회 추가"
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
