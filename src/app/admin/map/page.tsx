import { MapPlacesAdminBoard } from "@/components/admin/map-places-admin-board";
import { getAdminMapPlacesPage } from "@/lib/data/admin";

export const metadata = {
  title: "관리자 캐슬클럽 관리",
  description: "캐슬클럽 지도에 노출되는 장소를 관리합니다.",
};

export default async function AdminMapPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const page = Number(params.page ?? "1") || 1;
  const placesPage = await getAdminMapPlacesPage(page);

  return <MapPlacesAdminBoard places={placesPage.items} pagination={placesPage} />;
}
