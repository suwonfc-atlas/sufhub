import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/auth/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  PlayerMutationInput,
  PlayerSeasonMutationInput,
  PlayerStatMutationInput,
} from "@/app/admin/actions";

function normalizeString(value: string) {
  return value.trim();
}

function normalizeNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseNullableInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseNullableFloat(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
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

  const body = (await request.json()) as {
    player: PlayerMutationInput;
    season: PlayerSeasonMutationInput;
    stat: PlayerStatMutationInput;
  };

  const playerPayload = {
    name: normalizeString(body.player.name),
    name_en: normalizeNullableString(body.player.name_en),
    position: body.player.position,
    birth_date: normalizeNullableString(body.player.birth_date),
    nationality: normalizeString(body.player.nationality),
    profile_image_url: normalizeNullableString(body.player.profile_image_url),
    bio: normalizeNullableString(body.player.bio),
  };

  const { data: playerData, error: playerError } = await supabase
    .from("players")
    .insert(playerPayload)
    .select("id")
    .single();

  if (playerError || !playerData?.id) {
    return NextResponse.json(
      { message: playerError?.message ?? "선수 등록에 실패했습니다." },
      { status: 400 },
    );
  }

  const seasonPayload = {
    player_id: playerData.id,
    season_id: normalizeNullableString(body.season.season_id),
    team_id: normalizeNullableString(body.season.team_id),
    season: normalizeString(body.season.season),
    squad_number: parseNullableInteger(body.season.squad_number),
    is_captain: body.season.is_captain,
    is_active: body.season.is_active,
    is_injured: body.season.is_injured,
    injury_detail: normalizeNullableString(body.season.injury_detail),
    is_loan: body.season.is_loan,
    loan_team: normalizeNullableString(body.season.loan_team),
    is_national_team: body.season.is_national_team,
    joined_from: null,
    left_to: null,
    notes: null,
  };

  const { error: seasonError } = await supabase.from("player_seasons").insert(seasonPayload);

  if (seasonError) {
    await supabase.from("players").delete().eq("id", playerData.id);
    return NextResponse.json({ message: seasonError.message }, { status: 400 });
  }

  const statPayload = {
    player_id: playerData.id,
    season: normalizeString(body.stat.season),
    appearances: parseNullableInteger(body.stat.appearances) ?? 0,
    goals: parseNullableInteger(body.stat.goals) ?? 0,
    assists: parseNullableInteger(body.stat.assists) ?? 0,
    rating_average: parseNullableFloat(body.stat.rating_average),
    yellow_cards: parseNullableInteger(body.stat.yellow_cards) ?? 0,
    red_cards: parseNullableInteger(body.stat.red_cards) ?? 0,
    minutes_played: parseNullableInteger(body.stat.minutes_played) ?? 0,
    clean_sheets: parseNullableInteger(body.stat.clean_sheets) ?? 0,
  };

  const { error: statError } = await supabase.from("player_stats").insert(statPayload);

  if (statError) {
    await supabase.from("player_seasons").delete().eq("player_id", playerData.id);
    await supabase.from("players").delete().eq("id", playerData.id);
    return NextResponse.json({ message: statError.message }, { status: 400 });
  }

  return NextResponse.json({ message: "선수, 시즌, 스탯을 함께 등록했습니다.", entityId: playerData.id });
}
