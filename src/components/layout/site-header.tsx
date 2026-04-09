"use client";

import { startTransition, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/lib/constants/site";
import { createPublicSupabaseClient } from "@/lib/supabase";
import type { Team } from "@/types";

import { DesktopNav } from "./desktop-nav";

export function SiteHeader() {
  const [primaryTeamLogoUrl, setPrimaryTeamLogoUrl] = useState<string | null>(null);

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
        setPrimaryTeamLogoUrl(((data as Pick<Team, "logo_url"> | null)?.logo_url ?? null));
      });
    }

    void loadPrimaryTeamLogo();

    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[linear-gradient(180deg,rgba(13,27,112,0.96),rgba(21,48,146,0.92))] backdrop-blur-xl">
      <div className="app-shell flex items-center justify-between gap-4 px-4 py-3 sm:px-5 lg:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          {primaryTeamLogoUrl ? (
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-white/10 shadow-[0_14px_30px_rgba(13,27,112,0.28)]">
              <Image
                src={primaryTeamLogoUrl}
                alt={`${siteConfig.name} 엠블럼`}
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
        <DesktopNav />
      </div>
    </header>
  );
}
