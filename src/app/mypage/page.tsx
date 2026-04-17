import Link from "next/link";

import { PageIntro } from "@/components/ui/page-intro";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getUserDashboardData } from "@/lib/data/user";
import { parseKstDate } from "@/lib/utils";

import { MyPageActions } from "./page.actions";

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(parseKstDate(value));
}

export const metadata = {
  title: "마이페이지",
  description: "계정 정보와 경험치, 활동 기록을 한곳에서 관리합니다.",
};

export default async function MyPage() {
  const { user, experienceLogs, hasServiceAccess } = await getUserDashboardData();

  if (!user) {
    return (
      <div className="page-grid">
        <PageIntro
          eyebrow="My Page"
          title="마이페이지"
          description="로그인 후 계정 정보와 경험치 이력을 확인할 수 있습니다."
        />
        <SurfaceCard className="p-6 text-sm text-slate-600">로그인이 필요합니다.</SurfaceCard>
      </div>
    );
  }

  const level = user.level ?? 1;
  const experience = user.experience ?? 0;
  const nextLevelExp = Math.max(100, level * 100);
  const progress = Math.min(100, Math.round((experience / nextLevelExp) * 100));

  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="My Page"
        title="마이페이지"
        description="대시보드와 경험치 이력, 계정 관리 메뉴를 한 번에 확인하세요."
        actions={<MyPageActions />}
      />

      <div className="grid gap-6">
        <SurfaceCard className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand-blue)]">
                Dashboard
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">{user.nickname}</h2>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
            <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
              Lv.{level}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>보유 경험치</span>
              <span className="font-semibold text-slate-900">
                {formatNumber(experience)} / {formatNumber(nextLevelExp)}
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-[color:var(--brand-blue)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-base font-black text-slate-950">최근 경험치 이력</p>
            <Link
              href="/mypage/experience"
              className="text-xs font-semibold text-[color:var(--brand-blue)]"
            >
              더보기
            </Link>
          </div>
          <div className="space-y-2">
            {experienceLogs.length ? (
              experienceLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm"
                >
                  <div className="space-y-0.5">
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
              <p className="text-sm text-slate-500">표시할 경험치 이력이 없습니다.</p>
            )}
          </div>
          {!hasServiceAccess ? (
            <p className="text-xs text-slate-500">
              경험치 이력은 서비스 설정이 완료된 뒤에 표시됩니다.
            </p>
          ) : null}
        </SurfaceCard>

        <SurfaceCard className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">나의 기록</p>
          <div className="grid gap-2">
            <Link
              href="/mypage/predictions"
              className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              예측 기록
              <span className="text-slate-400">→</span>
            </Link>
            <Link
              href="/mypage/ratings"
              className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              평점 입력 기록
              <span className="text-slate-400">→</span>
            </Link>
          </div>
        </SurfaceCard>

        <SurfaceCard className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">바로가기</p>
          <div className="grid gap-2">
            <Link
              href="/mypage/profile"
              className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              회원 정보 수정
              <span className="text-slate-400">→</span>
            </Link>
            <Link
              href="/notices"
              className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              공지사항
              <span className="text-slate-400">→</span>
            </Link>
            <Link
              href="/contact"
              className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              문의
              <span className="text-slate-400">→</span>
            </Link>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
