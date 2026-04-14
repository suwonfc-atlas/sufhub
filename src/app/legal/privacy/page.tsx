import { PageIntro } from "@/components/ui/page-intro";
import { SurfaceCard } from "@/components/ui/surface-card";

export const metadata = {
  title: "개인정보 처리방침",
  description: "SuFHub 개인정보 처리방침",
};

export default function PrivacyPage() {
  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="Privacy"
        title="개인정보 처리방침"
        description="SuFHub 서비스 이용을 위해 필요한 개인정보 처리 기준입니다."
      />
      <SurfaceCard className="space-y-4 p-6 text-sm text-slate-700">
        <p>버전: 2026-04-13</p>
        <p>수집 항목: 아이디, 비밀번호(해시), 이메일, 닉네임, 생년월일.</p>
        <p>
          수집 목적: 계정 관리, 서비스 제공, 문의 응대, 기능 개선을 위한 통계 분석. 비밀번호는
          단방향 해시로 저장됩니다.
        </p>
        <p>
          보관 기간: 회원 탈퇴 시 지체 없이 파기하며, 법령에 따라 보관이 필요한 경우 해당 기간 동안
          보관할 수 있습니다.
        </p>
        <p>
          문의: 개인정보 관련 문의는 문의하기 페이지를 통해 접수할 수 있습니다.
        </p>
      </SurfaceCard>
    </div>
  );
}
