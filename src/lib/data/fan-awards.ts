import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parseKstDate } from "@/lib/utils";
import type {
  FanAwardMonthlyResult,
  FanAwardSeasonResult,
  MatchPlayerRating,
  Player,
  PlayerFanRatingResult,
  Season,
  Team,
} from "@/types";

type DataSupabase = NonNullable<
  Awaited<ReturnType<typeof createServerSupabaseClient>>
> | NonNullable<ReturnType<typeof createServiceSupabaseClient>>;

export interface FanAwardSeasonOption {
  id: string;
  code: string;
  isCurrent: boolean;
}

export interface FanAwardMonthlyEntry {
  id: string;
  rank: number;
  playerId: string;
  playerName: string;
  playerPosition: string;
  averageRating: number | null;
  momCount: number;
  matchCount: number;
  voteCount: number;
  topComment: string | null;
  topCommentLikes: number;
  isWinner: boolean;
}

export interface FanAwardMonthlyGroup {
  month: string;
  monthLabel: string;
  winner: FanAwardMonthlyEntry | null;
  entries: FanAwardMonthlyEntry[];
}

export interface FanAwardSeasonEntry {
  id: string;
  rank: number;
  playerId: string;
  playerName: string;
  playerPosition: string;
  averageRating: number | null;
  momCount: number;
  monthlyAwardCount: number;
  matchCount: number;
  voteCount: number;
  topComment: string | null;
  topCommentLikes: number;
  isMvp: boolean;
}

export interface FanAwardsPageData {
  seasons: FanAwardSeasonOption[];
  selectedSeason: FanAwardSeasonOption | null;
  monthlyGroups: FanAwardMonthlyGroup[];
  seasonEntries: FanAwardSeasonEntry[];
}

export interface FanRatingArchiveSummaryEntry {
  playerId: string;
  playerName: string;
  playerPosition: string;
  averageRating: number | null;
  momCount: number;
  matchCount: number;
  voteCount: number;
}

export interface FanRatingArchiveMatchEntry {
  matchId: string;
  matchDate: string;
  competition: string;
  roundLabel: string;
  title: string;
  topRatedPlayer: {
    name: string;
    averageRating: number | null;
  } | null;
  momPlayer: {
    name: string;
    momVoteCount: number;
  } | null;
  topComment: {
    playerName: string;
    comment: string;
    likes: number;
  } | null;
}

export interface FanRatingsArchivePageData {
  seasons: FanAwardSeasonOption[];
  selectedSeason: FanAwardSeasonOption | null;
  leaderboard: FanRatingArchiveSummaryEntry[];
  matches: FanRatingArchiveMatchEntry[];
}

export interface AdminFanAwardCommentItem {
  id: string;
  matchId: string;
  playerId: string;
  playerName: string;
  playerPosition: string;
  userNickname: string;
  seasonCode: string;
  matchTitle: string;
  matchDate: string;
  competition: string;
  roundLabel: string;
  rating: number;
  comment: string;
  likeCount: number;
  isHidden: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface AdminFanAwardCommentsPage {
  items: AdminFanAwardCommentItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface AdminFanAwardsPageData {
  seasons: FanAwardSeasonOption[];
  selectedSeason: FanAwardSeasonOption | null;
  selectedMonth: string | null;
  monthOptions: string[];
  monthlyGroups: FanAwardMonthlyGroup[];
  seasonEntries: FanAwardSeasonEntry[];
  commentsPage: AdminFanAwardCommentsPage;
}

const COMMENT_PAGE_SIZE = 10;

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normalizeAwardMonth(value: string) {
  return value.slice(0, 7);
}

async function getDataClient(): Promise<DataSupabase | null> {
  return createServiceSupabaseClient() ?? (await createServerSupabaseClient());
}

function sortSeasonOptions(seasons: Season[]) {
  return [...seasons]
    .sort((left, right) => {
      if (left.is_current && !right.is_current) return -1;
      if (!left.is_current && right.is_current) return 1;
      return right.code.localeCompare(left.code);
    })
    .map((season) => ({
      id: season.id,
      code: season.code,
      isCurrent: season.is_current,
    })) satisfies FanAwardSeasonOption[];
}

function resolveSelectedSeason(
  seasons: FanAwardSeasonOption[],
  seasonCode?: string,
) {
  return (
    seasons.find((season) => season.code === seasonCode) ??
    seasons.find((season) => season.isCurrent) ??
    seasons[0] ??
    null
  );
}

function formatAwardMonthLabel(value: string) {
  const parsed = parseKstDate(`${normalizeAwardMonth(value)}-01T00:00:00`);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    timeZone: "Asia/Seoul",
  }).format(parsed);
}

