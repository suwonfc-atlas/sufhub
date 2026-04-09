import { PlayerStatsBoard } from "@/components/matches/player-stats-board";
import { getPlayerStats } from "@/lib/data/public";

export const metadata = {
  title: "선수 스탯",
  description: "시즌별 수원FC 선수 기록을 비교합니다.",
};

export default async function MatchStatsPage() {
  const stats = await getPlayerStats();

  return <PlayerStatsBoard stats={stats} />;
}
