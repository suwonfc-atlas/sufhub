import { StandingsBoard } from "@/components/matches/standings-board";
import { getStandings } from "@/lib/data/public";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "리그 순위",
  description: "등록된 경기 결과를 기준으로 시즌별 리그 순위를 자동 계산해 보여줍니다.",
};

export default async function MatchStandingsPage() {
  const standings = await getStandings();

  return <StandingsBoard standings={standings} />;
}