function getRoundLabel(round: number | null, stageLabel: string | null) {
  if (stageLabel?.trim()) return stageLabel.trim();
  if (round === 99) return "PO";
  if (typeof round === "number") return `${round}R`;
  return "-";
}

async function getPrimaryTeam(supabase: DataSupabase) {
  const { data } = await supabase
    .from("teams")
    .select("*")
    .eq("is_primary", true)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return (data ?? null) as Team | null;
}

async function getSeasonOptions(supabase: DataSupabase) {
  const { data, error } = await supabase
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .order("code", { ascending: false });

  if (error) return [] as FanAwardSeasonOption[];
  return sortSeasonOptions((data ?? []) as Season[]);
}

async function getFinishedPrimaryMatchesForSeason(
  supabase: DataSupabase,
  seasonId: string,
  primaryTeamId: string,
) {
  const { data, error } = await supabase
    .from("league_matches")
    .select(
      "id, season_id, match_date, competition, round, stage_label, home_team_id, away_team_id, home_team:teams!league_matches_home_team_id_fkey(name, short_name), away_team:teams!league_matches_away_team_id_fkey(name, short_name)",
    )
    .eq("season_id", seasonId)
    .eq("status", "finished")
    .or(`home_team_id.eq.${primaryTeamId},away_team_id.eq.${primaryTeamId}`)
    .order("match_date", { ascending: false });

  if (error) {
    return [] as Array<{
      id: string;
      season_id: string;
      match_date: string;
      competition: string;
      round: number | null;
      stage_label: string | null;
      home_team_id: string;
      away_team_id: string;
      home_team?:
        | { name?: string | null; short_name?: string | null }
        | Array<{ name?: string | null; short_name?: string | null }>
        | null;
      away_team?:
        | { name?: string | null; short_name?: string | null }
        | Array<{ name?: string | null; short_name?: string | null }>
        | null;
    }>;
  }

  return (data ?? []) as Array<{
    id: string;
    season_id: string;
    match_date: string;
    competition: string;
    round: number | null;
    stage_label: string | null;
    home_team_id: string;
    away_team_id: string;
    home_team?:
      | { name?: string | null; short_name?: string | null }
      | Array<{ name?: string | null; short_name?: string | null }>
      | null;
    away_team?:
      | { name?: string | null; short_name?: string | null }
      | Array<{ name?: string | null; short_name?: string | null }>
      | null;
  }>;
}

async function getSeasonSettledResults(
  supabase: DataSupabase,
  seasonId: string,
  primaryTeamId: string,
) {
  const matches = await getFinishedPrimaryMatchesForSeason(
    supabase,
    seasonId,
    primaryTeamId,
  );
  const matchIds = matches.map((match) => match.id);

  if (!matchIds.length) {
    return {
      matches,
      results: [] as PlayerFanRatingResult[],
      playerMap: new Map<string, Player>(),
    };
  }

  const [{ data: resultRows, error: resultError }, { data: playerRows }] =
    await Promise.all([
      supabase.from("player_fan_rating_results").select("*").in("match_id", matchIds),
      supabase.from("players").select("*"),
    ]);

  if (resultError) {
    return {
      matches,
      results: [] as PlayerFanRatingResult[],
      playerMap: new Map<string, Player>(),
    };
  }

  return {
    matches,
    results: (resultRows ?? []) as PlayerFanRatingResult[],
    playerMap: new Map(
      ((playerRows ?? []) as Player[]).map((player) => [player.id, player]),
    ),
  };
}

