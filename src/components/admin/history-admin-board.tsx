"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  deleteStadium,
  deleteTicket,
  deleteTimeline,
  deleteUniform,
  saveStadium,
  saveTicket,
  saveTimeline,
  saveUniform,
  type AdminMutationResult,
  type StadiumMutationInput,
  type TicketMutationInput,
  type TimelineMutationInput,
  type UniformMutationInput,
} from "@/app/admin/actions";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import {
  AdminCheckboxField,
  AdminFormMessage,
  AdminImageUploadField,
  AdminInputField,
  AdminSelectField,
  AdminTextareaField,
} from "@/components/admin/admin-field-controls";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { AdminPageResult } from "@/lib/data/admin";
import type { HistoryTimeline, Stadium, TicketArchive, Uniform } from "@/types";

type HistoryTab = "timeline" | "stadiums" | "tickets" | "uniforms";

function createEmptyTimelineForm(): TimelineMutationInput {
  return { year: "", title: "", description: "", image_url: "", sort_order: "0", is_active: true };
}

function createTimelineForm(item: HistoryTimeline): TimelineMutationInput {
  return {
    id: item.id,
    year: item.year.toString(),
    title: item.title,
    description: item.description ?? "",
    image_url: item.image_url ?? "",
    sort_order: item.sort_order.toString(),
    is_active: item.is_active ?? true,
  };
}

function createEmptyStadiumForm(): StadiumMutationInput {
  return {
    name: "",
    archive_year: "",
    address: "",
    capacity: "",
    description: "",
    images: "",
    latitude: "",
    longitude: "",
    sort_order: "0",
    is_active: true,
    is_current: true,
  };
}

function createStadiumForm(stadium: Stadium): StadiumMutationInput {
  return {
    id: stadium.id,
    name: stadium.name,
    archive_year: stadium.archive_year?.toString() ?? "",
    address: stadium.address ?? "",
    capacity: stadium.capacity?.toString() ?? "",
    description: stadium.description ?? "",
    images: stadium.images[0] ?? "",
    latitude: stadium.latitude?.toString() ?? "",
    longitude: stadium.longitude?.toString() ?? "",
    sort_order: (stadium.sort_order ?? 0).toString(),
    is_active: stadium.is_active ?? true,
    is_current: stadium.is_current,
  };
}

function createEmptyTicketForm(): TicketMutationInput {
  return {
    title: "",
    archive_year: "",
    description: "",
    images: "",
    sort_order: "0",
    is_active: true,
  };
}

function createTicketForm(ticket: TicketArchive): TicketMutationInput {
  return {
    id: ticket.id,
    title: ticket.title,
    archive_year: ticket.archive_year?.toString() ?? "",
    description: ticket.description ?? "",
    images: ticket.images[0] ?? "",
    sort_order: (ticket.sort_order ?? 0).toString(),
    is_active: ticket.is_active ?? true,
  };
}

function createEmptyUniformForm(): UniformMutationInput {
  return {
    season: "",
    type: "home",
    manufacturer: "",
    image_url: "",
    description: "",
    sort_order: "0",
    is_active: true,
  };
}

function createUniformForm(uniform: Uniform): UniformMutationInput {
  return {
    id: uniform.id,
    season: uniform.season,
    type: uniform.type,
    manufacturer: uniform.manufacturer ?? "",
    image_url: uniform.image_url ?? "",
    description: uniform.description ?? "",
    sort_order: uniform.sort_order.toString(),
    is_active: uniform.is_active ?? true,
  };
}

interface BoardProps {
  timeline: AdminPageResult<HistoryTimeline>;
  stadiums: AdminPageResult<Stadium>;
  tickets: AdminPageResult<TicketArchive>;
  uniforms: AdminPageResult<Uniform>;
  initialTab: HistoryTab;
}

