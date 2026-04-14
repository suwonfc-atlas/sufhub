"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpen, Home, Menu, MessageCircle, Music2, Trophy, X } from "lucide-react";

import { moreNavigation } from "@/lib/constants/site";
import { cn, isPathActive } from "@/lib/utils";

const tabs = [
  { href: "/", label: "홈", icon: Home, match: [] },
  { href: "/matches/schedule", label: "경기", icon: Trophy, match: ["/matches"] },
  { href: "/community", label: "커뮤니티", icon: MessageCircle, match: ["/community"] },
  { href: "/chants", label: "응원가", icon: Music2, match: [] },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const open = openForPath === pathname;
  const moreActive = moreNavigation.some(
    (item) => !item.external && isPathActive(pathname, item.href, item.match),
  );

  return (
    <div className="fixed inset-x-0 bottom-3 z-50 lg:hidden">
      {open ? (
        <button
          type="button"
          aria-label="더보기 닫기"
          onClick={() => setOpenForPath(null)}
          className="fixed inset-0 bg-[rgba(5,10,31,0.24)] backdrop-blur-[2px]"
        />
      ) : null}

      <div className="app-shell relative px-3">
        {open ? (
          <div className="absolute inset-x-4 bottom-full mb-3 overflow-hidden rounded-[26px] border border-[rgba(255,255,255,0.42)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,247,255,0.98))] shadow-[0_26px_70px_rgba(9,22,79,0.28)] backdrop-blur">
            <div className="flex items-center justify-between border-b border-[rgba(21,44,108,0.08)] px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-blue)]">
                  More
                </p>
                <p className="mt-1 text-lg font-black text-slate-950">더보기</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenForPath(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(13,27,112,0.08)] text-[color:var(--brand-navy)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-2 p-3">
              {moreNavigation.map((item) => {
                const active = item.external
                  ? false
                  : isPathActive(pathname, item.href, item.match);
                const className = cn(
                  "flex items-center gap-3 rounded-[18px] px-4 py-3.5 text-sm font-semibold transition",
                  active
                    ? "bg-[rgba(13,27,112,0.08)] text-slate-950"
                    : "text-slate-800 hover:bg-[rgba(21,93,252,0.08)] hover:text-slate-950",
                );
                const iconClassName = cn(
                  "h-4 w-4",
                  active ? "text-slate-950" : "text-[color:var(--brand-blue)]",
                );

                if (item.external) {
                  return (
                    <a key={item.href} href={item.href} className={className}>
                      <BookOpen className={iconClassName} />
                      {item.label}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpenForPath(null)}
                    className={className}
                  >
                    <BookOpen className={iconClassName} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between rounded-[26px] border border-white/24 bg-[linear-gradient(180deg,rgba(13,27,112,0.98),rgba(21,48,146,0.94))] px-1.5 py-1.5 shadow-[0_20px_50px_rgba(13,27,112,0.34)] backdrop-blur">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isPathActive(pathname, tab.href, tab.match);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[20px] px-1.5 py-2 text-[11px] font-semibold transition",
                  active ? "bg-white" : "bg-transparent",
                )}
              >
                <Icon
                  className={cn(
                    "h-[17px] w-[17px]",
                    active ? "!text-slate-950" : "!text-white",
                  )}
                />
                <span className={cn("truncate", active ? "!text-slate-950" : "!text-white")}>
                  {tab.label}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setOpenForPath((current) => (current === pathname ? null : pathname))}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-[20px] px-1.5 py-2 text-[11px] font-semibold transition",
              open || moreActive ? "bg-white" : "bg-transparent",
            )}
          >
            <Menu
              className={cn(
                "h-[17px] w-[17px]",
                open || moreActive ? "!text-slate-950" : "!text-white",
              )}
            />
            <span className={cn("truncate", open || moreActive ? "!text-slate-950" : "!text-white")}>
              더보기
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
