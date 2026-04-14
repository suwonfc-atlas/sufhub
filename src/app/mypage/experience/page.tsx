import Link from "next/link";

import { PageIntro } from "@/components/ui/page-intro";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getUserFromSession } from "@/lib/auth/user";
import { getUserExperienceLogs } from "@/lib/data/user";
import { parseKstDate } from "@/lib/utils";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(parseKstDate(value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export const metadata = {
  title: "경험치 내역",
  description: "내 경험치 변동 내역을 확인합니다.",
};

export default async function MyExperiencePage() {
  const user = await getUserFromSession();
  const logs = user ? await getUserExperienceLogs(user.id, 200) : [];

  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="Experience"
        title="경험치 내역"
        description="최근 경험치 변동 내역을 확인할 수 있습니다."
        actions={
          <Link
            href="/mypage"
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            마이페이지로
          </Link>
        }
      />

      <SurfaceCard className="space-y-3">
        {logs.length ? (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm"
            >
              <div>
                <p className="font-semibold text-slate-900">{log.reason}</p>
                <p className="text-xs text-slate-500">{formatDate(log.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">
                  {log.delta >= 0 ? "+" : ""}
                  {formatNumber(log.delta)}
                </p>
                <p className="text-xs text-slate-500">
                  누적 {formatNumber(log.total_experience)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">표시할 경험치 내역이 없습니다.</p>
        )}
      </SurfaceCard>
    </div>
  );
}
