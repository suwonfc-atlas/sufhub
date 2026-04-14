"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { registerUser } from "@/app/auth/actions";
import { Modal } from "@/components/ui/modal";
import { SurfaceCard } from "@/components/ui/surface-card";

type CheckState = "idle" | "checking" | "available" | "unavailable" | "error";

function formatCheckMessage(state: CheckState, label: string) {
  switch (state) {
    case "checking":
      return `${label} 확인 중...`;
    case "available":
      return `사용 가능한 ${label}입니다.`;
    case "unavailable":
      return `이미 사용 중인 ${label}입니다.`;
    case "error":
      return `${label} 확인에 실패했습니다.`;
    default:
      return "";
  }
}

export function SignupForm() {
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const [checkingUsername, setCheckingUsername] = useState<CheckState>("idle");
  const [checkingNickname, setCheckingNickname] = useState<CheckState>("idle");
  const [checkingEmail, setCheckingEmail] = useState<CheckState>("idle");
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activePolicy, setActivePolicy] = useState<"terms" | "privacy" | null>(null);
  const [checkedUsername, setCheckedUsername] = useState("");
  const [checkedNickname, setCheckedNickname] = useState("");
  const [checkedEmail, setCheckedEmail] = useState("");
  const router = useRouter();

  const handleCheck = async (type: "username" | "nickname" | "email", value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (type === "username") {
      setCheckingUsername("checking");
    } else if (type === "nickname") {
      setCheckingNickname("checking");
    } else {
      setCheckingEmail("checking");
    }

    try {
      const response = await fetch(`/api/auth/check-${type}?value=${encodeURIComponent(trimmed)}`);
      if (!response.ok) throw new Error("request failed");
      const data = (await response.json()) as { available: boolean };
      const state: CheckState = data.available ? "available" : "unavailable";
      if (type === "username") {
        setCheckingUsername(state);
        setCheckedUsername(trimmed);
      } else if (type === "nickname") {
        setCheckingNickname(state);
        setCheckedNickname(trimmed);
      } else {
        setCheckingEmail(state);
        setCheckedEmail(trimmed);
      }
    } catch {
      if (type === "username") {
        setCheckingUsername("error");
      } else if (type === "nickname") {
        setCheckingNickname("error");
      } else {
        setCheckingEmail("error");
      }
    }
  };

  return (
    <SurfaceCard className="p-6">
      <form id="signup-form" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            아이디
            <div className="flex gap-2">
              <input
                name="username"
                placeholder="아이디를 입력하세요"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                onChange={() => {
                  setCheckingUsername("idle");
                  setCheckedUsername("");
                }}
              />
              <button
                type="button"
                onClick={(event) => {
                  const input = (event.currentTarget.parentElement?.querySelector("input") as HTMLInputElement | null);
                  handleCheck("username", input?.value ?? "");
                }}
                className="min-w-[92px] rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
              >
                중복 확인
              </button>
            </div>
            {checkingUsername !== "idle" ? (
              <span className="text-xs text-slate-500">{formatCheckMessage(checkingUsername, "아이디")}</span>
            ) : null}
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            닉네임
            <div className="flex gap-2">
              <input
                name="nickname"
                placeholder="닉네임을 입력하세요"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                onChange={() => {
                  setCheckingNickname("idle");
                  setCheckedNickname("");
                }}
              />
              <button
                type="button"
                onClick={(event) => {
                  const input = (event.currentTarget.parentElement?.querySelector("input") as HTMLInputElement | null);
                  handleCheck("nickname", input?.value ?? "");
                }}
                className="min-w-[92px] rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
              >
                중복 확인
              </button>
            </div>
            {checkingNickname !== "idle" ? (
              <span className="text-xs text-slate-500">{formatCheckMessage(checkingNickname, "닉네임")}</span>
            ) : null}
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            이메일
            <div className="flex gap-2">
              <input
                type="email"
                name="email"
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                onChange={() => {
                  setCheckingEmail("idle");
                  setCheckedEmail("");
                }}
              />
              <button
                type="button"
                onClick={(event) => {
                  const input = (event.currentTarget.parentElement?.querySelector("input") as HTMLInputElement | null);
                  handleCheck("email", input?.value ?? "");
                }}
                className="min-w-[92px] rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
              >
                중복 확인
              </button>
            </div>
            {checkingEmail !== "idle" ? (
              <span className="text-xs text-slate-500">{formatCheckMessage(checkingEmail, "이메일")}</span>
            ) : (
              <span className="text-xs font-medium text-slate-500">
                아이디/비밀번호 찾기에 사용할 이메일입니다.
              </span>
            )}
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            생년월일
            <input
              type="date"
              name="birth_date"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
            비밀번호
            <input
              type="password"
              name="password"
              placeholder="8자 이상 입력"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              onChange={() => setPasswordMismatch(false)}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
            비밀번호 확인
            <input
              type="password"
              name="password_confirm"
              placeholder="비밀번호를 다시 입력하세요"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              onBlur={(event) => {
                const form = event.currentTarget.form;
                const password = form?.querySelector<HTMLInputElement>("input[name='password']");
                const current = event.currentTarget.value;
                setPasswordMismatch(Boolean(password?.value) && password?.value !== current);
              }}
            />
            {passwordMismatch ? (
              <span className="text-xs text-rose-600">비밀번호가 일치하지 않습니다.</span>
            ) : null}
          </label>
        </div>

        <label className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <input type="checkbox" name="consent" value="yes" className="mt-1 h-4 w-4 rounded border-slate-300" />
          <span>
            서비스 이용약관과 개인정보 처리방침에 동의합니다.{" "}
            <button
              type="button"
              onClick={() => setActivePolicy("terms")}
              className="font-semibold text-slate-900 underline"
            >
              이용약관
            </button>
            ,{" "}
            <button
              type="button"
              onClick={() => setActivePolicy("privacy")}
              className="font-semibold text-slate-900 underline"
            >
              개인정보 처리방침
            </button>
          </span>
        </label>

        {result ? (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-semibold ${
              result.status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {result.message}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            이미 계정이 있나요?{" "}
            <a href="/login" className="font-semibold text-slate-900 underline">
              로그인
            </a>
          </p>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              const form = document.getElementById("signup-form") as HTMLFormElement | null;
              if (!form) return;
              const formData = new FormData(form);
              const username = String(formData.get("username") ?? "").trim();
              const nickname = String(formData.get("nickname") ?? "").trim();
              const email = String(formData.get("email") ?? "").trim();

              const usernameReady =
                checkingUsername === "available" &&
                checkedUsername === username &&
                Boolean(username);
              const nicknameReady =
                checkingNickname === "available" &&
                checkedNickname === nickname &&
                Boolean(nickname);
              const emailReady =
                checkingEmail === "available" && checkedEmail === email && Boolean(email);

              if (!usernameReady || !nicknameReady || !emailReady) {
                setResult({
                  status: "error",
                  message: "아이디/닉네임/이메일 중복 확인을 완료해 주세요.",
                });
                return;
              }
            startTransition(async () => {
              const next = await registerUser(formData);
              setResult(next as { status: string; message: string });
              if (next?.status === "success") {
                router.push("/");
              }
            });
          }}
            className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {isPending ? "가입 중..." : "회원가입"}
          </button>
        </div>
      </form>

      <Modal
        isOpen={activePolicy === "terms"}
        onClose={() => setActivePolicy(null)}
        title="이용약관"
      >
        <div className="space-y-3 text-sm text-slate-700">
          <p>버전: 2026-04-13</p>
          <p>
            SuFHub는 수원FC 팬을 위한 정보 제공 서비스입니다. 회원은 본 약관과 개인정보 처리방침에
            동의한 뒤 계정을 생성할 수 있습니다.
          </p>
          <p>
            회원가입 시 제공하는 정보는 서비스 제공 및 문의 응대, 맞춤형 콘텐츠 제공을 위해
            사용됩니다. 서비스 운영상 필요한 경우 최소한의 범위에서 정보를 활용할 수 있습니다.
          </p>
          <p>
            계정 정보는 본인이 관리해야 하며, 계정 사용 중 발생한 문제에 대한 책임은 회원에게
            있습니다. 서비스는 운영 정책에 따라 계정 이용을 제한할 수 있습니다.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={activePolicy === "privacy"}
        onClose={() => setActivePolicy(null)}
        title="개인정보 처리방침"
      >
        <div className="space-y-3 text-sm text-slate-700">
          <p>버전: 2026-04-13</p>
          <p>수집 항목: 아이디, 비밀번호(해시), 이메일, 닉네임, 생년월일.</p>
          <p>
            수집 목적: 계정 관리, 서비스 제공, 문의 응대, 기능 개선을 위한 통계 분석. 비밀번호는
            단방향 해시로 저장됩니다.
          </p>
          <p>
            보관 기간: 회원 탈퇴 시 지체 없이 파기하며, 법령에 따라 보관이 필요한 경우 해당
            기간 동안 보관할 수 있습니다.
          </p>
          <p>문의: 개인정보 관련 문의는 문의하기 페이지를 통해 접수할 수 있습니다.</p>
        </div>
      </Modal>
    </SurfaceCard>
  );
}
