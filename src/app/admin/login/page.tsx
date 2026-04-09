"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { SurfaceCard } from "@/components/ui/surface-card";
import { isAdminUser } from "@/lib/auth/admin";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const nextUrl = searchParams.get("next") || "/admin";
  const initialMessage = useMemo(() => {
    if (searchParams.get("error") === "forbidden") {
      return "관리자 권한이 없는 계정입니다. `app_metadata.role = admin` 설정을 다시 확인해 주세요.";
    }

    return null;
  }, [searchParams]);

  const handleSubmit = async () => {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setMessage("Supabase 환경 변수가 없어 로그인할 수 없습니다.");
      return;
    }

    setPending(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setPending(false);
      return;
    }

    if (!isAdminUser(data.user)) {
      await supabase.auth.signOut();
      setMessage("관리자 권한이 없는 계정입니다.");
      setPending(false);
      return;
    }

    startTransition(() => {
      router.replace(nextUrl);
      router.refresh();
    });
  };

  return (
    <div className="mx-auto grid w-full max-w-xl gap-6">
      <SurfaceCard className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
          Admin Auth
        </p>
        <h1 className="text-3xl font-black text-slate-950">관리자 로그인</h1>
        <p className="text-sm leading-7 text-slate-600">
          Supabase Auth의 이메일/비밀번호 로그인과 관리자 권한 검사를 연결했습니다. 로그인 후에는
          `app_metadata.role = admin` 계정만 `/admin`에 접근할 수 있습니다.
        </p>
      </SurfaceCard>
      <SurfaceCard className="space-y-4">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">이메일</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-400"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-400"
          />
        </label>
        {initialMessage || message ? (
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700">
            {message ?? initialMessage}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={handleSubmit}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
          >
            {pending ? "로그인 중..." : "관리자 로그인"}
          </button>
        </div>
      </SurfaceCard>
    </div>
  );
}
