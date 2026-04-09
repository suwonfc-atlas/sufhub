import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/auth/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} 환경 변수가 필요합니다.`);
  }
  return value;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase 설정이 필요합니다." }, { status: 500 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !isAdminUser(user)) {
    return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { address } = (await request.json()) as { address: string };
  const trimmedAddress = address?.trim();

  if (!trimmedAddress) {
    return NextResponse.json({ message: "주소를 먼저 입력해 주세요." }, { status: 400 });
  }

  const keyId = getRequiredEnv("NAVER_MAPS_GEOCODE_API_KEY_ID");
  const key = getRequiredEnv("NAVER_MAPS_GEOCODE_API_KEY");
  const endpoint = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(trimmedAddress)}`;

  const response = await fetch(endpoint, {
    headers: {
      "x-ncp-apigw-api-key-id": keyId,
      "x-ncp-apigw-api-key": key,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json({ message: "주소 좌표 조회에 실패했습니다." }, { status: 400 });
  }

  const data = (await response.json()) as {
    addresses?: Array<{ x?: string; y?: string }>;
  };
  const firstAddress = data.addresses?.[0];

  if (!firstAddress?.x || !firstAddress?.y) {
    return NextResponse.json({ message: "입력한 주소로 좌표를 찾지 못했습니다." }, { status: 404 });
  }

  return NextResponse.json({
    message: "주소에서 좌표를 찾았습니다.",
    latitude: firstAddress.y,
    longitude: firstAddress.x,
  });
}
