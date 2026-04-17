"use server";

import { revalidatePath } from "next/cache";

import { getUserFromSession } from "@/lib/auth/user";
import { applyExperienceReward } from "@/lib/data/experience";
import { buildClubMatches } from "@/lib/data/league";
import { createPublicSupabaseClient } from "@/lib/supabase";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import type {
  LeagueMatch,
  MatchLineup,
  PredictionChoice,
  Team,
  UserAccount,
} from "@/types";

export interface CommunityMutationResult {
  status: "success" | "error";
  message: string;
}

function success(message: string): CommunityMutationResult {
  return { status: "success", message };
}

function failure(message: string): CommunityMutationResult {
  return { status: "error", message };
}

async function getPrimaryTeam() {
  const supabase = createServiceSupabaseClient() ?? createPublicSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("teams")
    .select("*")
    .eq("is_primary", true)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return (data as Team | null) ?? null;
}

async function getLatestFinishedPrimaryMatch(primaryTeamId: string) {
  const supabase = createServiceSupabaseClient() ?? createPublicSupabaseClient();
  if (!supabase) return null;

  const { data: matchRows } = await supabase
    .from("league_matches")
    .select(
      "*, season_record:seasons(*), home_team:teams!league_matches_home_team_id_fkey(*), away_team:teams!league_matches_away_team_id_fkey(*)",
    )
    .or(`home_team_id.eq.${primaryTeamId},away_team_id.eq.${primaryTeamId}`)
    .order("match_date", { ascending: true });

  const leagueMatches = ((matchRows ?? []) as Array<
    LeagueMatch & { season_record?: { code?: string | null } | null }
  >).map((match) => ({
    ...match,
    season: match.season_record?.code ?? "",
  })) as LeagueMatch[];

  const teams = Array.from(
    new Map(
      leagueMatches
        .flatMap((match) => [match.home_team, match.away_team])
        .filter((team): team is Team => Boolean(team))
        .map((team) => [team.id, team]),
    ).values(),
  );

  const clubMatches = buildClubMatches(leagueMatches, teams, primaryTeamId);
  return [...clubMatches].reverse().find((match) => match.status === "finished") ?? null;
}

async function getPrimaryLineup(matchId: string, teamId: string) {
  const supabase = createServiceSupabaseClient() ?? createPublicSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("match_lineups")
    .select("*")
    .eq("match_id", matchId)
    .eq("team_id", teamId)
    .maybeSingle();

  return (data as MatchLineup | null) ?? null;
}

function getRatingEligiblePlayerIds(lineup: MatchLineup) {
  const excluded = new Set(lineup.rating_excluded_player_ids ?? []);
  return [...lineup.starters_player_ids, ...lineup.bench_player_ids].filter(
    (playerId) => !excluded.has(playerId),
  );
}

