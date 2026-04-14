"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteUserAccount, updateUserPassword, updateUserProfile } from "./actions";

type MessageState = { type: "success" | "error"; text: string } | null;

type NicknameCheckState =
  | { status: "idle"; message: "" }
  | { status: "checking"; message: string }
  | { status: "available"; message: string }
  | { status: "unavailable"; message: string };

export function MyPageProfileForm({
  nickname,
  email,
}: {
  nickname: string;
  email: string;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState({ nickname, email });
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [message, setMessage] = useState<MessageState>(null);
  const [nicknameCheck, setNicknameCheck] = useState<NicknameCheckState>({
    status: "idle",
    message: "",
  });
  const [isPending, startTransition] = useTransition();

  const isNicknameChanged = useMemo(
    () => profile.nickname.trim() !== nickname,
    [profile.nickname, nickname],
  );

  const handleNicknameCheck = async () => {
    const value = profile.nickname.trim();
    if (value.length < 2) {
      setNicknameCheck({ status: "unavailable", message: "닉네임을 2자 이상 입력해 주세요." });
      return;
    }

    if (!isNicknameChanged) {
      setNicknameCheck({ status: "available", message: "현재 사용 중인 닉네임입니다." });
      return;
    }

    setNicknameCheck({ status: "checking", message: "닉네임을 확인하고 있어요." });

    try {
      const response = await fetch(`/api/auth/check-nickname?value=${encodeURIComponent(value)}`);
      if (!response.ok) {
        throw new Error("failed");
      }
      const data = (await response.json()) as { available?: boolean };
      if (data.available) {
        setNicknameCheck({ status: "available", message: "사용 가능한 닉네임입니다." });
      } else {
        setNicknameCheck({ status: "unavailable", message: "이미 사용 중인 닉네임입니다." });
      }
    } catch {
      setNicknameCheck({ status: "unavailable", message: "닉네임 확인에 실패했습니다." });
    }
  };

  const handleProfileSave = () => {
    if (isNicknameChanged && nicknameCheck.status !== "available") {
      setMessage({ type: "error", text: "닉네임 중복 확인이 필요합니다." });
      return;
    }

    startTransition(async () => {
      const result = await updateUserProfile({
        nickname: profile.nickname,
        email: profile.email,
      });
      setMessage({ type: result.status, text: result.message });
      if (result.status === "success") {
        router.refresh();
      }
    });
  };

  const handlePasswordSave = () => {
    startTransition(async () => {
      const result = await updateUserPassword({
        current_password: passwords.current,
        next_password: passwords.next,
        next_password_confirm: passwords.confirm,
      });
      setMessage({ type: result.status, text: result.message });
      if (result.status === "success") {
        setPasswords({ current: "", next: "", confirm: "" });
      }
    });
  };

  const handleWithdraw = () => {
    if (!window.confirm("정말로 회원 탈퇴를 진행할까요?")) {
      return;
    }
    startTransition(async () => {
      const result = await deleteUserAccount({ password: withdrawPassword });
      setMessage({ type: result.status, text: result.message });
      if (result.status === "success") {
        router.push("/login");
      }
    });
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-[24px] border border-white/70 bg-white/90 px-5 py-5 shadow-[0_18px_48px_rgba(22,56,112,0.1)]">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-950">회원 정보 수정</h2>
          <p className="text-sm text-slate-600">닉네임과 이메일을 최신 정보로 바꿔주세요.</p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-slate-700">닉네임</span>
            <div className="flex gap-2">
              <input
                value={profile.nickname}
                onChange={(event) => {
                  setProfile((current) => ({ ...current, nickname: event.target.value }));
                  setNicknameCheck({ status: "idle", message: "" });
                }}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-400"
              />
              <button
                type="button"
                disabled={isPending}
                onClick={handleNicknameCheck}
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              >
                중복 확인
              </button>
            </div>
            {nicknameCheck.message ? (
              <p
                className={`text-xs ${
                  nicknameCheck.status === "available"
                    ? "text-emerald-600"
                    : nicknameCheck.status === "checking"
                      ? "text-slate-500"
                      : "text-rose-600"
                }`}
              >
                {nicknameCheck.message}
              </p>
            ) : null}
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-slate-700">이메일</span>
            <input
              value={profile.email}
              onChange={(event) =>
                setProfile((current) => ({ ...current, email: event.target.value }))
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-400"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handleProfileSave}
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            정보 저장
          </button>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/70 bg-white/90 px-5 py-5 shadow-[0_18px_48px_rgba(22,56,112,0.1)]">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-950">비밀번호 변경</h2>
          <p className="text-sm text-slate-600">현재 비밀번호와 새 비밀번호를 입력해 주세요.</p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-slate-700">현재 비밀번호</span>
            <input
              type="password"
              value={passwords.current}
              onChange={(event) =>
                setPasswords((current) => ({ ...current, current: event.target.value }))
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-400"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-slate-700">새 비밀번호</span>
            <input
              type="password"
              value={passwords.next}
              onChange={(event) =>
                setPasswords((current) => ({ ...current, next: event.target.value }))
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-400"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-slate-700">새 비밀번호 확인</span>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(event) =>
                setPasswords((current) => ({ ...current, confirm: event.target.value }))
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-400"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handlePasswordSave}
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            비밀번호 변경
          </button>
        </div>
      </section>

      <section className="rounded-[24px] border border-rose-100 bg-rose-50/60 px-5 py-5 shadow-[0_18px_48px_rgba(233,88,88,0.08)]">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-rose-700">회원 탈퇴</h2>
          <p className="text-sm text-rose-600">
            탈퇴를 진행하면 계정이 비활성화되고 다시 로그인할 수 없습니다.
          </p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-rose-700">비밀번호 확인</span>
            <input
              type="password"
              value={withdrawPassword}
              onChange={(event) => setWithdrawPassword(event.target.value)}
              className="rounded-xl border border-rose-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-rose-400"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              disabled={isPending}
              onClick={handleWithdraw}
              className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              회원 탈퇴
            </button>
          </div>
        </div>
      </section>

      {message ? (
        <div
          className={`rounded-xl px-3.5 py-2.5 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}
    </div>
  );
}
