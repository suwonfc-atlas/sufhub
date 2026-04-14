"use server";

import { revalidatePath } from "next/cache";

import { getUserFromSession } from "@/lib/auth/user";
import { createPublicSupabaseClient } from "@/lib/supabase";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import type { PredictionChoice } from "@/types";

import { applyExperienceReward } from "@/lib/data/experience";

export interface PredictionSubmitResult {
  status: "success" | "error";
  message: string;
}

function success(message: string): PredictionSubmitResult {
  return { status: "success", message };
}

function failure(message: string): PredictionSubmitResult {
  return { status: "error", message };
}

export async function submitPrediction(params: {
  matchId: string;
  choice: PredictionChoice;
}): Promise<PredictionSubmitResult> {
  const user = await getUserFromSession();
  if (!user) {
    return failure("로그인이 필요합니다.");
  }

  const supabase = createServiceSupabaseClient() ?? createPublicSupabaseClient();
  if (!supabase) {
    return failure("예측 저장을 위한 서버 설정이 아직 연결되지 않았습니다.");
  }

  const { data: primaryTeam } = await supabase
    .from("teams")
    .select("id")
    .eq("is_primary", true)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const primaryTeamId = (primaryTeam as { id?: string } | null)?.id ?? null;
  if (!primaryTeamId) {
    return failure("내 팀 정보를 찾을 수 없습니다.");
  }

  const { data: match, error: matchError } = await supabase
    .from("league_matches")
    .select("id, home_team_id, away_team_id, status")
    .eq("id", params.matchId)
    .maybeSingle();

  if (matchError || !match) {
    return failure("경기 정보를 찾을 수 없습니다.");
  }

  if (match.status !== "scheduled") {
    return failure("경기 시작 이후에는 예측을 수정할 수 없습니다.");
  }

  if (match.home_team_id !== primaryTeamId && match.away_team_id !== primaryTeamId) {
    return failure("내 팀 경기만 예측할 수 있습니다.");
  }

  const { error } = await supabase.from("match_predictions").upsert(
    {
      user_id: user.id,
      match_id: match.id,
      choice: params.choice,
    },
    { onConflict: "user_id,match_id" },
  );

  if (error) {
    return failure(error.message);
  }

  await applyExperienceReward({
    userId: user.id,
    action: "prediction_vote",
    referenceId: match.id,
    reason: "경기 예측 투표",
  });

  revalidatePath("/community");
  revalidatePath("/mypage");
  revalidatePath("/mypage/predictions");

  return success("예측이 저장되었습니다.");
}
