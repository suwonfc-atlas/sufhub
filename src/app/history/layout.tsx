import type { ReactNode } from "react";

import { MobileSectionBackButton } from "@/components/layout/mobile-section-back-button";

export default function HistoryLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MobileSectionBackButton
        sectionHref="/history"
        sectionLabel="히스토리"
        forceSectionHref
        hideOnSectionRoot
      />
      {children}
    </>
  );
}
