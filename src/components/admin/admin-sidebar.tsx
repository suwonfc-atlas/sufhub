"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { adminSections } from "@/lib/data/admin/preview";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const currentSection =
    adminSections.find(
      (item) => pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)),
    ) ?? adminSections[0];

  return (
    <>
      <div className="xl:hidden">
        <div className="flex items-center justify-between rounded-[22px] border border-white/70 bg-white/90 px-4 py-3 shadow-[0_18px_48px_rgba(22,56,112,0.1)]">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
              Admin Menu
            </p>
            <p className="mt-1 truncate text-sm font-black text-slate-950">{currentSection?.label}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white"
            aria-label="관리자 메뉴 열기"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        {open ? (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
              aria-label="관리자 메뉴 닫기"
            />
            <div className="absolute inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] rounded-[24px] border border-white/70 bg-white/98 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.2)]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
                    Admin Menu
                  </p>
                  <p className="mt-1 text-base font-black text-slate-950">관리 메뉴</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                  aria-label="관리자 메뉴 닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="mt-3 grid gap-2">
                {adminSections.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block rounded-2xl px-4 py-3 text-sm font-semibold transition",
                        active
                          ? "bg-slate-950 !text-white"
                          : "bg-slate-50 text-slate-700 hover:bg-sky-50 hover:text-sky-700",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        ) : null}
      </div>

      <aside className="hidden rounded-[22px] border border-white/70 bg-white/90 p-3 shadow-[0_18px_48px_rgba(22,56,112,0.1)] xl:block">
        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
          Admin Menu
        </p>
        <nav className="space-y-1">
          {adminSections.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  active
                    ? "bg-slate-950 !text-white hover:!text-white visited:!text-white"
                    : "text-slate-600 hover:bg-sky-50 hover:text-sky-700",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
