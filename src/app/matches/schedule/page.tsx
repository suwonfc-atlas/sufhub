import { ScheduleBoard } from "@/components/matches/schedule-board";
import { getSchedulePageData } from "@/lib/data/public";
import type { CompetitionCode } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "경기 일정 & 결과",
  description: "최신 시즌을 기본으로 수원FC 시즌별 일정과 결과를 확인할 수 있습니다.",
};

interface MatchSchedulePageProps {
  searchParams?: Promise<{
    season?: string;
    view?: string;
    competition?: string;
  }>;
}

export default async function MatchSchedulePage({ searchParams }: MatchSchedulePageProps) {
  const params = (await searchParams) ?? {};
  const schedule = await getSchedulePageData({
    season: params.season,
    view: params.view === "upcoming" || params.view === "past" ? params.view : undefined,
    competition:
      params.competition === "all" ||
      params.competition === "K1" ||
      params.competition === "K2" ||
      params.competition === "KOREA_CUP"
        ? (params.competition as "all" | CompetitionCode)
        : undefined,
  });

  return (
    <ScheduleBoard
      seasons={schedule.seasons}
      selectedSeason={schedule.selectedSeason}
      selectedView={schedule.selectedView}
      selectedCompetition={schedule.selectedCompetition}
      competitionOptions={schedule.competitionOptions}
      matches={schedule.matches}
    />
  );
}
