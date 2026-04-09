"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { moreNavigation, primaryNavigation } from "@/lib/constants/site";
import { cn, isPathActive } from "@/lib/utils";

export function DesktopNav() {
  const pathname = usePathname();

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

  return (
    <nav className="hidden items-center gap-1.5 rounded-full border border-white/12 bg-[rgba(255,255,255,0.08)] p-1 lg:flex">
      {primaryNavigation.map(renderNavItem)}
      <div className="mx-1 h-5 w-px bg-white/18" />
      {moreNavigation.map(renderNavItem)}
    </nav>
  );
}