function selectRepresentativeComment(
  results: PlayerFanRatingResult[],
  playerMap: Map<string, Player>,
) {
  const representative = [...results]
    .filter((item) => Boolean(item.top_comment?.trim()))
    .sort((left, right) => {
      if (right.top_comment_like_count !== left.top_comment_like_count) {
        return right.top_comment_like_count - left.top_comment_like_count;
      }

      return (
        parseKstDate(right.updated_at).getTime() -
        parseKstDate(left.updated_at).getTime()
      );
    })[0];

  if (!representative?.top_comment) {
    return null;
  }

  return {
    playerId: representative.player_id,
    playerName: playerMap.get(representative.player_id)?.name ?? "선수",
    comment: representative.top_comment,
    likes: representative.top_comment_like_count,
    ratingId: representative.top_comment_rating_id ?? null,
  };
}

function buildSeasonLeaderboard(
  results: PlayerFanRatingResult[],
  playerMap: Map<string, Player>,
) {
  const grouped = new Map<string, PlayerFanRatingResult[]>();

  for (const result of results) {
    const bucket = grouped.get(result.player_id) ?? [];
    bucket.push(result);
    grouped.set(result.player_id, bucket);
  }

  return [...grouped.entries()]
    .map(([playerId, playerResults]) => {
      const ratedResults = playerResults.filter(
        (row) =>
          row.fan_rating_average !== null &&
          row.fan_rating_average !== undefined &&
          row.rating_vote_count > 0,
      );
      const averageRating = ratedResults.length
        ? Number(
            (
              ratedResults.reduce(
                (sum, row) => sum + (row.fan_rating_average ?? 0),
                0,
              ) / ratedResults.length
            ).toFixed(2),
          )
        : null;
      const voteCount = ratedResults.reduce(
        (sum, row) => sum + row.rating_vote_count,
        0,
      );
      const momCount = playerResults.filter((row) => row.is_mom_winner).length;
      const player = playerMap.get(playerId);

      return {
        playerId,
        playerName: player?.name ?? "선수",
        playerPosition: player?.position ?? "-",
        averageRating,
        momCount,
        matchCount: ratedResults.length,
        voteCount,
      } satisfies FanRatingArchiveSummaryEntry;
    })
    .filter((item) => item.matchCount > 0)
    .sort((left, right) => {
      if ((right.averageRating ?? -1) !== (left.averageRating ?? -1)) {
        return (right.averageRating ?? -1) - (left.averageRating ?? -1);
      }
      if (right.momCount !== left.momCount) return right.momCount - left.momCount;
      if (right.voteCount !== left.voteCount) return right.voteCount - left.voteCount;
      return left.playerName.localeCompare(right.playerName, "ko");
    });
}

function buildArchiveMatchEntries(
  matches: Array<{
    id: string;
    season_id: string;
    match_date: string;
    competition: string;
    round: number | null;
    stage_label: string | null;
    home_team_id: string;
    away_team_id: string;
    home_team?:
      | { name?: string | null; short_name?: string | null }
      | Array<{ name?: string | null; short_name?: string | null }>
      | null;
    away_team?:
      | { name?: string | null; short_name?: string | null }
      | Array<{ name?: string | null; short_name?: string | null }>
      | null;
  }>,
  results: PlayerFanRatingResult[],
  playerMap: Map<string, Player>,
) {
  const resultsByMatchId = new Map<string, PlayerFanRatingResult[]>();

  for (const result of results) {
    const bucket = resultsByMatchId.get(result.match_id) ?? [];
    bucket.push(result);
    resultsByMatchId.set(result.match_id, bucket);
  }

  return matches.map((match) => {
    const matchResults = resultsByMatchId.get(match.id) ?? [];
    const topRated = [...matchResults]
      .filter(
        (item) =>
          item.fan_rating_average !== null &&
          item.fan_rating_average !== undefined &&
          item.rating_vote_count > 0,
      )
      .sort((left, right) => {
        if ((right.fan_rating_average ?? -1) !== (left.fan_rating_average ?? -1)) {
          return (right.fan_rating_average ?? -1) - (left.fan_rating_average ?? -1);
        }
        return right.rating_vote_count - left.rating_vote_count;
      })[0];

    const momPlayer = [...matchResults]
      .filter((item) => item.mom_vote_count > 0)
      .sort((left, right) => {
        if (right.mom_vote_count !== left.mom_vote_count) {
          return right.mom_vote_count - left.mom_vote_count;
        }
        return (right.fan_rating_average ?? -1) - (left.fan_rating_average ?? -1);
      })[0];

    const representative = selectRepresentativeComment(matchResults, playerMap);
    const homeTeam = relationOne(match.home_team);
    const awayTeam = relationOne(match.away_team);

    return {
      matchId: match.id,
      matchDate: match.match_date,
      competition: match.competition,
      roundLabel: getRoundLabel(match.round, match.stage_label),
      title: `${homeTeam?.short_name ?? homeTeam?.name ?? "홈팀"} vs ${awayTeam?.short_name ?? awayTeam?.name ?? "원정팀"}`,
      topRatedPlayer: topRated
        ? {
            name: playerMap.get(topRated.player_id)?.name ?? "선수",
            averageRating: topRated.fan_rating_average ?? null,
          }
        : null,
      momPlayer: momPlayer
        ? {
            name: playerMap.get(momPlayer.player_id)?.name ?? "선수",
            momVoteCount: momPlayer.mom_vote_count,
          }
        : null,
      topComment: representative
        ? {
            playerName: representative.playerName,
            comment: representative.comment,
            likes: representative.likes,
          }
        : null,
    } satisfies FanRatingArchiveMatchEntry;
  });
}

