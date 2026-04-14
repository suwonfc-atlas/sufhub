import { StadiumGalleryBoard } from "@/components/history/stadium-gallery-board";
import { getStadiums } from "@/lib/data/public";
import { parseKstDate } from "@/lib/utils";

export const metadata = {
  title: "경기장 갤러리",
  description: "연도별 경기장 사진을 편하게 볼 수 있습니다.",
};

function getArchiveYear(createdAt: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    timeZone: "Asia/Seoul",
  }).format(parseKstDate(createdAt));
}

export default async function HistoryStadiumPage() {
  const stadiums = (await getStadiums()).sort((a, b) => {
    const yearA = a.archive_year ?? Number(getArchiveYear(a.created_at));
    const yearB = b.archive_year ?? Number(getArchiveYear(b.created_at));

    if (yearA !== yearB) {
      return yearB - yearA;
    }

    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  return <StadiumGalleryBoard stadiums={stadiums} />;
}
