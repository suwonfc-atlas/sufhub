import { redirect } from "next/navigation";

import { NEWS_EXTERNAL_URL } from "@/lib/constants/site";

export const metadata = {
  title: "뉴스",
  description: "수원FC 관련 외부 뉴스 페이지로 이동합니다.",
};

export default function NewsPage() {
  redirect(NEWS_EXTERNAL_URL);
}