function normalizeMonthlySnapshotRows(
  rows: FanAwardMonthlyResult[],
  playerMap: Map<string, Player>,
) {
  const groups = new Map<string, FanAwardMonthlyEntry[]>();

  for (const row of rows) {
    const player = relationOne(row.player) ?? playerMap.get(row.player_id) ?? null;
    const awardMonth = normalizeAwardMonth(row.award_month);
    const bucket = groups.get(awardMonth) ?? [];
    bucket.push({
      id: row.id,
      rank: row.rank,
      playerId: row.player_id,
      playerName: player?.name ?? "선수",
      playerPosition: player?.position ?? "-",
      averageRating: row.average_rating ?? null,
      momCount: row.mom_count,
      matchCount: row.match_count,
      voteCount: row.vote_count,
      topComment: row.top_comment ?? null,
      topCommentLikes: row.top_comment_like_count,
      isWinner: row.is_winner,
    });
    groups.set(awardMonth, bucket);
  }

  return [...groups.entries()]
    .sort((left, right) => right[0].localeCompare(left[0]))
    .map(([month, entries]) => {
      const sortedEntries = [...entries].sort((left, right) => left.rank - right.rank);
      return {
        month,
        monthLabel: formatAwardMonthLabel(month),
        winner: sortedEntries.find((entry) => entry.isWinner) ?? sortedEntries[0] ?? null,
        entries: sortedEntries,
      } satisfies FanAwardMonthlyGroup;
    });
}

function normalizeSeasonSnapshotRows(
  rows: FanAwardSeasonResult[],
  playerMap: Map<string, Player>,
) {
  return rows
    .map((row) => {
      const player = relationOne(row.player) ?? playerMap.get(row.player_id) ?? null;
      return {
        id: row.id,
        rank: row.rank,
        playerId: row.player_id,
        playerName: player?.name ?? "선수",
        playerPosition: player?.position ?? "-",
        averageRating: row.average_rating ?? null,
        momCount: row.mom_count,
        monthlyAwardCount: row.monthly_award_count,
        matchCount: row.match_count,
        voteCount: row.vote_count,
        topComment: row.top_comment ?? null,
        topCommentLikes: row.top_comment_like_count,
        isMvp: row.is_mvp,
      } satisfies FanAwardSeasonEntry;
    })
    .sort((left, right) => left.rank - right.rank);
}

