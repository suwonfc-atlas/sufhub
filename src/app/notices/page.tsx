import { PageIntro } from "@/components/ui/page-intro";
import { getNoticePageContent, getNotices } from "@/lib/data/public";

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
  description: "수원팬 서비스 공지와 안내를 확인합니다.",
};

export default async function NoticesPage() {
  const [pageContent, notices] = await Promise.all([getNoticePageContent(), getNotices()]);

  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="Notice Board"
        title={pageContent?.title ?? "공지사항"}
        description={pageContent?.description ?? "중요한 공지와 서비스 안내를 확인해 주세요."}
      >
        {pageContent?.content ? (
          <div className="rounded-[24px] border border-white/70 bg-white/90 px-5 py-4 text-sm leading-7 text-slate-600 shadow-[0_18px_48px_rgba(22,56,112,0.1)] whitespace-pre-line">
            {pageContent.content}
          </div>
        ) : null}
      </PageIntro>

      <div className="grid gap-4">
        {notices.length ? (
          notices.map((notice) => (
            <article
              key={notice.id}
              className="rounded-[24px] border border-white/70 bg-white/90 px-5 py-5 shadow-[0_18px_48px_rgba(22,56,112,0.1)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {notice.is_pinned ? (
                      <span className="rounded-full bg-[rgba(21,93,252,0.1)] px-3 py-1 text-xs font-semibold text-[color:var(--brand-blue)]">
                        고정
                      </span>
                    ) : null}
                    <p className="text-xs font-semibold text-slate-400">
                      {formatDate(notice.published_at || notice.created_at)}
                    </p>
                  </div>
                  <h2 className="text-lg font-black text-slate-950">{notice.title}</h2>
                </div>
              </div>
              {notice.content ? (
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {notice.content}
                </p>
              ) : null}
            </article>
          ))
        ) : (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/80 px-5 py-8 text-sm text-slate-500">
            등록된 공지사항이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
