import { PageIntro } from "@/components/ui/page-intro";

import { LoginForm } from "./login-form";

export const metadata = {
  title: "로그인",
  description: "SuFHub 계정으로 로그인해 응원가와 팀 소식을 즐기세요.",
};

export default function LoginPage() {
  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="Login"
        title="로그인"
        description="아이디와 비밀번호를 입력해 바로 로그인할 수 있습니다."
      />
      <LoginForm />
    </div>
  );
}
