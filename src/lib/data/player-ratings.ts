import { getUserFromSession } from "@/lib/auth/user";
import { buildClubMatches } from "@/lib/data/league";
import { createPublicSupabaseClient } from "@/lib/supabase";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { parseKstDate } from "@/lib/utils";
import type {
  LeagueMatch,
  Match,
  MatchLineup,
  MatchMomVote,
  MatchPlayerRating,
  MatchPlayerRatingLike,
  Player,
  Team,
  UserAccount,
} from "@/types";

const POSITION_ORDER: Record<string, number> = {
  GK: 0,
  DF: 1,
  MF: 2,
  FW: 3,
};

export interface CommunityPlayerRatingComment {
  ratingId: string;
  playerId: string;
  userId: string;
  nickname: string;
  rating: number;
  comment: string;
  likeCount: number;
  likedByMe: boolean;
  isMine: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface CommunityPlayerRatingRow {
  playerId: string;
  name: string;
  position: string;
  squadNumber: number | null;
  isCaptain: boolean;
  averageRating: number | null;
  voteCount: number;
  momVoteCount: number;
  userRating: number | null;
  userComment: string;
  comments: CommunityPlayerRatingComment[];
  topComment: CommunityPlayerRatingComment | null;
}

export interface CommunityPlayerRatingsData {
  match: Match | null;
  primaryTeam: Team | null;
  userId: string | null;
  available: boolean;
  participationCount: number;
  totalComments: number;
  userHasSubmitted: boolean;
  userMomPlayerId: string | null;
  players: CommunityPlayerRatingRow[];
  topRatedPlayer: CommunityPlayerRatingRow | null;
  topMomPlayer: CommunityPlayerRatingRow | null;
  message: string | null;
}

function emptyRatingsData(
  partial?: Partial<
    Pick<
      CommunityPlayerRatingsData,
      "match" | "primaryTeam" | "userId" | "message"
    >
  >,
): CommunityPlayerRatingsData {
  return {
    match: partial?.match ?? null,
    primaryTeam: partial?.primaryTeam ?? null,
    userId: partial?.userId ?? null,
    available: false,
    participationCount: 0,
    totalComments: 0,
    userHasSubmitted: false,
    userMomPlayerId: null,
    players: [],
    topRatedPlayer: null,
    topMomPlayer: null,
    message: partial?.message ?? null,
  };
}

function sortPlayers<
  T extends { position: string; squadNumber: number | null; name: string },
>(players: T[]) {
  return [...players].sort((left, right) => {
    const positionGap =
      (POSITION_ORDER[left.position] ?? 99) - (POSITION_ORDER[right.position] ?? 99);
    if (positionGap !== 0) return positionGap;

    const squadGap = (left.squadNumber ?? 999) - (right.squadNumber ?? 999);
    if (squadGap !== 0) return squadGap;

    return left.name.localeCompare(right.name, "ko");
  });
}

function getRatingTargetMatch(matches: Match[]) {
  return [...matches].reverse().find((match) => match.status === "finished") ?? null;
}

function getRatingEligiblePlayerIds(lineup: MatchLineup) {
  const excluded = new Set(lineup.rating_excluded_player_ids ?? []);
  return [...lineup.starters_player_ids, ...lineup.bench_player_ids].filter(
    (playerId) => !excluded.has(playerId),
  );
}

function buildComments(
  playerId: string,
  ratings: MatchPlayerRating[],
  likeCountByRatingId: Map<string, number>,
  likedRatingIds: Set<string>,
  nicknameMap: Map<string, string>,
  myUserId: string | null,
) {
  return ratings
    .filter((row) => Boolean(row.comment?.trim()) && !row.is_hidden)
    .map((row) => ({
      ratingId: row.id,
      playerId,
      userId: row.user_id,
      nickname: nicknameMap.get(row.user_id) ?? "익명",
      rating: row.rating,
      comment: row.comment?.trim() ?? "",
      likeCount: likeCountByRatingId.get(row.id) ?? 0,
      likedByMe: likedRatingIds.has(row.id),
      isMine: myUserId === row.user_id,
      isFeatured: Boolean(row.is_featured),
      createdAt: row.created_at,
    }))
    .sort(
      (left, right) =>
        Number(right.isFeatured) - Number(left.isFeatured) ||
        right.likeCount - left.likeCount ||
        parseKstDate(right.createdAt).getTime() -
          parseKstDate(left.createdAt).getTime(),
    );
}

export async function getCommunityPlayerRatingsData(): Promise<CommunityPlayerRatingsData> {
  const supabase = createPublicSupabaseClient();
  const admin = createServiceSupabaseClient() ?? createPublicSupabaseClient();
  const user = (await getUserFromSession()) as UserAccount | null;

  if (!supabase || !admin) {
    return emptyRatingsData({
      userId: user?.id ?? null,
      message: "평점 데이터를 불러올 수 없습니다.",
    });
  }

  const { data: primaryTeamData } = await supabase
    .from("teams")
    .select("*")
    .eq("is_primary", true)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const primaryTeam = (primaryTeamData as Team | null) ?? null;
  if (!primaryTeam) {
    return emptyRatingsData({
      userId: user?.id ?? null,
      message: "내 팀 정보를 찾지 못했습니다.",
    });
  }

  const { data: matchRows } = await supabase
    .from("league_matches")
    .select(
      "*, season_record:seasons(*), home_team:teams!league_matches_home_team_id_fkey(*), away_team:teams!league_matches_away_team_id_fkey(*)",
    )
    .or(`home_team_id.eq.${primaryTeam.id},away_team_id.eq.${primaryTeam.id}`)
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

  if (!teams.find((team) => team.id === primaryTeam.id)) {
    teams.unshift(primaryTeam);
  }

  const matches = buildClubMatches(leagueMatches, teams, primaryTeam.id);
  const targetMatch = getRatingTargetMatch(matches);

  if (!targetMatch) {
    return emptyRatingsData({
      primaryTeam,
      userId: user?.id ?? null,
      message: "평점을 남길 수 있는 종료 경기가 아직 없습니다.",
    });
  }

  const { data: lineupData } = await admin
    .from("match_lineups")
    .select("*")
    .eq("match_id", targetMatch.id)
    .eq("team_id", primaryTeam.id)
    .maybeSingle();

  const lineup = (lineupData as MatchLineup | null) ?? null;
  const lineupPlayerIds = lineup ? getRatingEligiblePlayerIds(lineup) : [];

  if (!lineup || !lineupPlayerIds.length) {
    return emptyRatingsData({
      match: targetMatch,
      primaryTeam,
      userId: user?.id ?? null,
      message: "라인업이 등록되면 평점에 참여할 수 있습니다.",
    });
  }

  const [{ data: rosterRows }, { data: ratingRows }, { data: likeRows }, { data: momRows }] =
    await Promise.all([
      admin
        .from("player_seasons")
        .select("player_id, squad_number, is_captain, player:players(*)")
        .eq("team_id", primaryTeam.id)
        .eq("season", targetMatch.season)
        .in("player_id", lineupPlayerIds),
      admin
        .from("match_player_ratings")
        .select("*")
        .eq("match_id", targetMatch.id)
        .order("created_at", { ascending: false }),
      admin
        .from("match_player_rating_likes")
        .select("*")
        .eq("match_id", targetMatch.id),
      admin
        .from("match_mom_votes")
        .select("*")
        .eq("match_id", targetMatch.id),
    ]);

  const normalizedRoster = ((rosterRows ?? []) as Array<{
    player_id: string;
    squad_number: number | null;
    is_captain: boolean | null;
    player?: Player | Player[] | null;
  }>).map((row) => ({
    playerId: row.player_id,
    squadNumber: row.squad_number ?? null,
    isCaptain: Boolean(row.is_captain),
    player: Array.isArray(row.player) ? (row.player[0] ?? null) : (row.player ?? null),
  }));

  const rosterMap = new Map(
    normalizedRoster.map((row) => [
      row.playerId,
      {
        playerId: row.playerId,
        name: row.player?.name ?? "선수",
        position: row.player?.position ?? "-",
        squadNumber: row.squadNumber,
        isCaptain: row.isCaptain,
      },
    ]),
  );

  const ratings = (ratingRows ?? []) as MatchPlayerRating[];
  const likes = (likeRows ?? []) as MatchPlayerRatingLike[];
  const momVotes = (momRows ?? []) as MatchMomVote[];

  const userIds = Array.from(new Set(ratings.map((row) => row.user_id).filter(Boolean)));
  const { data: usersData } =
    userIds.length > 0
      ? await admin.from("users").select("id, nickname").in("id", userIds)
      : { data: [] };

  const nicknameMap = new Map(
    ((usersData ?? []) as Array<{ id: string; nickname: string }>).map((row) => [
      row.id,
      row.nickname,
    ]),
  );

  const likeCountByRatingId = new Map<string, number>();
  const likedRatingIds = new Set<string>();
  for (const like of likes) {
    likeCountByRatingId.set(
      like.rating_id,
      (likeCountByRatingId.get(like.rating_id) ?? 0) + 1,
    );
    if (user?.id && like.user_id === user.id) {
      likedRatingIds.add(like.rating_id);
    }
  }

  const ratingsByPlayer = new Map<string, MatchPlayerRating[]>();
  const userRatingsByPlayer = new Map<string, MatchPlayerRating>();
  for (const rating of ratings) {
    const list = ratingsByPlayer.get(rating.player_id) ?? [];
    list.push(rating);
    ratingsByPlayer.set(rating.player_id, list);
    if (user?.id && rating.user_id === user.id) {
      userRatingsByPlayer.set(rating.player_id, rating);
    }
  }

  const momCounts = new Map<string, number>();
  let userMomPlayerId: string | null = null;
  for (const vote of momVotes) {
    momCounts.set(vote.player_id, (momCounts.get(vote.player_id) ?? 0) + 1);
    if (user?.id && vote.user_id === user.id) {
      userMomPlayerId = vote.player_id;
    }
  }

  const participationUsers = new Set<string>();
  ratings.forEach((row) => participationUsers.add(row.user_id));
  momVotes.forEach((row) => participationUsers.add(row.user_id));

  const playerRows = lineupPlayerIds
    .map((playerId): CommunityPlayerRatingRow | null => {
      const roster = rosterMap.get(playerId);
      if (!roster) return null;

      const playerRatings = ratingsByPlayer.get(playerId) ?? [];
      const voteCount = playerRatings.length;
      const averageRating = voteCount
        ? Number(
            (
              playerRatings.reduce((sum, row) => sum + row.rating, 0) / voteCount
            ).toFixed(2),
          )
        : null;

      const comments = buildComments(
        playerId,
        playerRatings,
        likeCountByRatingId,
        likedRatingIds,
        nicknameMap,
        user?.id ?? null,
      );
      const myRating = userRatingsByPlayer.get(playerId);

      return {
        playerId,
        name: roster.name,
        position: roster.position,
        squadNumber: roster.squadNumber,
        isCaptain: roster.isCaptain,
        averageRating,
        voteCount,
        momVoteCount: momCounts.get(playerId) ?? 0,
        userRating: myRating?.rating ?? null,
        userComment: myRating?.comment ?? "",
        comments,
        topComment: comments[0] ?? null,
      } satisfies CommunityPlayerRatingRow;
    })
    .filter((row): row is CommunityPlayerRatingRow => row !== null);

  const players = sortPlayers(playerRows);

  const topRatedPlayer =
    [...players]
      .filter((row) => row.averageRating !== null)
      .sort(
        (left, right) =>
          (right.averageRating ?? 0) - (left.averageRating ?? 0) ||
          right.voteCount - left.voteCount ||
          (right.momVoteCount ?? 0) - (left.momVoteCount ?? 0),
      )[0] ?? null;

  const topMomPlayer =
    [...players]
      .filter((row) => row.momVoteCount > 0)
      .sort(
        (left, right) =>
          right.momVoteCount - left.momVoteCount ||
          (right.averageRating ?? 0) - (left.averageRating ?? 0) ||
          right.voteCount - left.voteCount,
      )[0] ?? null;

  return {
    match: targetMatch,
    primaryTeam,
    userId: user?.id ?? null,
    available: true,
    participationCount: participationUsers.size,
    totalComments: players.reduce((sum, player) => sum + player.comments.length, 0),
    userHasSubmitted:
      players.every((player) => player.userRating !== null) && Boolean(userMomPlayerId),
    userMomPlayerId,
    players,
    topRatedPlayer,
    topMomPlayer,
    message: null,
  };
}