export function HistoryAdminBoard({
  timeline,
  stadiums,
  tickets,
  uniforms,
  initialTab,
}: BoardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<HistoryTab>(initialTab);

  const [timelineSelectedIds, setTimelineSelectedIds] = useState<string[]>([]);
  const [stadiumSelectedIds, setStadiumSelectedIds] = useState<string[]>([]);
  const [ticketSelectedIds, setTicketSelectedIds] = useState<string[]>([]);
  const [uniformSelectedIds, setUniformSelectedIds] = useState<string[]>([]);

  const [activeTimelineId, setActiveTimelineId] = useState<string | null>(null);
  const [activeStadiumId, setActiveStadiumId] = useState<string | null>(null);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [activeUniformId, setActiveUniformId] = useState<string | null>(null);

  const [timelineForm, setTimelineForm] = useState<TimelineMutationInput>(createEmptyTimelineForm);
  const [stadiumForm, setStadiumForm] = useState<StadiumMutationInput>(createEmptyStadiumForm);
  const [ticketForm, setTicketForm] = useState<TicketMutationInput>(createEmptyTicketForm);
  const [uniformForm, setUniformForm] = useState<UniformMutationInput>(createEmptyUniformForm);

  const [timelineResult, setTimelineResult] = useState<AdminMutationResult | null>(null);
  const [stadiumResult, setStadiumResult] = useState<AdminMutationResult | null>(null);
  const [ticketResult, setTicketResult] = useState<AdminMutationResult | null>(null);
  const [uniformResult, setUniformResult] = useState<AdminMutationResult | null>(null);

  const [isTimelinePending, startTimelineTransition] = useTransition();
  const [isStadiumPending, startStadiumTransition] = useTransition();
  const [isTicketPending, startTicketTransition] = useTransition();
  const [isUniformPending, startUniformTransition] = useTransition();

  const pushTab = (tab: HistoryTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleBack = (tab: HistoryTab) => {
    if (tab === "timeline") {
      setActiveTimelineId(null);
      setTimelineForm(createEmptyTimelineForm());
      setTimelineResult(null);
      return;
    }

    if (tab === "stadiums") {
      setActiveStadiumId(null);
      setStadiumForm(createEmptyStadiumForm());
      setStadiumResult(null);
      return;
    }

    if (tab === "tickets") {
      setActiveTicketId(null);
      setTicketForm(createEmptyTicketForm());
      setTicketResult(null);
      return;
    }

    setActiveUniformId(null);
    setUniformForm(createEmptyUniformForm());
    setUniformResult(null);
  };

  return (
    <div className="grid auto-rows-min gap-3">
      <AdminSectionTabs
        tabs={[
          { key: "timeline", label: "연표" },
          { key: "stadiums", label: "경기장" },
          { key: "tickets", label: "티켓" },
          { key: "uniforms", label: "유니폼" },
        ]}
        activeKey={activeTab}
        onChange={(key) => {
          const next = key as HistoryTab;
          setActiveTab(next);
          pushTab(next);
        }}
      />

      {activeTab === "timeline" ? (
        activeTimelineId ? (
          <SurfaceCard className="grid gap-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-slate-950">
                {timelineForm.id ? "연표 수정" : "연표 추가"}
              </h2>
              <button
                type="button"
                disabled={isTimelinePending}
                onClick={() => handleBack("timeline")}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                목록으로
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <AdminInputField
                label="연도"
                type="number"
                value={timelineForm.year}
                onChange={(event) =>
                  setTimelineForm((current) => ({ ...current, year: event.target.value }))
                }
              />
              <AdminInputField
                label="정렬"
                type="number"
                value={timelineForm.sort_order}
                onChange={(event) =>
                  setTimelineForm((current) => ({ ...current, sort_order: event.target.value }))
                }
              />
              <AdminInputField
                label="제목"
                value={timelineForm.title}
                onChange={(event) =>
                  setTimelineForm((current) => ({ ...current, title: event.target.value }))
                }
                className="md:col-span-2"
              />
              <AdminImageUploadField
                label="이미지 업로드"
                value={timelineForm.image_url}
                onChange={(value) => setTimelineForm((current) => ({ ...current, image_url: value }))}
              />
              <div className="self-start">
                <AdminCheckboxField
                  label="노출 여부"
                  checked={timelineForm.is_active}
                  onChange={(checked) =>
                    setTimelineForm((current) => ({ ...current, is_active: checked }))
                  }
                />
              </div>
              <AdminTextareaField
                label="설명"
                value={timelineForm.description}
                onChange={(event) =>
                  setTimelineForm((current) => ({ ...current, description: event.target.value }))
                }
                className="md:col-span-2"
              />
            </div>
            <AdminFormMessage message={timelineResult?.message ?? null} status={timelineResult?.status} />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isTimelinePending}
                onClick={() =>
                  startTimelineTransition(async () => {
                    const next = await saveTimeline(timelineForm);
                    setTimelineResult(next);
                    if (next.status === "success") {
                      handleBack("timeline");
                      setTimelineSelectedIds([]);
                      router.refresh();
                    }
                  })
                }
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              >
                {isTimelinePending ? "저장 중..." : timelineForm.id ? "연표 수정" : "연표 등록"}
              </button>
            </div>
          </SurfaceCard>
        ) : (
          <AdminDataTable
            title="연표 목록"
            description="히스토리 연표에 노출할 항목을 관리합니다."
            columns={["연도", "제목", "정렬", "노출"]}
            rows={timeline.items.map((item) => ({
              id: item.id,
              cells: [item.year, item.title, item.sort_order, item.is_active ? "노출" : "숨김"],
            }))}
            selectedIds={timelineSelectedIds}
            activeId={activeTimelineId}
            onToggleRow={(id) =>
              setTimelineSelectedIds((current) =>
                current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
              )
            }
            onToggleAll={() =>
              setTimelineSelectedIds(
                timelineSelectedIds.length === timeline.items.length
                  ? []
                  : timeline.items.map((item) => item.id),
              )
            }
            onSelectRow={(id) => {
              const selected = timeline.items.find((item) => item.id === id);
              if (!selected) return;
              setActiveTimelineId(id);
              setTimelineForm(createTimelineForm(selected));
              setTimelineResult(null);
            }}
            onCreate={() => {
              setActiveTimelineId("new");
              setTimelineSelectedIds([]);
              setTimelineForm(createEmptyTimelineForm());
              setTimelineResult(null);
            }}
            onDeleteSelected={() => {
              if (
                !timelineSelectedIds.length ||
                !window.confirm(`선택한 연표 ${timelineSelectedIds.length}건을 삭제할까요?`)
              ) {
                return;
              }

              startTimelineTransition(async () => {
                let last: AdminMutationResult = { status: "success", message: "삭제했습니다." };
                for (const id of timelineSelectedIds) {
                  last = await deleteTimeline(id);
                  if (last.status === "error") break;
                }
                setTimelineResult(last);
                if (last.status === "success") {
                  setTimelineSelectedIds([]);
                  handleBack("timeline");
                  router.refresh();
                }
              });
            }}
            createLabel="연표 추가"
            deleteLabel="선택 삭제"
            pending={isTimelinePending}
            currentPage={timeline.page}
            totalPages={timeline.totalPages}
            totalCount={timeline.totalCount}
          />
        )
      ) : null}

      {activeTab === "stadiums" ? (
        activeStadiumId ? (
          <SurfaceCard className="grid gap-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-slate-950">
                {stadiumForm.id ? "경기장 수정" : "경기장 추가"}
              </h2>
              <button
                type="button"
                disabled={isStadiumPending}
                onClick={() => handleBack("stadiums")}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                목록으로
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <AdminInputField
                label="이름"
                value={stadiumForm.name}
                onChange={(event) =>
                  setStadiumForm((current) => ({ ...current, name: event.target.value }))
                }
              />
              <AdminInputField
                label="연도"
                type="number"
                value={stadiumForm.archive_year}
                onChange={(event) =>
                  setStadiumForm((current) => ({ ...current, archive_year: event.target.value }))
                }
              />
              <AdminTextareaField
                label="설명"
                value={stadiumForm.description}
                onChange={(event) =>
                  setStadiumForm((current) => ({ ...current, description: event.target.value }))
                }
                className="md:col-span-2"
              />
              <div className="md:col-span-2">
                <AdminImageUploadField
                  label="이미지 업로드"
                  value={stadiumForm.images}
                  onChange={(value) => setStadiumForm((current) => ({ ...current, images: value }))}
                />
              </div>
            </div>
            <AdminFormMessage message={stadiumResult?.message ?? null} status={stadiumResult?.status} />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isStadiumPending}
                onClick={() =>
                  startStadiumTransition(async () => {
                    const next = await saveStadium(stadiumForm);
                    setStadiumResult(next);
                    if (next.status === "success") {
                      handleBack("stadiums");
                      setStadiumSelectedIds([]);
                      router.refresh();
                    }
                  })
                }
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              >
                {isStadiumPending ? "저장 중..." : stadiumForm.id ? "경기장 수정" : "경기장 등록"}
              </button>
            </div>
          </SurfaceCard>
        ) : (
          <AdminDataTable
            title="경기장 목록"
            description="이미지 1장 기준으로 경기장 아카이브 항목을 관리합니다."
            columns={["제목", "연도", "이미지"]}
            rows={stadiums.items.map((item) => ({
              id: item.id,
              cells: [item.name, item.archive_year ?? "-", item.images[0] ? "등록됨" : "-"],
            }))}
            selectedIds={stadiumSelectedIds}
            activeId={activeStadiumId}
            onToggleRow={(id) =>
              setStadiumSelectedIds((current) =>
                current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
              )
            }
            onToggleAll={() =>
              setStadiumSelectedIds(
                stadiumSelectedIds.length === stadiums.items.length
                  ? []
                  : stadiums.items.map((item) => item.id),
              )
            }
            onSelectRow={(id) => {
              const selected = stadiums.items.find((item) => item.id === id);
              if (!selected) return;
              setActiveStadiumId(id);
              setStadiumForm(createStadiumForm(selected));
              setStadiumResult(null);
            }}
            onCreate={() => {
              setActiveStadiumId("new");
              setStadiumSelectedIds([]);
              setStadiumForm(createEmptyStadiumForm());
              setStadiumResult(null);
            }}
            onDeleteSelected={() => {
              if (
                !stadiumSelectedIds.length ||
                !window.confirm(`선택한 경기장 ${stadiumSelectedIds.length}건을 삭제할까요?`)
              ) {
                return;
              }

              startStadiumTransition(async () => {
                let last: AdminMutationResult = { status: "success", message: "삭제했습니다." };
                for (const id of stadiumSelectedIds) {
                  last = await deleteStadium(id);
                  if (last.status === "error") break;
                }
                setStadiumResult(last);
                if (last.status === "success") {
                  setStadiumSelectedIds([]);
                  handleBack("stadiums");
                  router.refresh();
                }
              });
            }}
            createLabel="경기장 추가"
            deleteLabel="선택 삭제"
            pending={isStadiumPending}
            currentPage={stadiums.page}
            totalPages={stadiums.totalPages}
            totalCount={stadiums.totalCount}
          />
        )
      ) : null}

      {activeTab === "tickets" ? (
        activeTicketId ? (
          <SurfaceCard className="grid gap-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-slate-950">
                {ticketForm.id ? "티켓 수정" : "티켓 추가"}
              </h2>
              <button
                type="button"
                disabled={isTicketPending}
                onClick={() => handleBack("tickets")}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                목록으로
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <AdminInputField
                label="제목"
                value={ticketForm.title}
                onChange={(event) =>
                  setTicketForm((current) => ({ ...current, title: event.target.value }))
                }
              />
              <AdminInputField
                label="연도"
                type="number"
                value={ticketForm.archive_year}
                onChange={(event) =>
                  setTicketForm((current) => ({ ...current, archive_year: event.target.value }))
                }
              />
              <div className="md:col-span-2">
                <AdminImageUploadField
                  label="이미지 업로드"
                  value={ticketForm.images}
                  onChange={(value) => setTicketForm((current) => ({ ...current, images: value }))}
                />
              </div>
              <AdminTextareaField
                label="메모"
                value={ticketForm.description}
                onChange={(event) =>
                  setTicketForm((current) => ({ ...current, description: event.target.value }))
                }
                className="md:col-span-2"
              />
            </div>
            <AdminFormMessage message={ticketResult?.message ?? null} status={ticketResult?.status} />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isTicketPending}
                onClick={() =>
                  startTicketTransition(async () => {
                    const next = await saveTicket(ticketForm);
                    setTicketResult(next);
                    if (next.status === "success") {
                      handleBack("tickets");
                      setTicketSelectedIds([]);
                      router.refresh();
                    }
                  })
                }
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              >
                {isTicketPending ? "저장 중..." : ticketForm.id ? "티켓 수정" : "티켓 등록"}
              </button>
            </div>
          </SurfaceCard>
        ) : (
          <AdminDataTable
            title="티켓 목록"
            description="연도별 티켓 아카이브 이미지를 관리합니다."
            columns={["제목", "연도", "이미지"]}
            rows={tickets.items.map((item) => ({
              id: item.id,
              cells: [item.title, item.archive_year ?? "-", item.images[0] ? "등록됨" : "-"],
            }))}
            selectedIds={ticketSelectedIds}
            activeId={activeTicketId}
            onToggleRow={(id) =>
              setTicketSelectedIds((current) =>
                current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
              )
            }
            onToggleAll={() =>
              setTicketSelectedIds(
                ticketSelectedIds.length === tickets.items.length
                  ? []
                  : tickets.items.map((item) => item.id),
              )
            }
            onSelectRow={(id) => {
              const selected = tickets.items.find((item) => item.id === id);
              if (!selected) return;
              setActiveTicketId(id);
              setTicketForm(createTicketForm(selected));
              setTicketResult(null);
            }}
            onCreate={() => {
              setActiveTicketId("new");
              setTicketSelectedIds([]);
              setTicketForm(createEmptyTicketForm());
              setTicketResult(null);
            }}
            onDeleteSelected={() => {
              if (
                !ticketSelectedIds.length ||
                !window.confirm(`선택한 티켓 ${ticketSelectedIds.length}건을 삭제할까요?`)
              ) {
                return;
              }

              startTicketTransition(async () => {
                let last: AdminMutationResult = { status: "success", message: "삭제했습니다." };
                for (const id of ticketSelectedIds) {
                  last = await deleteTicket(id);
                  if (last.status === "error") break;
                }
                setTicketResult(last);
                if (last.status === "success") {
                  setTicketSelectedIds([]);
                  handleBack("tickets");
                  router.refresh();
                }
              });
            }}
            createLabel="티켓 추가"
            deleteLabel="선택 삭제"
            pending={isTicketPending}
            currentPage={tickets.page}
            totalPages={tickets.totalPages}
            totalCount={tickets.totalCount}
          />
        )
      ) : null}

      {activeTab === "uniforms" ? (
        activeUniformId ? (
          <SurfaceCard className="grid gap-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-slate-950">
                {uniformForm.id ? "유니폼 수정" : "유니폼 추가"}
              </h2>
              <button
                type="button"
                disabled={isUniformPending}
                onClick={() => handleBack("uniforms")}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                목록으로
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <AdminInputField
                label="시즌"
                value={uniformForm.season}
                onChange={(event) =>
                  setUniformForm((current) => ({ ...current, season: event.target.value }))
                }
              />
              <AdminSelectField
                label="타입"
                value={uniformForm.type}
                onChange={(event) =>
                  setUniformForm((current) => ({
                    ...current,
                    type: event.target.value as UniformMutationInput["type"],
                  }))
                }
                options={[
                  { label: "홈", value: "home" },
                  { label: "원정", value: "away" },
                  { label: "GK1", value: "gk-home" },
                  { label: "GK2", value: "gk-away" },
                  { label: "스페셜 1", value: "special" },
                  { label: "스페셜 2", value: "special-2" },
                ]}
              />
              <AdminInputField
                label="제조사"
                value={uniformForm.manufacturer}
                onChange={(event) =>
                  setUniformForm((current) => ({ ...current, manufacturer: event.target.value }))
                }
              />
              <AdminImageUploadField
                label="이미지 업로드"
                value={uniformForm.image_url}
                onChange={(value) => setUniformForm((current) => ({ ...current, image_url: value }))}
              />
              <AdminInputField
                label="정렬"
                type="number"
                value={uniformForm.sort_order}
                onChange={(event) =>
                  setUniformForm((current) => ({ ...current, sort_order: event.target.value }))
                }
              />
              <div className="self-start">
                <AdminCheckboxField
                  label="노출 여부"
                  checked={uniformForm.is_active}
                  onChange={(checked) =>
                    setUniformForm((current) => ({ ...current, is_active: checked }))
                  }
                />
              </div>
              <AdminTextareaField
                label="설명"
                value={uniformForm.description}
                onChange={(event) =>
                  setUniformForm((current) => ({ ...current, description: event.target.value }))
                }
                className="md:col-span-2"
              />
            </div>
            <AdminFormMessage message={uniformResult?.message ?? null} status={uniformResult?.status} />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isUniformPending}
                onClick={() =>
                  startUniformTransition(async () => {
                    const next = await saveUniform(uniformForm);
                    setUniformResult(next);
                    if (next.status === "success") {
                      handleBack("uniforms");
                      setUniformSelectedIds([]);
                      router.refresh();
                    }
                  })
                }
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              >
                {isUniformPending ? "저장 중..." : uniformForm.id ? "유니폼 수정" : "유니폼 등록"}
              </button>
            </div>
          </SurfaceCard>
        ) : (
          <AdminDataTable
            title="유니폼 목록"
            description="유니폼 히스토리에 노출할 기록을 관리합니다."
            columns={["시즌", "타입", "제조사", "노출"]}
            rows={uniforms.items.map((item) => ({
              id: item.id,
              cells: [item.season, item.type, item.manufacturer ?? "-", item.is_active ? "노출" : "숨김"],
            }))}
            selectedIds={uniformSelectedIds}
            activeId={activeUniformId}
            onToggleRow={(id) =>
              setUniformSelectedIds((current) =>
                current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
              )
            }
            onToggleAll={() =>
              setUniformSelectedIds(
                uniformSelectedIds.length === uniforms.items.length
                  ? []
                  : uniforms.items.map((item) => item.id),
              )
            }
            onSelectRow={(id) => {
              const selected = uniforms.items.find((item) => item.id === id);
              if (!selected) return;
              setActiveUniformId(id);
              setUniformForm(createUniformForm(selected));
              setUniformResult(null);
            }}
            onCreate={() => {
              setActiveUniformId("new");
              setUniformSelectedIds([]);
              setUniformForm(createEmptyUniformForm());
              setUniformResult(null);
            }}
            onDeleteSelected={() => {
              if (
                !uniformSelectedIds.length ||
                !window.confirm(`선택한 유니폼 ${uniformSelectedIds.length}건을 삭제할까요?`)
              ) {
                return;
              }

              startUniformTransition(async () => {
                let last: AdminMutationResult = { status: "success", message: "삭제했습니다." };
                for (const id of uniformSelectedIds) {
                  last = await deleteUniform(id);
                  if (last.status === "error") break;
                }
                setUniformResult(last);
                if (last.status === "success") {
                  setUniformSelectedIds([]);
                  handleBack("uniforms");
                  router.refresh();
                }
              });
            }}
            createLabel="유니폼 추가"
            deleteLabel="선택 삭제"
            pending={isUniformPending}
            currentPage={uniforms.page}
            totalPages={uniforms.totalPages}
            totalCount={uniforms.totalCount}
          />
        )
      ) : null}
    </div>
  );
}
