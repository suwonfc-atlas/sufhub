"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface MobileSectionBackButtonProps {
  sectionHref: string;
  sectionLabel: string;
  forceSectionHref?: boolean;
  hideOnSectionRoot?: boolean;
}

export function MobileSectionBackButton({
  sectionHref,
  sectionLabel,
  forceSectionHref = false,
  hideOnSectionRoot = false,
}: MobileSectionBackButtonProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isSectionRoot = pathname === sectionHref;

  const handleBack = () => {
    if (forceSectionHref) {
      router.push(sectionHref);
      return;
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(isSectionRoot ? "/" : sectionHref);
  };

  if (hideOnSectionRoot && isSectionRoot) {
    return null;
  }

  return (
    <div className="relative mb-2 h-12 lg:hidden">
      <div className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+0.75rem)] z-30 w-[min(calc(100%-1.5rem),32rem)] -translate-x-1/2 px-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-[rgba(255,255,255,0.92)] px-3.5 py-2 text-sm font-semibold text-[color:var(--brand-navy)] shadow-[0_12px_28px_rgba(8,20,76,0.12)] backdrop-blur"
          aria-label={`${sectionLabel} 뒤로가기`}
        >
          <ArrowLeft className="h-4 w-4" />
          뒤로가기
        </button>
      </div>
    </div>
  );
}
