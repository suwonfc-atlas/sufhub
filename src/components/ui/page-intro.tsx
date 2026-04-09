import type { PropsWithChildren } from "react";

interface PageIntroProps extends PropsWithChildren {
  eyebrow?: string;
  title: string;
  description: string;
}

export function PageIntro({
  eyebrow,
  title,
  description,
  children,
}: PageIntroProps) {
  return (
    <div className="space-y-3">
      {eyebrow ? (
        <p className="inline-flex rounded-full bg-[rgba(21,93,252,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-blue)]">
          {eyebrow}
        </p>
      ) : null}
      <div className="space-y-2">
        <h1 className="text-[1.9rem] font-black leading-tight tracking-tight text-slate-950 md:text-[2.35rem]">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