export async function submitPrediction(params: {
  matchId: string;
  choice: PredictionChoice;
}): Promise<CommunityMutationResult> {
  const user = (await getUserFromSession()) as { id: string } | null;
  if (!user || Array.isArray(user)) {
    return failure("로그인이 필요합니다.");
  }

  const supabase = createServiceSupabaseClient() ?? createPublicSupabaseClient();
  if (!supabase) {
    return failure("예측 저장을 위한 서버 설정이 아직 완료되지 않았습니다.");
  }

  const primaryTeam = await getPrimaryTeam();
  if (!primaryTeam) {
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

  if (match.home_team_id !== primaryTeam.id && match.away_team_id !== primaryTeam.id) {
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

export async function submitPlayerRatings(params: {
  matchId: string;
  ratings: Array<{ playerId: string; rating: number; comment?: string }>;
  momPlayerId: string;
}): Promise<CommunityMutationResult> {
  const user = (await getUserFromSession()) as UserAccount | null;
  if (!user || Array.isArray(user)) {
    return failure("로그인이 필요합니다.");
  }

  const supabase = createServiceSupabaseClient() ?? createPublicSupabaseClient();
  if (!supabase) {
    return failure("평점 저장을 위한 서버 설정이 아직 완료되지 않았습니다.");
  }

  const primaryTeam = await getPrimaryTeam();
  if (!primaryTeam) {
    return failure("내 팀 정보를 찾을 수 없습니다.");
  }

  const latestMatch = await getLatestFinishedPrimaryMatch(primaryTeam.id);
  if (!latestMatch || latestMatch.id !== params.matchId) {
    return failure("현재 평점을 입력할 수 있는 지난 경기만 제출할 수 있습니다.");
  }

  const lineup = await getPrimaryLineup(params.matchId, primaryTeam.id);
  if (!lineup) {
    return failure("라인업이 등록된 경기만 평점을 입력할 수 있습니다.");
  }

  const lineupPlayerIds = getRatingEligiblePlayerIds(lineup);
  if (!lineupPlayerIds.length) {
    return failure("평점 대상 선수가 없습니다.");
  }

  const ratingMap = new Map<string, { rating: number; comment: string | null }>();
  for (const item of params.ratings) {
    if (!lineupPlayerIds.includes(item.playerId)) {
      return failure("라인업에 없는 선수는 평가할 수 없습니다.");
    }

    if (!Number.isInteger(item.rating) || item.rating < 1 || item.rating > 10) {
      return failure("평점은 1점부터 10점까지 입력해 주세요.");
    }

    const comment = item.comment?.trim() ?? "";
    if (comment.length > 50) {
      return failure("한 줄 평가는 50자 이내로 입력해 주세요.");
    }

    ratingMap.set(item.playerId, {
      rating: item.rating,
      comment: comment || null,
    });
  }

  if (ratingMap.size !== lineupPlayerIds.length) {
    return failure("출전 선수 전원에게 평점을 입력해 주세요.");
  }

  if (!lineupPlayerIds.includes(params.momPlayerId)) {
    return failure("MOM은 출전 선수 중에서 선택해 주세요.");
  }

  const ratingPayload = lineupPlayerIds.map((playerId) => {
    const row = ratingMap.get(playerId);
    return {
      match_id: params.matchId,
      user_id: user.id,
      player_id: playerId,
      rating: row?.rating ?? 0,
      comment: row?.comment ?? null,
    };
  });

  const { error: ratingsError } = await supabase
    .from("match_player_ratings")
    .upsert(ratingPayload, { onConflict: "match_id,user_id,player_id" });

  if (ratingsError) {
    return failure(ratingsError.message);
  }

  const { error: momError } = await supabase.from("match_mom_votes").upsert(
    {
      match_id: params.matchId,
      user_id: user.id,
      player_id: params.momPlayerId,
    },
    { onConflict: "match_id,user_id" },
  );

  if (momError) {
    return failure(momError.message);
  }

  await applyExperienceReward({
    userId: user.id,
    action: "rating_vote",
    referenceId: params.matchId,
    reason: "선수 평점 입력",
  });

  await applyExperienceReward({
    userId: user.id,
    action: "mom_vote",
    referenceId: params.matchId,
    reason: "MOM 투표",
  });

  revalidatePath("/community");
  revalidatePath("/");

  return success("선수 평점과 MOM 투표가 저장되었습니다.");
}

export async function togglePlayerRatingLike(params: {
  ratingId: string;
}): Promise<CommunityMutationResult> {
  const user = (await getUserFromSession()) as UserAccount | null;
  if (!user || Array.isArray(user)) {
    return failure("로그인이 필요합니다.");
  }

  const supabase = createServiceSupabaseClient() ?? createPublicSupabaseClient();
  if (!supabase) {
    return failure("좋아요 저장을 위한 서버 설정이 아직 완료되지 않았습니다.");
  }

  const { data: rating } = await supabase
    .from("match_player_ratings")
    .select("id, user_id, match_id, player_id")
    .eq("id", params.ratingId)
    .maybeSingle();

  if (!rating) {
    return failure("평가 정보를 찾을 수 없습니다.");
  }

  if (rating.user_id === user.id) {
    return failure("내가 쓴 평가에는 좋아요를 누를 수 없습니다.");
  }

  const { data: existingLike } = await supabase
    .from("match_player_rating_likes")
    .select("id")
    .eq("rating_id", params.ratingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingLike?.id) {
    const { error } = await supabase
      .from("match_player_rating_likes")
      .delete()
      .eq("id", existingLike.id);

    if (error) {
      return failure(error.message);
    }

    revalidatePath("/community");
    return success("좋아요를 취소했습니다.");
  }

  const { error } = await supabase.from("match_player_rating_likes").insert({
    rating_id: params.ratingId,
    match_id: rating.match_id,
    player_id: rating.player_id,
    user_id: user.id,
  });

  if (error) {
    return failure(error.message);
  }

  revalidatePath("/community");
  return success("좋아요를 남겼습니다.");
}
