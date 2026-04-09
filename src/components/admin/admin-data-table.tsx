"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";

interface AdminDataTableRow {
  id: string;
  cells: ReactNode[];
}

interface AdminDataTableProps {
  title: string;
  description?: string;
  columns: string[];
  rows: AdminDataTableRow[];
  selectedIds: string[];
  activeId?: string | null;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  onSelectRow: (id: string) => void;
  onCreate: () => void;
  onDeleteSelected: () => void;
  createLabel?: string;
  deleteLabel?: string;
  pending?: boolean;
  emptyMessage?: string;
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  pageParam?: string;
  showCreateButton?: boolean;
  showDeleteButton?: boolean;
}

const PAGE_SIZE = 10;

export function AdminDataTable({
  title,
  description,
  columns,
  rows,
  selectedIds,
  activeId = null,
  onToggleRow,
  onToggleAll,
  onSelectRow,
  onCreate,
  onDeleteSelected,
  createLabel = "추가",
  deleteLabel = "선택 삭제",
  pending = false,
  emptyMessage = "표시할 항목이 없습니다.",
  currentPage,
  totalPages,
  totalCount,
  pageParam = "page",
  showCreateButton = true,
  showDeleteButton = true,
}: AdminDataTableProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clientPage, setClientPage] = useState(1);

  const isServerPaginated =
    typeof currentPage === "number" &&
    typeof totalPages === "number" &&
    typeof totalCount === "number";

  const clientTotalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safeCurrentPage = isServerPaginated
    ? Math.min(Math.max(1, currentPage), Math.max(1, totalPages))
    : Math.min(clientPage, clientTotalPages);

  const pagedRows = useMemo(() => {
    if (isServerPaginated) {
      return rows;
    }

    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return rows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [isServerPaginated, rows, safeCurrentPage]);

  const resolvedTotalCount = isServerPaginated ? totalCount : rows.length;
  const resolvedTotalPages = isServerPaginated ? totalPages : clientTotalPages;
  const pageStart = resolvedTotalCount ? (safeCurrentPage - 1) * PAGE_SIZE + 1 : 0;
  const pageEnd = resolvedTotalCount
    ? Math.min(safeCurrentPage * PAGE_SIZE, resolvedTotalCount)
    : 0;
  const allSelected =
    pagedRows.length > 0 && pagedRows.every((row) => selectedIds.includes(row.id));

  const movePage = (nextPage: number) => {
    if (isServerPaginated) {
      const params = new URLSearchParams(searchParams.toString());
      params.set(pageParam, String(nextPage));
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      return;
    }

    setClientPage(nextPage);
  };

  return (
    <SurfaceCard className="overflow-hidden p-0">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          {description ? (
            <p className="text-sm leading-5 text-slate-600">{description}</p>
          ) : null}
        </div>
        {showCreateButton || showDeleteButton ? (
          <div className="flex flex-wrap gap-2">
            {showCreateButton ? (
              <button
                type="button"
                onClick={onCreate}
                disabled={pending}
                className="rounded-full bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
              >
                {createLabel}
              </button>
            ) : null}
            {showDeleteButton ? (
              <button
                type="button"
                onClick={onDeleteSelected}
                disabled={pending || selectedIds.length === 0}
                className="rounded-full bg-rose-100 px-3.5 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-200 disabled:opacity-50"
              >
                {deleteLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-950 text-sm text-white">
            <tr>
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  className="h-4 w-4 rounded border-white/30 bg-transparent"
                  aria-label="전체 선택"
                />
              </th>
              {columns.map((column) => (
                <th key={column} className="px-3 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.length ? (
              pagedRows.map((row) => {
                const checked = selectedIds.includes(row.id);
                const active = activeId === row.id;

                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-t border-slate-100 text-sm text-slate-700",
                      active && "bg-sky-50/70",
                    )}
                  >
                    <td className="px-3 py-3 align-middle">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleRow(row.id)}
                        className="h-4 w-4 rounded border-slate-300"
                        aria-label={`${title} 선택`}
                      />
                    </td>
                    {row.cells.map((cell, index) => (
                      <td key={`${row.id}-${index}`} className="px-3 py-3 align-middle">
                        <button
                          type="button"
                          onClick={() => onSelectRow(row.id)}
                          className="block w-full text-left"
                        >
                          {cell}
                        </button>
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {resolvedTotalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
          <p className="text-sm text-slate-500">
            {pageStart}-{pageEnd} / {resolvedTotalCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => movePage(Math.max(1, safeCurrentPage - 1))}
              disabled={safeCurrentPage === 1}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
            >
              이전
            </button>
            <span className="text-sm font-semibold text-slate-700">
              {safeCurrentPage} / {resolvedTotalPages}
            </span>
            <button
              type="button"
              onClick={() => movePage(Math.min(resolvedTotalPages, safeCurrentPage + 1))}
              disabled={safeCurrentPage === resolvedTotalPages}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      ) : null}
    </SurfaceCard>
  );
}
