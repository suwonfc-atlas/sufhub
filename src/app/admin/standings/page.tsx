import { unstable_noStore as noStore } from "next/cache";

import { StandingsAdminBoard } from "@/components/admin/standings-admin-board";
import { getAdminStandings } from "@/lib/data/admin";
import type { LeagueCode } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "관리자 자동 순위",
  description: "전체 경기 결과를 기준으로 계산된 리그 순위를 확인합니다.",
};

interface AdminStandingsPageProps {
  searchParams?: Promise<{
    season?: string;
    league?: string;
  }>;
}

export default async function AdminStandingsPage({ searchParams }: AdminStandingsPageProps) {
  noStore();

  const params = (await searchParams) ?? {};
  const league = params.league === "K2" ? "K2" : "K1";
  const standingsData = await getAdminStandings(params.season, league as LeagueCode);

  return (
    <StandingsAdminBoard
      seasons={standingsData.seasons}
      selectedSeason={standingsData.selectedSeason}
      selectedLeague={standingsData.selectedLeague}
      standings={standingsData.standings}
    />
  );
}
