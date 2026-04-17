import { createPublicSupabaseClient } from "@/lib/supabase";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { formatKstDateTimeString, parseKstDate } from "@/lib/utils";
import type {
  LeagueMatch,
  MatchLineup,
  MatchMomVote,
  MatchPlayerRating,
  MatchPlayerRatingLike,
  PlayerFanRatingResult,
  Team,
} from "@/types";

type SupabaseLike = {
  from: (table: string) => any;
};

interface SettlementTargetMatch {
  id: string;
  seasonId: string;
  seasonCode: string;
  matchDate: string;
  competition: string;
  competitionCode: string;
  round: number | null;
  stageLabel: string | null;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
}

export interface FanRatingSettlementSummary {
  pendingCount: number;
  settledCount: number;
  openMatch: {
    id: string;
    seasonCode: string;
    competition: string;
    roundLabel: string;
    matchDate: string;
    title: string;
  } | null;
}

export interface FanRatingSettlementRunResult {
  settledMatchIds: string[];
  skippedMatchIds: string[];
}

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getRoundLabel(round: number | null, stageLabel: string | null) {
  if (stageLabel?.trim()) return stageLabel.trim();
  if (round === 99) return "PO";
  if (typeof round === "number") return `${round}R`;
  return "-";
}

function getSupabaseClient(client?: SupabaseLike | null) {
  return client ?? createServiceSupabaseClient() ?? createPublicSupabaseClient();
}

function getEligiblePlayerIds(lineup: MatchLineup) {
  const excluded = new Set(lineup.rating_excluded_player_ids ?? []);
  return [...lineup.starters_player_ids, ...lineup.bench_player_ids].filter(
    (playerId) => !excluded.has(playerId),
  );
}

async function getPrimaryTeam(supabase: SupabaseLike) {
  const { data } = await supabase
    .from("teams")
    .select("id, name, short_name, logo_url")
    .eq("is_primary", true)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return (data ?? null) as Team | null;
}

async function getFinishedPrimaryMatches(
  supabase: SupabaseLike,
  primaryTeamId: string,
) {
  const { data, error } = await supabase
    .from("league_matches")
    .select(
      "id, season_id, match_date, competition, competition_code, round, stage_label, home_team_id, away_team_id, season_record:seasons(code), home_team:teams!league_matches_home_team_id_fkey(name, short_name), away_team:teams!league_matches_away_team_id_fkey(name, short_name)",
    )
    .or(`home_team_id.eq.${primaryTeamId},away_team_id.eq.${primaryTeamId}`)
    .eq("status", "finished")
    .order("match_date", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as Array<{
    id?: string;
    season_id?: string;
    match_date?: string;
    competition?: string;
    competition_code?: string;
    round?: number | null;
    stage_label?: string | null;
    home_team_id?: string;
    away_team_id?: string;
    season_record?: { code?: string | null } | Array<{ code?: string | null }> | null;
    home_team?: { name?: string | null; short_name?: string | null } | Array<{ name?: string | null; short_name?: string | null }> | null;
    away_team?: { name?: string | null; short_name?: string | null } | Array<{ name?: string | null; short_name?: string | null }> | null;
  }>)
    .map((row) => {
      const seasonRecord = relationOne(row.season_record);
      const homeTeam = relationOne(row.home_team);
      const awayTeam = relationOne(row.away_team);

      return {
        id: row.id ?? "",
        seasonId: row.season_id ?? "",
        seasonCode: seasonRecord?.code?.trim() ?? "",
        matchDate: row.match_date ?? "",
        competition: row.competition?.trim() || "경기",
        competitionCode: row.competition_code?.trim() || "K1",
        round: row.round ?? null,
        stageLabel: row.stage_label ?? null,
        homeTeamId: row.home_team_id ?? "",
        awayTeamId: row.away_team_id ?? "",
        homeTeamName: homeTeam?.short_name ?? homeTeam?.name ?? "홈팀",
        awayTeamName: awayTeam?.short_name ?? awayTeam?.name ?? "원정팀",
      } satisfies SettlementTargetMatch;
    })
    .filter((row) => row.id && row.seasonId);
}

async function getSettledMatchIdSet(supabase: SupabaseLike, matchIds: string[]) {
  if (!matchIds.length) {
    return new Set<string>();
  }

  const { data, error } = await supabase
    .from("player_fan_rating_results")
    .select("match_id")
    .in("match_id", matchIds);

  if (error) {
    throw error;
  }

  return new Set(
    ((data ?? []) as Array<{ match_id?: string | null }>)
      .map((row) => row.match_id ?? "")
      .filter(Boolean),
  );
}