export async function getFanAwardsPageData(
  seasonCode?: string,
): Promise<FanAwardsPageData> {
  const supabase = await getDataClient();
  if (!supabase) {
    return { seasons: [], selectedSeason: null, monthlyGroups: [], seasonEntries: [] };
  }

  const seasons = await getSeasonOptions(supabase);
  const selectedSeason = resolveSelectedSeason(seasons, seasonCode);

  if (!selectedSeason) {
    return { seasons, selectedSeason: null, monthlyGroups: [], seasonEntries: [] };
  }

  const [{ data: playerRows }, { data: monthlyRows }, { data: seasonRows }] =
    await Promise.all([
      supabase.from("players").select("*"),
      supabase
        .from("fan_award_monthly_results")
        .select("*, player:players(*)")
        .eq("season_id", selectedSeason.id)
        .order("award_month", { ascending: false })
        .order("rank", { ascending: true }),
      supabase
        .from("fan_award_season_results")
        .select("*, player:players(*)")
        .eq("season_id", selectedSeason.id)
        .order("rank", { ascending: true }),
    ]);

  const playerMap = new Map(
    ((playerRows ?? []) as Player[]).map((player) => [player.id, player]),
  );

  return {
    seasons,
    selectedSeason,
    monthlyGroups: normalizeMonthlySnapshotRows(
      (monthlyRows ?? []) as FanAwardMonthlyResult[],
      playerMap,
    ),
    seasonEntries: normalizeSeasonSnapshotRows(
      (seasonRows ?? []) as FanAwardSeasonResult[],
      playerMap,
    ),
  };
}

export async function getFanRatingsArchivePageData(
  seasonCode?: string,
): Promise<FanRatingsArchivePageData> {
  const supabase = await getDataClient();
  if (!supabase) {
    return { seasons: [], selectedSeason: null, leaderboard: [], matches: [] };
  }

  const [seasons, primaryTeam] = await Promise.all([
    getSeasonOptions(supabase),
    getPrimaryTeam(supabase),
  ]);
  const selectedSeason = resolveSelectedSeason(seasons, seasonCode);

  if (!selectedSeason || !primaryTeam?.id) {
    return { seasons, selectedSeason, leaderboard: [], matches: [] };
  }

  const { matches, results, playerMap } = await getSeasonSettledResults(
    supabase,
    selectedSeason.id,
    primaryTeam.id,
  );

  return {
    seasons,
    selectedSeason,
    leaderboard: buildSeasonLeaderboard(results, playerMap),
    matches: buildArchiveMatchEntries(matches, results, playerMap),
  };
}

async function getSeasonMonthOptions(
  supabase: DataSupabase,
  seasonId: string,
  primaryTeamId: string,
) {
  const { matches, results } = await getSeasonSettledResults(
    supabase,
    seasonId,
    primaryTeamId,
  );
  const settledMatchIds = new Set(results.map((result) => result.match_id));

  return [
    ...new Set(
      matches
        .filter((match) => settledMatchIds.has(match.id))
        .map((match) => normalizeAwardMonth(match.match_date)),
    ),
  ].sort((left, right) => right.localeCompare(left));
}

async function getCommentLikesForRatingIds(
  supabase: DataSupabase,
  ratingIds: string[],
) {
  if (!ratingIds.length) return new Map<string, number>();

  const { data } = await supabase
    .from("match_player_rating_likes")
    .select("rating_id")
    .in("rating_id", ratingIds);

  const likeCountMap = new Map<string, number>();
  for (const row of (data ?? []) as Array<{ rating_id?: string | null }>) {
    const ratingId = row.rating_id ?? "";
    if (!ratingId) continue;
    likeCountMap.set(ratingId, (likeCountMap.get(ratingId) ?? 0) + 1);
  }

  return likeCountMap;
}

