"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function AdminLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const supabase = createBrowserSupabaseClient();
          setPending(true);

          if (supabase) {
            await supabase.auth.signOut();
          }

          router.replace("/admin/login");
          router.refresh();
          setPending(false);
        });
      }}
      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
    >
      {pending ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
