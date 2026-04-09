import { redirect } from "next/navigation";

export const metadata = {
  title: "역대 주장",
  description: "주장 표시는 선수단 목록에서 확인할 수 있습니다.",
};

export default function HistoryCaptainsPage() {
  redirect("/history/players");
}
