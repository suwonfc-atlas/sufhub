import { CalendarDays, Clock3, Shield } from "lucide-react";

import { SurfaceCard } from "@/components/ui/surface-card";
import type { Match } from "@/types";
import {
  formatDateLabel,
  formatTimeLabel,
  getDDayLabel,
  getMatchScoreLabel,
  getVenueLabel,
} from "@/lib/utils";

interface HomeHeroProps {
  nextMatch: Match | null;
  latestMatch: Match | null;
}

export function HomeHero({ nextMatch, latestMatch }: HomeHeroProps) {
  const spotlight = nextMatch ?? latestMatch;

  return (
    <SurfaceCard className="relative overflow-hidden bg-[linear-gradient(145deg,#0d1b70,#155dfc)] p-0 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(230,69,69,0.16),transparent_22%)]" />
      <div className="relative grid gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-100">
              SUWON FC
            </p>
            <h1 className="text-[2rem] font-black leading-tight">오늘의 경기 흐름</h1>
          </div>
          <div className="rounded-[22px] bg-white px-4 py-3 text-center text-[color:var(--brand-navy)] shadow-[0_12px_28px_rgba(7,17,68,0.2)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {nextMatch ? "Next" : "Result"}
            </p>
            <p className="mt-1 text-lg font-black">
              {spotlight
                ? nextMatch
                  ? getDDayLabel(spotlight.match_date)
                  : getMatchScoreLabel(spotlight)
                : "Ready"}
            </p>
          </div>
        </div>

        {spotlight ? (
          <div className="rounded-[24px] border border-white/14 bg-white/10 p-4 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/80">
              {nextMatch ? "다음 경기" : "최근 경기"}
            </p>
            <p className="mt-2 text-2xl font-black">수원FC vs {spotlight.opponent}</p>
            <div className="mt-4 grid gap-3 text-sm text-sky-50/92">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4 text-sky-200" />
                {formatDateLabel(spotlight.match_date)}
              </div>
              <div className="flex items-center gap-3">
                <Clock3 className="h-4 w-4 text-sky-200" />
                {formatTimeLabel(spotlight.match_date)}
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-sky-200" />
                {getVenueLabel(spotlight)} · {spotlight.stadium_name ?? "경기장 정보 준비 중"}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </SurfaceCard>
  );
}
