"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { MobileBottomNav } from "./mobile-bottom-nav";
import { SiteHeader } from "./site-header";

const ChantPlayerHost = dynamic(
  () =>
    import("@/components/chants/chant-player-host").then(
      (module) => module.ChantPlayerHost,
    ),
  { ssr: false },
);

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMapPage = pathname === "/map";

  return (
    <>
      <div className="hidden lg:block">
        <SiteHeader />
      </div>
      <main
        className={
          isMapPage
            ? "app-shell h-dvh overflow-hidden pb-0 pt-0 lg:h-dvh lg:px-6 lg:pb-0 lg:pt-[4.875rem]"
            : "app-shell px-3 pb-24 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-4 lg:px-6 lg:pb-10 lg:pt-[calc(4.875rem+1.5rem)]"
        }
      >
        <div className={isMapPage ? "app-content h-full gap-0 overflow-hidden" : "app-content"}>
          {children}
        </div>
      </main>
      <ChantPlayerHost />
      <MobileBottomNav />
    </>
  );
}
