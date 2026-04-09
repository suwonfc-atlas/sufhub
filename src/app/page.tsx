import { HomeRankings } from "@/components/home/home-rankings";
import { MatchCard } from "@/components/matches/match-card";
import { getHomePageOverview } from "@/lib/data/public";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const overview = await getHomePageOverview();

  return (
    <div className="page-grid gap-3">
      <div className="space-y-1 px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-blue)]">
          Suwon FC
        </p>
        <h1 className="text-[1.25rem] font-black leading-tight text-slate-950">
          이번 시즌 한눈에 보기
        </h1>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {overview.nextMatch ? (
          <MatchCard match={overview.nextMatch} eyebrow="다음 경기" eyebrowTone="blue" />
        ) : (
          <div className="rounded-[22px] border border-[color:var(--line)] bg-white px-4 py-4 text-sm text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            등록된 다음 경기가 없습니다.
          </div>
        )}

        {overview.latestMatch ? (
          <MatchCard match={overview.latestMatch} eyebrow="지난 경기" eyebrowTone="red" />
        ) : (
          <div className="rounded-[22px] border border-[color:var(--line)] bg-white px-4 py-4 text-sm text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            지난 경기 결과가 없습니다.
          </div>
        )}
      </div>

      <HomeRankings
        currentSeason={overview.currentSeason}
        defaultLeague={overview.defaultLeague}
        initialLeagueRows={overview.initialLeagueRows}
        initialPlayerRows={overview.initialPlayerRows}
      />
    </div>
  );
}
