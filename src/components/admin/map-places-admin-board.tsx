"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  deleteMapPlace,
  saveMapPlace,
  type AdminMutationResult,
  type MapPlaceMutationInput,
} from "@/app/admin/actions";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import {
  AdminCheckboxField,
  AdminFormMessage,
  AdminInputField,
  AdminSelectField,
  AdminTextareaField,
} from "@/components/admin/admin-field-controls";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { AdminPageResult } from "@/lib/data/admin";
import type { MapPlace } from "@/types";

type MapPlaceForm = MapPlaceMutationInput;

function createEmptyMapPlaceForm(): MapPlaceForm {
  return {
    name: "",
    category: "food",
    naver_place_url: "",
    address: "",
    phone: "",
    benefit_info: "",
    description: "",
    menu_items: [""],
    image_url: "",
    is_active: true,
  };
}

function createMapPlaceForm(place: MapPlace): MapPlaceForm {
  return {
    id: place.id,
    name: place.name,
    category: place.category,
    naver_place_url: place.naver_place_url ?? "",
    address: place.address ?? "",
    phone: place.phone ?? "",
    benefit_info: place.benefit_info ?? "",
    description: place.description ?? "",
    menu_items: place.menu_items.length ? place.menu_items : [""],
    image_url: place.image_url ?? "",
    is_active: place.is_active,
  };
}

export function MapPlacesAdminBoard({
  places,
  pagination,
}: {
  places: MapPlace[];
  pagination: AdminPageResult<MapPlace>;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState<MapPlaceForm>(createEmptyMapPlaceForm);
  const [result, setResult] = useState<AdminMutationResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(
    () =>
      places.map((place) => ({
        id: place.id,
        cells: [
          place.name,
          place.category,
          place.address ?? "-",
          place.phone ?? "-",
          place.is_active ? "노출" : "숨김",
        ],
      })),
    [places],
  );

  const closeEditor = () => {
    setActiveId(null);
    setForm(createEmptyMapPlaceForm());
    setResult(null);
  };

  const updateMenuItem = (index: number, value: string) => {
    setForm((current) => ({
      ...current,
      menu_items: current.menu_items.map((item, currentIndex) =>
        currentIndex === index ? value : item,
      ),
    }));
  };

  const addMenuItem = () => {
    setForm((current) => ({
      ...current,
      menu_items: [...current.menu_items, ""],
    }));
  };

  const removeMenuItem = (index: number) => {
    setForm((current) => {
      const nextItems = current.menu_items.filter((_, currentIndex) => currentIndex !== index);
      return {
        ...current,
        menu_items: nextItems.length ? nextItems : [""],
      };
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      const next = await saveMapPlace(form);
      setResult(next);
      if (next.status === "success") {
        closeEditor();
        setSelectedIds([]);
        router.refresh();
      }
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedIds.length || !window.confirm(`선택한 장소 ${selectedIds.length}건을 삭제할까요?`)) {
      return;
    }

    startTransition(async () => {
      let lastResult: AdminMutationResult = { status: "success", message: "삭제했습니다." };
      for (const id of selectedIds) {
        lastResult = await deleteMapPlace(id);
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
        <div>
          <h2 className="text-xl font-black text-slate-950">{form.id ? "장소 수정" : "장소 추가"}</h2>
          <p className="mt-1 text-sm text-slate-500">
            주소를 저장하면 위도와 경도는 자동으로 조회되어 함께 저장됩니다.
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
          label="이름"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
        <AdminSelectField
          label="카테고리"
          value={form.category}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              category: event.target.value as MapPlaceMutationInput["category"],
            }))
          }
          options={[
            { label: "경기장", value: "stadium" },
            { label: "맛집", value: "food" },
            { label: "주차", value: "parking" },
            { label: "숙소", value: "stay" },
            { label: "기타", value: "etc" },
          ]}
        />
        <AdminInputField
          label="주소"
          value={form.address}
          onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
          className="md:col-span-2"
        />
        <AdminInputField
          label="네이버 플레이스 URL"
          value={form.naver_place_url}
          onChange={(event) =>
            setForm((current) => ({ ...current, naver_place_url: event.target.value }))
          }
          className="md:col-span-2"
        />
        <AdminInputField
          label="연락처"
          value={form.phone}
          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
        />
        <AdminInputField
          label="대표 이미지 URL"
          value={form.image_url}
          onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))}
        />
        <AdminTextareaField
          label="설명"
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
          className="md:col-span-2"
        />
        <AdminTextareaField
          label="혜택 정보"
          value={form.benefit_info}
          onChange={(event) =>
            setForm((current) => ({ ...current, benefit_info: event.target.value }))
          }
          className="md:col-span-2"
        />
        <div className="grid gap-3 md:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">메뉴</p>
              <p className="text-xs text-slate-500">항목별로 한 줄씩 추가해 주세요.</p>
            </div>
            <button
              type="button"
              onClick={addMenuItem}
              className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              메뉴 추가
            </button>
          </div>
          <div className="grid gap-2">
            {form.menu_items.map((item, index) => (
              <div key={`menu-item-${index}`} className="flex items-center gap-2">
                <input
                  value={item}
                  onChange={(event) => updateMenuItem(index, event.target.value)}
                  placeholder={`메뉴 항목 ${index + 1}`}
                  className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-400"
                />
                <button
                  type="button"
                  onClick={() => removeMenuItem(index)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600"
                  aria-label={`메뉴 항목 ${index + 1} 삭제`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="self-start md:col-span-2">
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
          {isPending ? "저장 중..." : form.id ? "장소 저장" : "장소 등록"}
        </button>
      </div>
    </SurfaceCard>
  ) : (
    <div className="grid gap-6">
      <AdminDataTable
        title="캐슬클럽 장소 목록"
        description="캐슬클럽 지도와 목록에 노출되는 장소를 관리합니다."
        columns={["이름", "카테고리", "주소", "연락처", "노출"]}
        rows={rows}
        selectedIds={selectedIds}
        activeId={activeId}
        onToggleRow={(id) =>
          setSelectedIds((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
          )
        }
        onToggleAll={() =>
          setSelectedIds(selectedIds.length === places.length ? [] : places.map((item) => item.id))
        }
        onSelectRow={(id) => {
          const selected = places.find((item) => item.id === id);
          if (!selected) return;
          setActiveId(id);
          setForm(createMapPlaceForm(selected));
          setResult(null);
        }}
        onCreate={() => {
          setActiveId("new");
          setSelectedIds([]);
          setForm(createEmptyMapPlaceForm());
          setResult(null);
        }}
        onDeleteSelected={handleDeleteSelected}
        createLabel="장소 추가"
        deleteLabel="선택 삭제"
        pending={isPending}
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalCount={pagination.totalCount}
      />
    </div>
  );
}
