"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { matchTabs } from "@/lib/constants/site";
import { cn } from "@/lib/utils";

export function MatchesTabNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {matchTabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            pathname === tab.href
              ? "bg-slate-950 text-white"
              : "bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-700",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
