import { PageIntro } from "@/components/ui/page-intro";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getUserDashboardData } from "@/lib/data/user";

import { MyPageProfileForm } from "../profile-form";

export const metadata = {
  title: "회원 정보 수정",
  description: "닉네임, 이메일, 비밀번호 정보를 수정합니다.",
};

export default async function MyPageProfilePage() {
  const { user } = await getUserDashboardData();

  if (!user) {
    return (
      <div className="page-grid">
        <PageIntro
          eyebrow="My Page"
          title="회원 정보 수정"
          description="로그인 후 계정 정보를 수정할 수 있습니다."
        />
        <SurfaceCard className="p-6 text-sm text-slate-600">로그인이 필요합니다.</SurfaceCard>
      </div>
    );
  }

  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="My Page"
        title="회원 정보 수정"
        description="닉네임, 이메일, 비밀번호를 수정하고 계정을 관리하세요."
      />
      <MyPageProfileForm nickname={user.nickname} email={user.email} />
    </div>
  );
}
