import { PageIntro } from "@/components/ui/page-intro";

import { SignupForm } from "./signup-form";

export const metadata = {
  title: "회원가입",
  description: "SuFHub 계정을 만들고 팀 소식을 빠르게 받아보세요.",
};

export default function SignupPage() {
  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="Signup"
        title="회원가입"
        description="아이디, 닉네임, 이메일, 생년월일을 입력하면 바로 가입할 수 있습니다."
      />
      <SignupForm />
    </div>
  );
}