export async function getAdminFanAwardCommentsPage(
  seasonId: string,
  page = 1,
): Promise<AdminFanAwardCommentsPage> {
  const supabase = await getDataClient();
  if (!supabase || !seasonId) {
    return {
      items: [],
      page: 1,
      pageSize: COMMENT_PAGE_SIZE,
      totalCount: 0,
      totalPages: 1,
    };
  }

  const primaryTeam = await getPrimaryTeam(supabase);
  if (!primaryTeam?.id) {
    return {
      items: [],
      page: 1,
      pageSize: COMMENT_PAGE_SIZE,
      totalCount: 0,
      totalPages: 1,
    };
  }

  const matches = await getFinishedPrimaryMatchesForSeason(
    supabase,
    seasonId,
    primaryTeam.id,
  );
  const matchIds = matches.map((match) => match.id);

  if (!matchIds.length) {
    return {
      items: [],
      page: 1,
      pageSize: COMMENT_PAGE_SIZE,
      totalCount: 0,
      totalPages: 1,
    };
  }

  const safePage = Math.max(1, Math.floor(page) || 1);
  const from = (safePage - 1) * COMMENT_PAGE_SIZE;
  const to = from + COMMENT_PAGE_SIZE - 1;

  const { data: ratingRows, count, error } = await supabase
    .from("match_player_ratings")
    .select(
      "id, match_id, player_id, user_id, rating, comment, is_hidden, is_featured, created_at",
      { count: "exact" },
    )
    .in("match_id", matchIds)
    .not("comment", "is", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return {
      items: [],
      page: safePage,
      pageSize: COMMENT_PAGE_SIZE,
      totalCount: 0,
      totalPages: 1,
    };
  }

  const ratings = (ratingRows ?? []) as Array<
    Pick<
      MatchPlayerRating,
      | "id"
      | "match_id"
      | "player_id"
      | "user_id"
      | "rating"
      | "comment"
      | "is_hidden"
      | "is_featured"
      | "created_at"
    >
  >;

  if (!ratings.length) {
    return {
      items: [],
      page: safePage,
      pageSize: COMMENT_PAGE_SIZE,
      totalCount: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / COMMENT_PAGE_SIZE)),
    };
  }

  const ratingIds = ratings.map((row) => row.id);
  const playerIds = Array.from(new Set(ratings.map((row) => row.player_id)));
  const userIds = Array.from(new Set(ratings.map((row) => row.user_id)));
  const usedMatchIds = Array.from(new Set(ratings.map((row) => row.match_id)));

  const [likeCountMap, { data: playerRows }, { data: userRows }, { data: matchRows }] =
    await Promise.all([
      getCommentLikesForRatingIds(supabase, ratingIds),
      supabase.from("players").select("id, name, position").in("id", playerIds),
      supabase.from("users").select("id, nickname").in("id", userIds),
      supabase
        .from("league_matches")
        .select(
          "id, match_date, competition, round, stage_label, season_record:seasons(code), home_team:teams!league_matches_home_team_id_fkey(name, short_name), away_team:teams!league_matches_away_team_id_fkey(name, short_name)",
        )
        .in("id", usedMatchIds),
    ]);

  const playerMap = new Map(
    ((playerRows ?? []) as Array<Pick<Player, "id" | "name" | "position">>).map(
      (player) => [player.id, player],
    ),
  );
  const userMap = new Map(
    ((userRows ?? []) as Array<{ id: string; nickname: string }>).map((user) => [
      user.id,
      user.nickname,
    ]),
  );
  const matchMap = new Map(
    ((matchRows ?? []) as Array<{
      id: string;
      match_date: string;
      competition: string;
      round: number | null;
      stage_label: string | null;
      season_record?:
        | { code?: string | null }
        | Array<{ code?: string | null }>
        | null;
      home_team?:
        | { name?: string | null; short_name?: string | null }
        | Array<{ name?: string | null; short_name?: string | null }>
        | null;
      away_team?:
        | { name?: string | null; short_name?: string | null }
        | Array<{ name?: string | null; short_name?: string | null }>
        | null;
    }>).map((match) => [match.id, match]),
  );

  return {
    items: ratings.map((row) => {
      const player = playerMap.get(row.player_id);
      const match = matchMap.get(row.match_id);
      const seasonRecord = relationOne(match?.season_record);
      const homeTeam = relationOne(match?.home_team);
      const awayTeam = relationOne(match?.away_team);

      return {
        id: row.id,
        matchId: row.match_id,
        playerId: row.player_id,
        playerName: player?.name ?? "선수",
        playerPosition: player?.position ?? "-",
        userNickname: userMap.get(row.user_id) ?? "익명",
        seasonCode: seasonRecord?.code ?? "",
        matchTitle: `${homeTeam?.short_name ?? homeTeam?.name ?? "홈팀"} vs ${awayTeam?.short_name ?? awayTeam?.name ?? "원정팀"}`,
        matchDate: match?.match_date ?? "",
        competition: match?.competition ?? "경기",
        roundLabel: getRoundLabel(match?.round ?? null, match?.stage_label ?? null),
        rating: row.rating,
        comment: row.comment?.trim() ?? "",
        likeCount: likeCountMap.get(row.id) ?? 0,
        isHidden: Boolean(row.is_hidden),
        isFeatured: Boolean(row.is_featured),
        createdAt: row.created_at,
      } satisfies AdminFanAwardCommentItem;
    }),
    page: safePage,
    pageSize: COMMENT_PAGE_SIZE,
    totalCount: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / COMMENT_PAGE_SIZE)),
  };
}

