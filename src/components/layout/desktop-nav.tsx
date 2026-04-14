"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { moreNavigation, primaryNavigation } from "@/lib/constants/site";
import { cn, isPathActive } from "@/lib/utils";

export function DesktopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const renderNavItem = (item: (typeof primaryNavigation)[number]) => {
    const active = item.external
      ? false
      : isPathActive(pathname, item.href, item.match);
    const className = cn(
      "rounded-full px-4 py-2 text-sm font-semibold transition",
      active
        ? "bg-white !text-slate-950"
        : "!text-white hover:bg-white/12 hover:!text-white",
    );

    if (item.external) {
      return (
        <a key={item.href} href={item.href} className={className}>
          {item.label}
        </a>
      );
    }

    return (
      <Link key={item.href} href={item.href} className={className}>
        {item.label}
      </Link>
    );
  };

  const desktopMoreNavigation = moreNavigation.filter((item) => item.href !== "/mypage");
  const moreActive = desktopMoreNavigation.some(
    (item) => !item.external && isPathActive(pathname, item.href, item.match),
  );

  return (
    <nav className="relative hidden items-center gap-1.5 rounded-full border border-white/12 bg-[rgba(255,255,255,0.08)] p-1 lg:flex">
      {primaryNavigation.map(renderNavItem)}
      <div className="mx-1 h-5 w-px bg-white/18" />
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
          open || moreActive
            ? "bg-white !text-slate-950"
            : "!text-white hover:bg-white/12 hover:!text-white",
        )}
      >
        더보기
        <ChevronDown className={cn("h-4 w-4 transition", open ? "rotate-180" : "rotate-0")} />
      </button>

      <div
        className={cn(
          "absolute left-0 top-full mt-3 w-[22rem] overflow-hidden rounded-[20px] border border-white/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,247,255,0.98))] shadow-[0_22px_60px_rgba(9,22,79,0.25)] transition-all duration-200",
          open ? "max-h-[480px] opacity-100" : "pointer-events-none max-h-0 opacity-0",
        )}
      >
        <div className="grid gap-1 p-3">
          {desktopMoreNavigation.map((item) => {
            const active = item.external
              ? false
              : isPathActive(pathname, item.href, item.match);
            const className = cn(
              "rounded-[16px] px-4 py-3 text-sm font-semibold transition",
              active
                ? "bg-[rgba(13,27,112,0.08)] text-slate-950"
                : "text-slate-800 hover:bg-[rgba(21,93,252,0.08)] hover:text-slate-950",
            );

            if (item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={className}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={className}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
