import { PageIntro } from "@/components/ui/page-intro";
import { SurfaceCard } from "@/components/ui/surface-card";

export const metadata = {
  title: "이용약관",
  description: "SuFHub 이용약관",
};

export default function TermsPage() {
  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="Terms"
        title="이용약관"
        description="SuFHub 서비스를 이용하기 위한 기본 약관입니다."
      />
      <SurfaceCard className="space-y-4 p-6 text-sm text-slate-700">
        <p>버전: 2026-04-13</p>
        <p>
          SuFHub는 수원FC 팬을 위한 정보 제공 서비스입니다. 회원은 본 약관과 개인정보 처리방침에
          동의한 뒤 계정을 생성할 수 있습니다.
        </p>
        <p>
          회원가입 시 제공하는 정보는 서비스 제공 및 문의 응대, 맞춤형 콘텐츠 제공을 위해 사용됩니다.
          서비스 운영상 필요한 경우 최소한의 범위에서 정보를 활용할 수 있습니다.
        </p>
        <p>
          계정 정보는 본인이 관리해야 하며, 계정 사용 중 발생한 문제에 대한 책임은 회원에게 있습니다.
          서비스는 운영 정책에 따라 계정 이용을 제한할 수 있습니다.
        </p>
      </SurfaceCard>
    </div>
  );
}