function buildTopComment(
  playerRatings: MatchPlayerRating[],
  likeCountByRatingId: Map<string, number>,
) {
  const comments = playerRatings
    .filter((row) => Boolean(row.comment?.trim()) && !row.is_hidden)
    .map((row) => ({
      ratingId: row.id,
      comment: row.comment?.trim() ?? "",
      likeCount: likeCountByRatingId.get(row.id) ?? 0,
      rating: row.rating,
      isFeatured: Boolean(row.is_featured),
      createdAt: row.created_at,
    }))
    .sort((left, right) => {
      if (left.isFeatured !== right.isFeatured) {
        return left.isFeatured ? -1 : 1;
      }
      if (right.likeCount !== left.likeCount) return right.likeCount - left.likeCount;
      if (right.rating !== left.rating) return right.rating - left.rating;
      return parseKstDate(right.createdAt).getTime() - parseKstDate(left.createdAt).getTime();
    });

  return comments[0] ?? null;
}

async function refreshSeasonPlayerStats(
  supabase: SupabaseLike,
  seasonId: string,
  seasonCode: string,
  primaryTeamId: string,
) {
  const [{ data: rosterRows }, { data: matchRows }] = await Promise.all([
    supabase
      .from("player_seasons")
      .select("player_id")
      .eq("season_id", seasonId)
      .eq("team_id", primaryTeamId),
    supabase
      .from("league_matches")
      .select("id")
      .eq("season_id", seasonId)
      .or(`home_team_id.eq.${primaryTeamId},away_team_id.eq.${primaryTeamId}`),
  ]);

  const playerIds = Array.from(
    new Set(
      ((rosterRows ?? []) as Array<{ player_id?: string | null }>)
        .map((row) => row.player_id ?? "")
        .filter(Boolean),
    ),
  );
  const matchIds = ((matchRows ?? []) as Array<{ id?: string | null }>)
    .map((row) => row.id ?? "")
    .filter(Boolean);

  if (!playerIds.length) {
    return;
  }

  const [{ data: statRows }, { data: resultRows }] = await Promise.all([
    supabase
      .from("player_stats")
      .select("*")
      .eq("season", seasonCode)
      .in("player_id", playerIds),
    matchIds.length
      ? supabase
          .from("player_fan_rating_results")
          .select("*")
          .in("match_id", matchIds)
          .in("player_id", playerIds)
      : Promise.resolve({ data: [] }),
  ]);

  const existingStats = new Map(
    ((statRows ?? []) as Array<{ id: string; player_id: string }>).map((row) => [row.player_id, row]),
  );
  const resultsByPlayer = new Map<string, PlayerFanRatingResult[]>();

  for (const result of (resultRows ?? []) as PlayerFanRatingResult[]) {
    const list = resultsByPlayer.get(result.player_id) ?? [];
    list.push(result);
    resultsByPlayer.set(result.player_id, list);
  }

  for (const playerId of playerIds) {
    const playerResults = resultsByPlayer.get(playerId) ?? [];
    const ratedResults = playerResults.filter(
      (row) => row.fan_rating_average !== null && row.fan_rating_average !== undefined && row.rating_vote_count > 0,
    );
    const momCount = playerResults.filter((row) => row.is_mom_winner).length;
    const representative = [...playerResults]
      .filter((row) => Boolean(row.top_comment?.trim()))
      .sort((left, right) => {
        if (right.top_comment_like_count !== left.top_comment_like_count) {
          return right.top_comment_like_count - left.top_comment_like_count;
        }

        return parseKstDate(right.updated_at).getTime() - parseKstDate(left.updated_at).getTime();
      })[0] ?? null;

    const fanRatingAverage = ratedResults.length
      ? Number(
          (
            ratedResults.reduce((sum, row) => sum + (row.fan_rating_average ?? 0), 0) /
            ratedResults.length
          ).toFixed(2),
        )
      : null;

    const fanPayload = {
      fan_rating_average: fanRatingAverage,
      fan_rating_matches: ratedResults.length,
      fan_mom_count: momCount,
      fan_top_comment: representative?.top_comment?.trim() ?? null,
      fan_top_comment_likes: representative?.top_comment_like_count ?? 0,
    };

    const existing = existingStats.get(playerId);
    if (existing?.id) {
      const { error } = await supabase
        .from("player_stats")
        .update(fanPayload)
        .eq("id", existing.id);

      if (error) {
        throw error;
      }

      continue;
    }

    const { error } = await supabase.from("player_stats").insert({
      player_id: playerId,
      season: seasonCode,
      appearances: 0,
      goals: 0,
      assists: 0,
      rating_average: null,
      yellow_cards: 0,
      red_cards: 0,
      minutes_played: 0,
      clean_sheets: 0,
      ...fanPayload,
    });

    if (error) {
      throw error;
    }
  }
}

