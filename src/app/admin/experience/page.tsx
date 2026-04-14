import { ExperienceRulesAdminBoard } from "@/components/admin/experience-rules-admin-board";
import { getAdminExperienceRules } from "@/lib/data/admin";

export const metadata = {
  title: "경험치 규칙",
  description: "예측 관련 경험치 지급 규칙을 관리합니다.",
};

export default async function AdminExperiencePage() {
  const rules = await getAdminExperienceRules();

  return <ExperienceRulesAdminBoard rules={rules} />;
}
