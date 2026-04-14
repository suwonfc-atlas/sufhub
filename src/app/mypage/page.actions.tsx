"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { logoutUser } from "@/app/auth/actions";

export function MyPageActions() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await logoutUser();
          router.push("/login");
        });
      }}
      className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
    >
      {isPending ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
