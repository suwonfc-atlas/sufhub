import { InquiryHub } from "@/components/contact/inquiry-hub";
import { PageIntro } from "@/components/ui/page-intro";
import { getUserFromSession } from "@/lib/auth/user";
import { getUserInquiries } from "@/lib/data/user";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "문의",
  description: "내 문의 내역을 확인하고 새로운 문의를 접수합니다.",
};

export default async function ContactPage() {
  const user = await getUserFromSession();
  const inquiries = user ? await getUserInquiries(user.id, 50) : [];
  const hasServiceAccess = Boolean(createServiceSupabaseClient());

  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="Contact"
        title="문의"
        description="내 문의를 확인하고 필요한 내용을 빠르게 접수할 수 있습니다."
      />

      <InquiryHub initialInquiries={inquiries} hasServiceAccess={hasServiceAccess} />
    </div>
  );
}
