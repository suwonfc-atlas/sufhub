"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  loginUser,
  resetPasswordWithCode,
  sendAuthVerificationCode,
  verifyFindId,
} from "@/app/auth/actions";
import { Modal } from "@/components/ui/modal";
import { SurfaceCard } from "@/components/ui/surface-card";

export function LoginForm() {
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<"find" | "reset" | null>(null);
  const [findEmail, setFindEmail] = useState("");
  const [findCode, setFindCode] = useState("");
  const [findResult, setFindResult] = useState<{ status: string; message: string; usernames?: string[] } | null>(
    null,
  );
  const [resetUsername, setResetUsername] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
  const [resetResult, setResetResult] = useState<{ status: string; message: string } | null>(null);

  return (
    <SurfaceCard className="p-6">
      <form
        id="login-form"
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const formData = new FormData(form);
          startTransition(async () => {
            const next = await loginUser(formData);
            setResult(next as { status: string; message: string });
            if (next?.status === "success") {
              router.push("/");
            }
          });
        }}
      >
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            아이디
            <input
              name="username"
              placeholder="아이디를 입력해 주세요"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            비밀번호
            <input
              type="password"
              name="password"
              placeholder="비밀번호를 입력해 주세요"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>

        {result ? (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-semibold ${
              result.status === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {result.message}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            아직 계정이 없나요?{" "}
            <a href="/signup" className="font-semibold text-slate-900 underline">
              회원가입
            </a>
          </p>
          <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveModal("find")}
              className="rounded-full border border-slate-200 px-3 py-2"
            >
              아이디 찾기
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("reset")}
              className="rounded-full border border-slate-200 px-3 py-2"
            >
              비밀번호 재설정
            </button>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {isPending ? "로그인 중..." : "로그인"}
          </button>
        </div>
      </form>

      <Modal isOpen={activeModal === "find"} onClose={() => setActiveModal(null)} title="아이디 찾기">
        <div className="space-y-4 text-sm text-slate-700">
          <label className="grid gap-2 font-semibold">
            이메일
            <input
              type="email"
              value={findEmail}
              onChange={(event) => setFindEmail(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="가입에 사용한 이메일"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                const formData = new FormData();
                formData.set("email", findEmail);
                formData.set("purpose", "find_id");
                const next = await sendAuthVerificationCode(formData);
                setFindResult(next as { status: string; message: string });
              }}
              className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
            >
              인증번호 발송
            </button>
          </div>
          <label className="grid gap-2 font-semibold">
            인증번호
            <input
              value={findCode}
              onChange={(event) => setFindCode(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="6자리 인증번호"
            />
          </label>
          <button
            type="button"
            onClick={async () => {
              const formData = new FormData();
              formData.set("email", findEmail);
              formData.set("code", findCode);
              const next = await verifyFindId(formData);
              setFindResult(next as { status: string; message: string; usernames?: string[] });
            }}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
          >
            아이디 확인
          </button>
          <div className="min-h-[44px]">
            {findResult ? (
              <div
                className={`rounded-xl px-4 py-3 text-xs font-semibold ${
                  findResult.status === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                <p>{findResult.message}</p>
                {findResult.usernames?.length ? (
                  <ul className="mt-2 list-inside list-disc text-xs">
                    {findResult.usernames.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === "reset"} onClose={() => setActiveModal(null)} title="비밀번호 재설정">
        <div className="space-y-4 text-sm text-slate-700">
          <label className="grid gap-2 font-semibold">
            아이디
            <input
              value={resetUsername}
              onChange={(event) => setResetUsername(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="가입한 아이디"
            />
          </label>
          <label className="grid gap-2 font-semibold">
            이메일
            <input
              type="email"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="가입에 사용한 이메일"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                const formData = new FormData();
                formData.set("username", resetUsername);
                formData.set("email", resetEmail);
                formData.set("purpose", "reset_pw");
                const next = await sendAuthVerificationCode(formData);
                setResetResult(next as { status: string; message: string });
              }}
              className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
            >
              인증번호 발송
            </button>
          </div>
          <label className="grid gap-2 font-semibold">
            인증번호
            <input
              value={resetCode}
              onChange={(event) => setResetCode(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="6자리 인증번호"
            />
          </label>
          <label className="grid gap-2 font-semibold">
            새 비밀번호
            <input
              type="password"
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="8자 이상"
            />
          </label>
          <label className="grid gap-2 font-semibold">
            비밀번호 확인
            <input
              type="password"
              value={resetPasswordConfirm}
              onChange={(event) => setResetPasswordConfirm(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="비밀번호를 다시 입력"
            />
          </label>
          <button
            type="button"
            onClick={async () => {
              const formData = new FormData();
              formData.set("email", resetEmail);
              formData.set("code", resetCode);
              formData.set("password", resetPassword);
              formData.set("password_confirm", resetPasswordConfirm);
              const next = await resetPasswordWithCode(formData);
              setResetResult(next as { status: string; message: string });
            }}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
          >
            비밀번호 변경
          </button>
          <div className="min-h-[44px]">
            {resetResult ? (
              <div
                className={`rounded-xl px-4 py-3 text-xs font-semibold ${
                  resetResult.status === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {resetResult.message}
              </div>
            ) : null}
          </div>
        </div>
      </Modal>
    </SurfaceCard>
  );
}