export async function settleSingleMatchFanRatings(
  matchId: string,
  client?: SupabaseLike | null,
) {
  const supabase = getSupabaseClient(client);
  if (!supabase) {
    throw new Error("평점 정산용 Supabase 클라이언트를 준비하지 못했습니다.");
  }

  const primaryTeam = await getPrimaryTeam(supabase);
  if (!primaryTeam?.id) {
    throw new Error("내 팀 정보를 찾지 못했습니다.");
  }

  const { data: matchData, error: matchError } = await supabase
    .from("league_matches")
    .select(
      "id, season_id, match_date, competition, competition_code, round, stage_label, status, home_team_id, away_team_id, season_record:seasons(code)",
    )
    .eq("id", matchId)
    .maybeSingle();

  if (matchError || !matchData) {
    throw new Error(matchError?.message ?? "정산할 경기를 찾지 못했습니다.");
  }

  const match = matchData as {
    id: string;
    season_id: string;
    match_date: string;
    competition: string;
    competition_code: string;
    round?: number | null;
    stage_label?: string | null;
    status: string;
    season_record?: { code?: string | null } | Array<{ code?: string | null }> | null;
  };

  if (match.status !== "finished") {
    return false;
  }

  const seasonRecord = relationOne(match.season_record);
  const seasonCode = seasonRecord?.code?.trim() ?? "";

  const { data: lineupData, error: lineupError } = await supabase
    .from("match_lineups")
    .select("*")
    .eq("match_id", matchId)
    .eq("team_id", primaryTeam.id)
    .maybeSingle();

  if (lineupError) {
    throw lineupError;
  }

  const lineup = (lineupData ?? null) as MatchLineup | null;
  if (!lineup) {
    return false;
  }

  const eligiblePlayerIds = getEligiblePlayerIds(lineup);
  if (!eligiblePlayerIds.length) {
    return false;
  }

  const [{ data: ratingRows }, { data: likeRows }, { data: momRows }, { data: rosterRows }] =
    await Promise.all([
      supabase
        .from("match_player_ratings")
        .select("*")
        .eq("match_id", matchId)
        .in("player_id", eligiblePlayerIds),
      supabase
        .from("match_player_rating_likes")
        .select("rating_id")
        .eq("match_id", matchId),
      supabase
        .from("match_mom_votes")
        .select("*")
        .eq("match_id", matchId)
        .in("player_id", eligiblePlayerIds),
      supabase
        .from("player_seasons")
        .select("player_id, squad_number")
        .eq("season_id", match.season_id)
        .eq("team_id", primaryTeam.id)
        .in("player_id", eligiblePlayerIds),
    ]);

  const ratings = (ratingRows ?? []) as MatchPlayerRating[];
  const likes = (likeRows ?? []) as Array<{ rating_id?: string | null }>;
  const momVotes = (momRows ?? []) as MatchMomVote[];
  const squadNumberMap = new Map(
    ((rosterRows ?? []) as Array<{ player_id: string; squad_number: number | null }>).map((row) => [
      row.player_id,
      row.squad_number ?? null,
    ]),
  );

  const likeCountByRatingId = new Map<string, number>();
  for (const like of likes) {
    const ratingId = like.rating_id ?? "";
    if (!ratingId) continue;
    likeCountByRatingId.set(ratingId, (likeCountByRatingId.get(ratingId) ?? 0) + 1);
  }

  const ratingsByPlayer = new Map<string, MatchPlayerRating[]>();
  for (const rating of ratings) {
    const list = ratingsByPlayer.get(rating.player_id) ?? [];
    list.push(rating);
    ratingsByPlayer.set(rating.player_id, list);
  }

  const momCounts = new Map<string, number>();
  for (const vote of momVotes) {
    momCounts.set(vote.player_id, (momCounts.get(vote.player_id) ?? 0) + 1);
  }

  const lineupOrder = new Map<string, number>();
  eligiblePlayerIds.forEach((playerId, index) => {
    lineupOrder.set(playerId, index);
  });

  const momRanking = [...eligiblePlayerIds]
    .map((playerId) => {
      const playerRatings = ratingsByPlayer.get(playerId) ?? [];
      const average = playerRatings.length
        ? playerRatings.reduce((sum, row) => sum + row.rating, 0) / playerRatings.length
        : -1;

      return {
        playerId,
        momVoteCount: momCounts.get(playerId) ?? 0,
        average,
        order: lineupOrder.get(playerId) ?? 999,
        squadNumber: squadNumberMap.get(playerId) ?? 999,
      };
    })
    .sort((left, right) => {
      if (right.momVoteCount !== left.momVoteCount) return right.momVoteCount - left.momVoteCount;
      if (right.average !== left.average) return right.average - left.average;
      if (left.order !== right.order) return left.order - right.order;
      return (left.squadNumber ?? 999) - (right.squadNumber ?? 999);
    });

  const momRankMap = new Map<string, number>();
  momRanking.forEach((item, index) => {
    momRankMap.set(item.playerId, index + 1);
  });

  const winnerPlayerId = momRanking[0]?.momVoteCount ? momRanking[0].playerId : null;
  const settledAt = formatKstDateTimeString(new Date());
  const resultRows = eligiblePlayerIds.map((playerId) => {
    const playerRatings = ratingsByPlayer.get(playerId) ?? [];
    const average = playerRatings.length
      ? Number(
          (
            playerRatings.reduce((sum, row) => sum + row.rating, 0) / playerRatings.length
          ).toFixed(2),
        )
      : null;
    const topComment = buildTopComment(playerRatings, likeCountByRatingId);

    return {
      match_id: matchId,
      player_id: playerId,
      fan_rating_average: average,
      rating_vote_count: playerRatings.length,
      mom_vote_count: momCounts.get(playerId) ?? 0,
      mom_rank: momRankMap.get(playerId) ?? null,
      is_mom_winner: winnerPlayerId === playerId,
      top_comment: topComment?.comment ?? null,
      top_comment_like_count: topComment?.likeCount ?? 0,
      top_comment_rating_id: topComment?.ratingId ?? null,
      settled_at: settledAt,
    };
  });

  const { error: deleteError } = await supabase
    .from("player_fan_rating_results")
    .delete()
    .eq("match_id", matchId);

  if (deleteError) {
    throw deleteError;
  }

  if (resultRows.length) {
    const { error: insertError } = await supabase
      .from("player_fan_rating_results")
      .insert(resultRows);

    if (insertError) {
      throw insertError;
    }
  }

  if (seasonCode) {
    await refreshSeasonPlayerStats(supabase, match.season_id, seasonCode, primaryTeam.id);
  }

  return true;
}

