import Link from "next/link";

import { SupportersRosterButton } from "@/components/notices/supporters-roster-button";
import { PageIntro } from "@/components/ui/page-intro";
import { getNoticePageContent, getNotices, getSupporters } from "@/lib/data/public";

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export const metadata = {
  title: "공지사항",
  description: "후원페이지와 서비스 공지사항을 이곳에서 확인합니다.",
};

export default async function NoticesPage() {
  const [pageContent, notices, supporters] = await Promise.all([
    getNoticePageContent(),
    getNotices(),
    getSupporters(),
  ]);

  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="Notice Board"
        title={pageContent?.title ?? "공지사항"}
        description={
          pageContent?.description ?? "중요한 공지와 간단한 소개를 이 페이지에서 안내합니다."
        }
        actions={<SupportersRosterButton supporters={supporters} />}
      >
        {pageContent?.content ? (
          <div className="rounded-[24px] border border-white/70 bg-white/90 px-5 py-4 text-sm leading-7 text-slate-600 shadow-[0_18px_48px_rgba(22,56,112,0.1)] whitespace-pre-line">
            {pageContent.content}
          </div>
        ) : null}
      </PageIntro>

      <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_18px_48px_rgba(22,56,112,0.1)]">
        <div className="grid grid-cols-[88px_1fr_96px] border-b border-slate-200 bg-slate-950 px-4 py-3 text-sm font-semibold text-white md:grid-cols-[96px_1fr_120px]">
          <span>번호</span>
          <span>제목</span>
          <span className="text-right">등록일</span>
        </div>

        {notices.length ? (
          <div className="divide-y divide-slate-100">
            {notices.map((notice, index) => (
              <Link
                key={notice.id}
                href={`/notices/${notice.id}`}
                className="grid grid-cols-[88px_1fr_96px] items-center gap-3 px-4 py-4 text-sm transition hover:bg-slate-50 md:grid-cols-[96px_1fr_120px]"
              >
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="font-semibold">{notices.length - index}</span>
                  {notice.is_pinned ? (
                    <span className="rounded-full bg-[rgba(21,93,252,0.1)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--brand-blue)]">
                      고정
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{notice.title}</p>
                </div>
                <p className="text-right text-xs text-slate-400 md:text-sm">
                  {formatDate(notice.published_at || notice.created_at)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            등록된 공지사항이 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}
