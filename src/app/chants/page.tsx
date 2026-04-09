import { ChantsBoard } from "@/components/chants/chants-board";
import { getChants } from "@/lib/data/public";

export const metadata = {
  title: "응원가",
  description: "응원가 재생, 반복, 플레이리스트 순서 변경을 지원합니다.",
};

export default async function ChantsPage() {
  const chants = await getChants();

  return <ChantsBoard chants={chants} />;
}
