import { CommunityPlayerRatingsCard } from "@/components/community/player-ratings-card";
import { CommunityPredictionCard } from "@/components/community/prediction-card";
import { PageIntro } from "@/components/ui/page-intro";
import { getCommunityPlayerRatingsData } from "@/lib/data/player-ratings";
import { getCommunityPredictionData } from "@/lib/data/predictions";

export const metadata = {
  title: "커뮤니티",
  description: "응원, 소식, 경기 예측과 평점을 함께 즐기는 커뮤니티 공간입니다.",
};

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const [predictionData, playerRatingsData] = await Promise.all([
    getCommunityPredictionData(),
    getCommunityPlayerRatingsData(),
  ]);

  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="Community"
        title="커뮤니티"
        description="응원, 소식, 경기 예측과 우리끼리 평점을 함께 즐기는 공간입니다."
      />
      <CommunityPredictionCard data={predictionData} />
      <CommunityPlayerRatingsCard data={playerRatingsData} />
    </div>
  );
}