export async function getAdminFanAwardsPageData(
  seasonCode?: string,
  month?: string,
  page = 1,
): Promise<AdminFanAwardsPageData> {
  const supabase = await getDataClient();
  if (!supabase) {
    return {
      seasons: [],
      selectedSeason: null,
      selectedMonth: null,
      monthOptions: [],
      monthlyGroups: [],
      seasonEntries: [],
      commentsPage: {
        items: [],
        page: 1,
        pageSize: COMMENT_PAGE_SIZE,
        totalCount: 0,
        totalPages: 1,
      },
    };
  }

  const [seasons, primaryTeam] = await Promise.all([
    getSeasonOptions(supabase),
    getPrimaryTeam(supabase),
  ]);
  const selectedSeason = resolveSelectedSeason(seasons, seasonCode);

  if (!selectedSeason || !primaryTeam?.id) {
    return {
      seasons,
      selectedSeason,
      selectedMonth: null,
      monthOptions: [],
      monthlyGroups: [],
      seasonEntries: [],
      commentsPage: {
        items: [],
        page: 1,
        pageSize: COMMENT_PAGE_SIZE,
        totalCount: 0,
        totalPages: 1,
      },
    };
  }

  const [overview, monthOptions, commentsPage] = await Promise.all([
    getFanAwardsPageData(selectedSeason.code),
    getSeasonMonthOptions(supabase, selectedSeason.id, primaryTeam.id),
    getAdminFanAwardCommentsPage(selectedSeason.id, page),
  ]);

  const selectedMonth =
    month && monthOptions.includes(month) ? month : monthOptions[0] ?? null;

  return {
    seasons,
    selectedSeason,
    selectedMonth,
    monthOptions,
    monthlyGroups: selectedMonth
      ? overview.monthlyGroups.filter((group) => group.month === selectedMonth)
      : overview.monthlyGroups,
    seasonEntries: overview.seasonEntries,
    commentsPage,
  };
}

function getMonthDateRange(awardMonth: string) {
  const [year, month] = awardMonth.split("-").map((value) => Number.parseInt(value, 10));
  const end = new Date(Date.UTC(year, month, 1));

  return {
    start: `${awardMonth}-01T00:00:00`,
    end: `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, "0")}-01T00:00:00`,
  };
}

async function buildSnapshotAggregate(
  supabase: DataSupabase,
  seasonId: string,
  resultRows: PlayerFanRatingResult[],
) {
  const playerIds = Array.from(new Set(resultRows.map((row) => row.player_id)));
  const { data: playerRows } = playerIds.length
    ? await supabase.from("players").select("*").in("id", playerIds)
    : { data: [] };

  const playerMap = new Map(
    ((playerRows ?? []) as Player[]).map((player) => [player.id, player]),
  );

  const grouped = new Map<string, PlayerFanRatingResult[]>();
  for (const row of resultRows) {
    const bucket = grouped.get(row.player_id) ?? [];
    bucket.push(row);
    grouped.set(row.player_id, bucket);
  }

  return [...grouped.entries()]
    .map(([playerId, rows]) => {
      const ratedRows = rows.filter(
        (row) =>
          row.fan_rating_average !== null &&
          row.fan_rating_average !== undefined &&
          row.rating_vote_count > 0,
      );
      const averageRating = ratedRows.length
        ? Number(
            (
              ratedRows.reduce(
                (sum, row) => sum + (row.fan_rating_average ?? 0),
                0,
              ) / ratedRows.length
            ).toFixed(2),
          )
        : null;
      const voteCount = ratedRows.reduce(
        (sum, row) => sum + row.rating_vote_count,
        0,
      );
      const topComment = selectRepresentativeComment(rows, playerMap);

      return {
        season_id: seasonId,
        player_id: playerId,
        average_rating: averageRating,
        mom_count: rows.filter((row) => row.is_mom_winner).length,
        match_count: ratedRows.length,
        vote_count: voteCount,
        top_comment: topComment?.comment ?? null,
        top_comment_like_count: topComment?.likes ?? 0,
        top_comment_rating_id: topComment?.ratingId ?? null,
      };
    })
    .filter((row) => row.match_count > 0)
    .sort((left, right) => {
      if ((right.average_rating ?? -1) !== (left.average_rating ?? -1)) {
        return (right.average_rating ?? -1) - (left.average_rating ?? -1);
      }
      if (right.mom_count !== left.mom_count) return right.mom_count - left.mom_count;
      if (right.vote_count !== left.vote_count) return right.vote_count - left.vote_count;
      if (right.match_count !== left.match_count) return right.match_count - left.match_count;
      return left.player_id.localeCompare(right.player_id);
    });
}

