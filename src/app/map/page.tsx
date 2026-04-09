import { CastleClubMap } from "@/components/map/castle-club-map";
import { getMapPlaces } from "@/lib/data/public";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "캐슬클럽",
  description: "주변 장소를 지도와 거리순 리스트로 빠르게 확인하는 캐슬클럽 페이지입니다.",
};

export default async function MapPage() {
  const places = await getMapPlaces();

  return <CastleClubMap places={places} />;
}
