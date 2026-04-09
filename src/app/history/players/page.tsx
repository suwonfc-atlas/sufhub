import { PlayerArchiveBoard } from "@/components/history/player-archive-board";
import { getPlayersArchive } from "@/lib/data/public";

export const metadata = {
  title: "선수단",
  description: "시즌별 선수단을 번호, 포지션, 메모 중심으로 볼 수 있습니다.",
};

export default async function HistoryPlayersPage() {
  const players = await getPlayersArchive();

  return (
    <div className="page-grid gap-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-blue)]">
          Squad
        </p>
        <h1 className="text-[1.55rem] font-black leading-tight text-slate-950">
          선수단
        </h1>
      </div>
      <PlayerArchiveBoard players={players} />
    </div>
  );
}