export async function settlePendingPrimaryFanRatings(client?: SupabaseLike | null) {
  const supabase = getSupabaseClient(client);
  if (!supabase) {
    throw new Error("평점 정산용 Supabase 클라이언트를 준비하지 못했습니다.");
  }

  const primaryTeam = await getPrimaryTeam(supabase);
  if (!primaryTeam?.id) {
    return { settledMatchIds: [], skippedMatchIds: [] } satisfies FanRatingSettlementRunResult;
  }

  const finishedMatches = await getFinishedPrimaryMatches(supabase, primaryTeam.id);
  const targets = finishedMatches.slice(0, -1);

  const settledMatchIds: string[] = [];
  const skippedMatchIds: string[] = [];

  for (const match of targets) {
    try {
      const settled = await settleSingleMatchFanRatings(match.id, supabase);
      if (settled) {
        settledMatchIds.push(match.id);
      } else {
        skippedMatchIds.push(match.id);
      }
    } catch {
      skippedMatchIds.push(match.id);
    }
  }

  return { settledMatchIds, skippedMatchIds } satisfies FanRatingSettlementRunResult;
}

export async function getFanRatingSettlementSummary(client?: SupabaseLike | null) {
  const supabase = getSupabaseClient(client);
  if (!supabase) {
    return {
      pendingCount: 0,
      settledCount: 0,
      openMatch: null,
    } satisfies FanRatingSettlementSummary;
  }

  const primaryTeam = await getPrimaryTeam(supabase);
  if (!primaryTeam?.id) {
    return {
      pendingCount: 0,
      settledCount: 0,
      openMatch: null,
    } satisfies FanRatingSettlementSummary;
  }

  const finishedMatches = await getFinishedPrimaryMatches(supabase, primaryTeam.id);
  const openMatch = finishedMatches.at(-1) ?? null;
  const pendingTargets = finishedMatches.slice(0, -1);
  const settledSet = await getSettledMatchIdSet(
    supabase,
    pendingTargets.map((match) => match.id),
  );

  return {
    pendingCount: pendingTargets.filter((match) => !settledSet.has(match.id)).length,
    settledCount: settledSet.size,
    openMatch: openMatch
      ? {
          id: openMatch.id,
          seasonCode: openMatch.seasonCode,
          competition: openMatch.competition,
          roundLabel: getRoundLabel(openMatch.round, openMatch.stageLabel),
          matchDate: openMatch.matchDate,
          title: `${openMatch.homeTeamName} vs ${openMatch.awayTeamName}`,
        }
      : null,
  } satisfies FanRatingSettlementSummary;
}
