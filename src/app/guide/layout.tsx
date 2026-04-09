import type { ReactNode } from "react";

import { MobileSectionBackButton } from "@/components/layout/mobile-section-back-button";

export default function GuideLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MobileSectionBackButton sectionHref="/guide" sectionLabel="가이드" />
      {children}
    </>
  );
}
