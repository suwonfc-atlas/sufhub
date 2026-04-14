"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  clearUserSuspension,
  expelUserAccount,
  getUserSuspensions,
  saveUserAccount,
  suspendUserAccount,
  type AdminMutationResult,
  type UserExpelInput,
  type UserMutationInput,
  type UserSuspensionInput,
  type UserSuspensionRecord,
} from "@/app/admin/actions";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminCheckboxField, AdminFormMessage, AdminInputField } from "@/components/admin/admin-field-controls";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { AdminPageResult } from "@/lib/data/admin";
import { parseKstDate } from "@/lib/utils";
import type { UserAccount } from "@/types";

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(parseKstDate(value));
}

function createUserForm(user: UserAccount): UserMutationInput {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    birth_date: user.birth_date,
    level: String(user.level ?? 1),
    experience: String(user.experience ?? 0),
    is_active: user.is_active,
  };
}

export function UsersAdminBoard({
  users,
  pagination,
}: {
  users: UserAccount[];
  pagination: AdminPageResult<UserAccount>;
}) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<UserAccount | null>(null);
  const [form, setForm] = useState<UserMutationInput | null>(null);
  const [result, setResult] = useState<AdminMutationResult | null>(null);
  const [suspension, setSuspension] = useState<UserSuspensionInput>({ id: "", days: "", reason: "" });
  const [expel, setExpel] = useState<UserExpelInput>({ id: "", reason: "" });
  const [suspendResult, setSuspendResult] = useState<AdminMutationResult | null>(null);
  const [expelResult, setExpelResult] = useState<AdminMutationResult | null>(null);
  const [clearResult, setClearResult] = useState<AdminMutationResult | null>(null);
  const [suspensionHistory, setSuspensionHistory] = useState<UserSuspensionRecord[]>([]);
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(
    () =>
      users.map((user) => ({
        id: user.id,
        status:
          user.status === "expelled"
            ? "퇴출"
            : user.suspended_until && parseKstDate(user.suspended_until).getTime() > Date.now()
              ? "정지"
              : user.is_active
                ? "활성"
                : "비활성",
        cells: [
          user.username,
          user.nickname,
          user.email,
          `Lv.${user.level ?? 1}`,
          `${user.experience ?? 0}`,
          formatDateLabel(user.created_at),
          String(user.suspension_count ?? 0),
          user.status === "expelled"
            ? "퇴출"
            : user.suspended_until && parseKstDate(user.suspended_until).getTime() > Date.now()
              ? "정지"
              : user.is_active
                ? "활성"
                : "비활성",
        ],
      })),
    [users],
  );

  const closeEditor = () => {
    setActiveId(null);
    setActiveUser(null);
    setForm(null);
    setResult(null);
    setSuspendResult(null);
    setExpelResult(null);
    setClearResult(null);
    setSuspensionHistory([]);
  };

  const handleSave = () => {
    if (!form) return;
    startTransition(async () => {
      const next = await saveUserAccount(form);
      setResult(next);
      if (next.status === "success") {
        closeEditor();
        router.refresh();
      }
    });
  };

  const handleSuspend = () => {
    if (!activeUser) return;
    startTransition(async () => {
      const next = await suspendUserAccount(suspension);
      setSuspendResult(next);
      if (next.status === "success") {
        router.refresh();
      }
    });
  };

  const handleExpel = () => {
    if (!activeUser) return;
    const confirmed = window.confirm("정말로 해당 회원을 퇴출하시겠습니까?");
    if (!confirmed) return;
    startTransition(async () => {
      const next = await expelUserAccount(expel);
      setExpelResult(next);
      if (next.status === "success") {
        closeEditor();
        router.refresh();
      }
    });
  };

  const handleClearSuspension = () => {
    if (!activeUser) return;
    startTransition(async () => {
      const next = await clearUserSuspension(activeUser.id);
      setClearResult(next);
      if (next.status === "success") {
        router.refresh();
      }
    });
  };

  useEffect(() => {
    if (!activeUser) return;
    let mounted = true;
    getUserSuspensions(activeUser.id).then((list) => {
      if (mounted) {
        setSuspensionHistory(list);
      }
    });
    return () => {
      mounted = false;
    };
  }, [activeUser]);

  return activeId && form ? (
    <SurfaceCard className="grid gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-950">회원 정보 수정</h2>
          <p className="text-sm leading-5 text-slate-600">
            닉네임, 이메일, 레벨, 경험치 및 활성 상태를 수정할 수 있습니다.
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

      {activeUser ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-800">계정 상태</h3>
          <p className="mt-1 text-sm text-slate-600">
            현재 상태:{" "}
            <span className="font-semibold text-slate-900">
              {activeUser.status === "expelled"
                ? "퇴출"
                : activeUser.suspended_until && parseKstDate(activeUser.suspended_until).getTime() > Date.now()
                  ? "정지"
                  : activeUser.is_active
                    ? "활성"
                    : "비활성"}
            </span>
          </p>
          {activeUser.suspended_until ? (
            <p className="mt-1 text-xs text-slate-500">
              정지 해제 예정일: {formatDateLabel(activeUser.suspended_until)}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-slate-500">
            누적 정지 횟수: {activeUser.suspension_count ?? 0}회
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={
                isPending ||
                activeUser.status === "expelled" ||
                !activeUser.suspended_until ||
                parseKstDate(activeUser.suspended_until).getTime() <= Date.now()
              }
              onClick={handleClearSuspension}
              className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
            >
              정지 해제
            </button>
          </div>
          <AdminFormMessage message={clearResult?.message ?? null} status={clearResult?.status} />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <AdminInputField label="아이디" value={form.username} disabled />
        <AdminInputField label="생년월일" value={form.birth_date} disabled />
        <AdminInputField
          label="닉네임"
          value={form.nickname}
          onChange={(event) =>
            setForm((current) => (current ? { ...current, nickname: event.target.value } : current))
          }
        />
        <AdminInputField
          label="이메일"
          value={form.email}
          onChange={(event) =>
            setForm((current) => (current ? { ...current, email: event.target.value } : current))
          }
        />
        <AdminInputField
          label="레벨"
          value={form.level}
          onChange={(event) =>
            setForm((current) => (current ? { ...current, level: event.target.value } : current))
          }
        />
        <AdminInputField
          label="경험치"
          value={form.experience}
          onChange={(event) =>
            setForm((current) =>
              current ? { ...current, experience: event.target.value } : current,
            )
          }
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <AdminCheckboxField
          label="활성 상태"
          checked={form.is_active}
          onChange={(checked) =>
            setForm((current) => (current ? { ...current, is_active: checked } : current))
          }
        />
      </div>

      <AdminFormMessage message={result?.message ?? null} status={result?.status} />

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-800">회원 정지</h3>
          <p className="text-xs text-slate-500">정지 기간 동안 로그인과 세션이 차단됩니다.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <AdminInputField
            label="정지 일수"
            value={suspension.days}
            onChange={(event) =>
              setSuspension((current) => ({ ...current, days: event.target.value }))
            }
            placeholder="예) 7"
          />
          <AdminInputField
            label="정지 사유 (선택)"
            value={suspension.reason}
            onChange={(event) =>
              setSuspension((current) => ({ ...current, reason: event.target.value }))
            }
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={handleSuspend}
            className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white"
          >
            정지
          </button>
        </div>
        <AdminFormMessage message={suspendResult?.message ?? null} status={suspendResult?.status} />
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-800">정지 이력 (최근 3건)</h3>
          <p className="text-xs text-slate-500">가장 최근 정지 기록을 확인합니다.</p>
        </div>
        {suspensionHistory.length ? (
          <div className="space-y-2">
            {suspensionHistory.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">
                    {formatDateLabel(item.start_at)} ~ {formatDateLabel(item.end_at)}
                  </span>
                  <span>{item.days}일</span>
                </div>
                {item.reason ? (
                  <p className="mt-1 text-xs text-slate-500">사유: {item.reason}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">정지 이력이 없습니다.</p>
        )}
      </div>

      <div className="grid gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-rose-700">회원 퇴출</h3>
          <p className="text-xs text-rose-600">퇴출 시 재가입이 차단됩니다.</p>
        </div>
        <AdminInputField
          label="퇴출 사유 (선택)"
          value={expel.reason}
          onChange={(event) => setExpel((current) => ({ ...current, reason: event.target.value }))}
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={handleExpel}
            className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white"
          >
            퇴출
          </button>
        </div>
        <AdminFormMessage message={expelResult?.message ?? null} status={expelResult?.status} />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={handleSave}
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        >
          {isPending ? "저장 중..." : "회원 저장"}
        </button>
      </div>
    </SurfaceCard>
  ) : (
    <AdminDataTable
      title="회원 목록"
      description="가입한 사용자 정보를 확인하고 관리합니다."
      columns={["아이디", "닉네임", "이메일", "레벨", "경험치", "가입일", "정지횟수", "상태"]}
      rows={rows}
      selectedIds={[]}
      activeId={activeId}
      onToggleRow={() => undefined}
      onToggleAll={() => undefined}
      onSelectRow={(id) => {
        const selected = users.find((item) => item.id === id);
        if (!selected) return;
        setActiveId(id);
        setActiveUser(selected);
        setForm(createUserForm(selected));
        setSuspension({ id: selected.id, days: "", reason: "" });
        setExpel({ id: selected.id, reason: "" });
        setResult(null);
        setClearResult(null);
      }}
      onCreate={() => undefined}
      onDeleteSelected={() => undefined}
      showCreateButton={false}
      showDeleteButton={false}
      pending={isPending}
      currentPage={pagination.page}
      totalPages={pagination.totalPages}
      totalCount={pagination.totalCount}
    />
  );
}
