"use client";

import { startTransition, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { logoutUser } from "@/app/auth/actions";
import { siteConfig } from "@/lib/constants/site";
import { createPublicSupabaseClient } from "@/lib/supabase";
import type { Team } from "@/types";

import { DesktopNav } from "./desktop-nav";

type HeaderUser = { nickname: string; level: number } | null;

export function SiteHeader({ showNav = true }: { showNav?: boolean }) {
  const [primaryTeamLogoUrl, setPrimaryTeamLogoUrl] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<HeaderUser>(null);
  const [isPending, startTransitionLogout] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let active = true;

    async function loadPrimaryTeamLogo() {
      const supabase = createPublicSupabaseClient();
      if (!supabase) return;

      const { data, error } = await supabase
        .from("teams")
        .select("logo_url")
        .eq("is_primary", true)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (!active || error) return;

      startTransition(() => {
        setPrimaryTeamLogoUrl((data as Pick<Team, "logo_url"> | null)?.logo_url ?? null);
      });
    }

    void loadPrimaryTeamLogo();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!showNav) {
      return;
    }

    let active = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as {
          user: { nickname?: string | null; level?: number | null } | null;
        };
        if (!active) return;
        startTransition(() => {
          setUserInfo(
            data.user?.nickname
              ? {
                  nickname: data.user.nickname,
                  level: data.user.level ?? 1,
                }
              : null,
          );
        });
      } catch {
        if (!active) return;
        startTransition(() => {
          setUserInfo(null);
        });
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, [showNav]);

  useEffect(() => {
    if (showNav) return;
    startTransition(() => {
      setUserInfo(null);
    });
  }, [showNav]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[linear-gradient(180deg,rgba(13,27,112,0.96),rgba(21,48,146,0.92))] backdrop-blur-xl">
      <div className="app-shell flex items-center justify-between gap-6 px-4 py-3 sm:px-5 lg:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            {primaryTeamLogoUrl ? (
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-white/10 shadow-[0_14px_30px_rgba(13,27,112,0.28)]">
                <Image
                  src={primaryTeamLogoUrl}
                  alt={`${siteConfig.name} 로고`}
                  fill
                  sizes="48px"
                  className="object-contain p-1.5"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(160deg,#0d1b70,#155dfc)] text-sm font-black tracking-[0.24em] text-white shadow-[0_14px_30px_rgba(13,27,112,0.28)]">
                SW
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200">
                {siteConfig.accentName}
              </p>
              <p className="truncate text-lg font-black text-white">{siteConfig.name}</p>
            </div>
          </Link>
          {showNav ? <DesktopNav /> : null}
        </div>

        {showNav ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{userInfo?.nickname ?? "게스트"}</p>
              <p className="text-[11px] text-sky-200">Lv.{userInfo?.level ?? 1}</p>
            </div>
            <Link
              href="/mypage"
              className={`rounded-full border px-4 py-2 text-xs font-semibold !text-white ${
                pathname.startsWith("/mypage")
                  ? "border-white bg-white/20"
                  : "border-white/40"
              }`}
            >
              마이페이지
            </Link>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                startTransitionLogout(async () => {
                  await logoutUser();
                  router.push("/login");
                });
              }}
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950"
            >
              {isPending ? "로그아웃 중..." : "로그아웃"}
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
