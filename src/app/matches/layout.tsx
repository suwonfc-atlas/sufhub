import type { ReactNode } from "react";

export default function MatchesLayout({ children }: { children: ReactNode }) {
  return <div className="page-grid">{children}</div>;
}
