import { InquiryForm } from "@/components/contact/inquiry-form";
import { PageIntro } from "@/components/ui/page-intro";

export const metadata = {
  title: "문의하기",
  description: "문의, 제보, 제안, 자랑, 상담 내용을 간단히 남길 수 있습니다.",
};

export default function ContactPage() {
  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="Contact"
        title="문의하기"
        description="문의, 제보, 제안, 자랑, 상담 내용을 남겨 주시면 확인 후 순서대로 답변드릴게요."
      />

      <InquiryForm />
    </div>
  );
}
