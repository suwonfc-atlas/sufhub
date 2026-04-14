import Link from "next/link";
import { notFound } from "next/navigation";

import { getNoticeById } from "@/lib/data/public";
import { parseKstDate } from "@/lib/utils";

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(parseKstDate(value));
}

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notice = await getNoticeById(id);

  if (!notice) {
    notFound();
  }

  return (
    <div className="page-grid">
      <section className="rounded-[28px] border border-white/70 bg-white/90 px-5 py-5 shadow-[0_18px_48px_rgba(22,56,112,0.1)] md:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {notice.is_pinned ? (
                <span className="rounded-full bg-[rgba(21,93,252,0.1)] px-3 py-1 text-xs font-semibold text-[color:var(--brand-blue)]">
                  고정
                </span>
              ) : null}
              <p className="text-sm text-slate-400">
                {formatDate(notice.published_at || notice.created_at)}
              </p>
            </div>
            <h1 className="text-2xl font-black text-slate-950 md:text-3xl">{notice.title}</h1>
          </div>

          <Link
            href="/notices"
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            목록으로
          </Link>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6 whitespace-pre-line text-sm leading-7 text-slate-700 md:text-base">
          {notice.content || "내용이 없습니다."}
        </div>
      </section>
    </div>
  );
}
