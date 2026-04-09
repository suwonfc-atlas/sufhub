import { TicketGalleryBoard } from "@/components/history/ticket-gallery-board";
import { getTickets } from "@/lib/data/public";

export const metadata = {
  title: "티켓 갤러리",
  description: "연도별 티켓 이미지를 갤러리처럼 살펴봅니다.",
};

function getArchiveYear(createdAt: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(createdAt));
}

export default async function HistoryTicketsPage() {
  const tickets = (await getTickets()).sort((a, b) => {
    const yearA = a.archive_year ?? Number(getArchiveYear(a.created_at));
    const yearB = b.archive_year ?? Number(getArchiveYear(b.created_at));

    if (yearA !== yearB) {
      return yearB - yearA;
    }

    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  return <TicketGalleryBoard tickets={tickets} />;
}