export async function generateMonthlyFanAwardSnapshot(
  supabase: DataSupabase,
  params: {
    seasonId: string;
    awardMonth: string;
    confirmedBy?: string | null;
  },
) {
  const primaryTeam = await getPrimaryTeam(supabase);
  if (!primaryTeam?.id) {
    throw new Error("기준 팀 정보를 찾지 못했습니다.");
  }

  const { matches, results } = await getSeasonSettledResults(
    supabase,
    params.seasonId,
    primaryTeam.id,
  );
  const { start, end } = getMonthDateRange(params.awardMonth);
  const targetMatchIds = new Set(
    matches
      .filter((match) => match.match_date >= start && match.match_date < end)
      .map((match) => match.id),
  );
  const targetResults = results.filter((row) => targetMatchIds.has(row.match_id));
  const aggregates = await buildSnapshotAggregate(supabase, params.seasonId, targetResults);

  const rows = aggregates.map((row, index) => ({
    ...row,
    award_month: `${params.awardMonth}-01`,
    rank: index + 1,
    is_winner: index === 0,
    confirmed_at: new Date().toISOString(),
    confirmed_by: params.confirmedBy ?? null,
  }));

  const { error: deleteError } = await supabase
    .from("fan_award_monthly_results")
    .delete()
    .eq("season_id", params.seasonId)
    .eq("award_month", `${params.awardMonth}-01`);

  if (deleteError) throw deleteError;

  if (rows.length) {
    const { error: insertError } = await supabase
      .from("fan_award_monthly_results")
      .insert(rows);
    if (insertError) throw insertError;
  }

  return rows.length;
}

export async function generateSeasonFanAwardSnapshot(
  supabase: DataSupabase,
  params: {
    seasonId: string;
    confirmedBy?: string | null;
  },
) {
  const primaryTeam = await getPrimaryTeam(supabase);
  if (!primaryTeam?.id) {
    throw new Error("기준 팀 정보를 찾지 못했습니다.");
  }

  const { results } = await getSeasonSettledResults(
    supabase,
    params.seasonId,
    primaryTeam.id,
  );
  const aggregates = await buildSnapshotAggregate(supabase, params.seasonId, results);

  const { data: monthlyRows } = await supabase
    .from("fan_award_monthly_results")
    .select("player_id, is_winner")
    .eq("season_id", params.seasonId)
    .eq("is_winner", true);

  const monthlyAwardCountMap = new Map<string, number>();
  for (const row of (monthlyRows ?? []) as Array<{ player_id?: string | null }>) {
    const playerId = row.player_id ?? "";
    if (!playerId) continue;
    monthlyAwardCountMap.set(
      playerId,
      (monthlyAwardCountMap.get(playerId) ?? 0) + 1,
    );
  }

  const rows = aggregates.map((row, index) => ({
    ...row,
    monthly_award_count: monthlyAwardCountMap.get(row.player_id) ?? 0,
    rank: index + 1,
    is_mvp: index === 0,
    confirmed_at: new Date().toISOString(),
    confirmed_by: params.confirmedBy ?? null,
  }));

  const { error: deleteError } = await supabase
    .from("fan_award_season_results")
    .delete()
    .eq("season_id", params.seasonId);

  if (deleteError) throw deleteError;

  if (rows.length) {
    const { error: insertError } = await supabase
      .from("fan_award_season_results")
      .insert(rows);
    if (insertError) throw insertError;
  }

  return rows.length;
}
