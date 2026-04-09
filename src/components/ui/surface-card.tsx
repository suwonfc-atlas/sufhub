import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

interface SurfaceCardProps extends PropsWithChildren {
  className?: string;
}

export function SurfaceCard({ children, className }: SurfaceCardProps) {
  return (
    <section
      className={cn(
        "rounded-[22px] border border-[color:var(--line)] bg-[color:var(--surface)] p-4 shadow-[var(--shadow)] backdrop-blur",
        className,
      )}
    >
      {children}
    </section>
  );
}
