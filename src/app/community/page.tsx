import { CommunityPredictionCard } from "@/components/community/prediction-card";
import { PageIntro } from "@/components/ui/page-intro";
import { getCommunityPredictionData } from "@/lib/data/predictions";

export const metadata = {
  title: "커뮤니티",
  description: "수원FC 팬들이 모여 이야기하는 커뮤니티 공간입니다.",
};

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const predictionData = await getCommunityPredictionData();

  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="Community"
        title="커뮤니티"
        description="응원, 소식, 경기 예측까지 함께 즐기는 공간입니다."
      />
      <CommunityPredictionCard data={predictionData} />
    </div>
  );
}
