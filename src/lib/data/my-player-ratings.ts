import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import type {
  CompetitionCode,
  LeagueCode,
  MatchPlayerRating,
  MatchPlayerRatingLike,
  MatchStatus,
  MatchMomVote,
  Player,
  PlayerFanRatingResult,
  PlayerPosition,
  Team,
} from "@/types";

const PAGE_SIZE = 10;

const POSITION_ORDER: Record<PlayerPosition, number> = {
  GK: 0,
  DF: 1,
  MF: 2,
  FW: 3,
};

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

function sortPlayers<T extends { position: string; squadNumber: number | null; name: string }>(players: T[]) {
  return [...players].sort((left, right) => {
    const positionGap =
      (POSITION_ORDER[left.position as PlayerPosition] ?? 99) -
      (POSITION_ORDER[right.position as PlayerPosition] ?? 99);
    if (positionGap !== 0) return positionGap;

    const squadGap = (left.squadNumber ?? 999) - (right.squadNumber ?? 999);
    if (squadGap !== 0) return squadGap;

    return left.name.localeCompare(right.name, "ko");
  });
}

export interface MyPlayerRatingHistoryListItem {
  matchId: string;
  season: string;
  seasonId: string;
  competition: string;
  competitionCode: CompetitionCode;
  leagueCode: LeagueCode | null;
  roundLabel: string;
  matchDate: string;
  status: MatchStatus;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogoUrl: string | null;
  awayTeamLogoUrl: string | null;
  myMomPlayerId: string | null;
  myMomPlayerName: string | null;
  ratedPlayerCount: number;
  isUpdated: boolean;
  submittedAt: string;
}

export interface MyPlayerRatingHistoryPlayer {
  playerId: string;
  name: string;
  position: string;
  squadNumber: number | null;
  rating: number;
  comment: string;
  commentLikeCount: number;
  finalAverage: number | null;
}

export interface MyPlayerRatingHistoryDetail {
  entry: MyPlayerRatingHistoryListItem;
  players: MyPlayerRatingHistoryPlayer[];
  myMomPlayerId: string | null;
  myMomPlayerName: string | null;
  momWinnerPlayerId: string | null;
  momWinnerPlayerName: string | null;
}

export interface MyPlayerRatingHistoryData {
  seasons: string[];
  selectedSeason: string;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: MyPlayerRatingHistoryListItem[];
  selectedEntryId: string | null;
  selectedEntry: MyPlayerRatingHistoryDetail | null;
}

type MatchWithVoteRow = {
  id?: string;
  season_id?: string;
  match_date?: string;
  round?: number | null;
  stage_label?: string | null;
  competition?: string;
  competition_code?: CompetitionCode;
  league_code?: LeagueCode | null;
  status?: MatchStatus;
  home_team?: Team | Team[] | null;
  away_team?: Team | Team[] | null;
  user_vote?: MatchMomVote | MatchMomVote[] | null;
};

type PlayerSummaryRow = Pick<Player, "id" | "name" | "position">;

async function getSeasonMap(userId: string) {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return new Map<string, string>();

  const { data } = await supabase
    .from("match_mom_votes")
    .select("match:league_matches(season_id, season_record:seasons(code))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const seasonMap = new Map<string, string>();
  for (const row of data ?? []) {
    const raw = row as {
      match?:
        | {
            season_id?: string;
            season_record?: { code?: string | null } | Array<{ code?: string | null }> | null;
          }
        | Array<{
            season_id?: string;
            season_record?: { code?: string | null } | Array<{ code?: string | null }> | null;
          }>
        | null;
    };

    const match = relationOne(raw.match);
    const seasonRecord = relationOne(match?.season_record);
    const seasonCode = seasonRecord?.code?.trim() ?? "";
    const seasonId = match?.season_id?.trim() ?? "";

    if (seasonCode && seasonId && !seasonMap.has(seasonCode)) {
      seasonMap.set(seasonCode, seasonId);
    }
  }

  return seasonMap;
}

function normalizeHistoryListItem(
  row: MatchWithVoteRow,
  ratingsByMatchId: Map<string, MatchPlayerRating[]>,
  playerNameMap: Map<string, string>,
): MyPlayerRatingHistoryListItem | null {
  const matchId = row.id?.trim() ?? "";
  if (!matchId) return null;

  const homeTeam = relationOne(row.home_team);
  const awayTeam = relationOne(row.away_team);
  const vote = relationOne(row.user_vote);
  const matchRatings = ratingsByMatchId.get(matchId) ?? [];
  const ratedPlayerIds = new Set(matchRatings.map((item) => item.player_id));
  const isUpdated =
    matchRatings.some((item) => item.updated_at !== item.created_at) ||
    (vote ? vote.updated_at !== vote.created_at : false);

  return {
    matchId,
    season: "",
    seasonId: row.season_id?.trim() ?? "",
    competition: row.competition?.trim() || "경기",
    competitionCode: row.competition_code ?? "K1",
    leagueCode: row.league_code ?? null,
    roundLabel: getRoundLabel(row.round ?? null, row.stage_label ?? null),
    matchDate: row.match_date ?? "",
    status: row.status ?? "scheduled",
    homeTeamName: homeTeam?.short_name ?? homeTeam?.name ?? "홈팀",
    awayTeamName: awayTeam?.short_name ?? awayTeam?.name ?? "원정팀",
    homeTeamLogoUrl: homeTeam?.logo_url ?? null,
    awayTeamLogoUrl: awayTeam?.logo_url ?? null,
    myMomPlayerId: vote?.player_id ?? null,
    myMomPlayerName: vote?.player_id ? playerNameMap.get(vote.player_id) ?? null : null,
    ratedPlayerCount: ratedPlayerIds.size,
    isUpdated,
    submittedAt: vote?.created_at ?? matchRatings[0]?.created_at ?? row.match_date ?? "",
  };
}

async function getHistoryDetail(
  userId: string,
  matchId: string,
  seasonCode: string,
): Promise<MyPlayerRatingHistoryDetail | null> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return null;

  const { data: matchData } = await supabase
    .from("league_matches")
    .select(
      "id, season_id, match_date, round, stage_label, competition, competition_code, league_code, status, home_team:teams!league_matches_home_team_id_fkey(*), away_team:teams!league_matches_away_team_id_fkey(*), user_vote:match_mom_votes!inner(*)",
    )
    .eq("id", matchId)
    .eq("user_vote.user_id", userId)
    .maybeSingle();

  const matchRow = matchData as MatchWithVoteRow | null;
  if (!matchRow?.id) return null;

  const { data: ratingRows } = await supabase
    .from("match_player_ratings")
    .select("*")
    .eq("match_id", matchId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const ratings = (ratingRows ?? []) as MatchPlayerRating[];
  const ratingIds = ratings.map((row) => row.id);
  const playerIds = Array.from(
    new Set(
      [
        ...ratings.map((row) => row.player_id),
        relationOne(matchRow.user_vote)?.player_id ?? "",
      ].filter(Boolean),
    ),
  );

  const [{ data: playerRows }, { data: playerSeasonRows }, { data: resultRows }, { data: likeRows }] =
    await Promise.all([
      playerIds.length
        ? supabase.from("players").select("id, name, position").in("id", playerIds)
        : Promise.resolve({ data: [] }),
      playerIds.length
        ? supabase
            .from("player_seasons")
            .select("player_id, squad_number")
            .eq("season_id", matchRow.season_id ?? "")
            .in("player_id", playerIds)
        : Promise.resolve({ data: [] }),
      playerIds.length
        ? supabase
            .from("player_fan_rating_results")
            .select("*")
            .eq("match_id", matchId)
            .in("player_id", playerIds)
        : Promise.resolve({ data: [] }),
      ratingIds.length
        ? supabase
            .from("match_player_rating_likes")
            .select("*")
            .in("rating_id", ratingIds)
        : Promise.resolve({ data: [] }),
    ]);

  const playerMap = new Map(
    ((playerRows ?? []) as PlayerSummaryRow[]).map((row) => [
      row.id,
      {
        id: row.id,
        name: row.name,
        position: row.position,
      },
    ]),
  );

  const squadNumberMap = new Map(
    ((playerSeasonRows ?? []) as Array<{ player_id: string; squad_number: number | null }>).map((row) => [
      row.player_id,
      row.squad_number ?? null,
    ]),
  );

  const resultMap = new Map(
    ((resultRows ?? []) as PlayerFanRatingResult[]).map((row) => [row.player_id, row]),
  );

  const likeCountMap = new Map<string, number>();
  for (const like of (likeRows ?? []) as MatchPlayerRatingLike[]) {
    likeCountMap.set(like.rating_id, (likeCountMap.get(like.rating_id) ?? 0) + 1);
  }

  const myVote = relationOne(matchRow.user_vote);
  const playerNameMap = new Map(
    Array.from(playerMap.values()).map((player) => [player.id, player.name]),
  );

  const detailPlayers = sortPlayers(
    ratings.map((row) => {
      const player = playerMap.get(row.player_id);
      const result = resultMap.get(row.player_id);

      return {
        playerId: row.player_id,
        name: player?.name ?? "선수",
        position: player?.position ?? "-",
        squadNumber: squadNumberMap.get(row.player_id) ?? null,
        rating: row.rating,
        comment: row.comment?.trim() ?? "",
        commentLikeCount: likeCountMap.get(row.id) ?? 0,
        finalAverage: result?.fan_rating_average ?? null,
      } satisfies MyPlayerRatingHistoryPlayer;
    }),
  );

  const momWinner = [...resultMap.values()].find((row) => row.is_mom_winner) ?? null;
  const entry = normalizeHistoryListItem(
    matchRow,
    new Map([[matchId, ratings]]),
    playerNameMap,
  );

  if (!entry) return null;
  entry.season = seasonCode;

  return {
    entry,
    players: detailPlayers,
    myMomPlayerId: myVote?.player_id ?? null,
    myMomPlayerName: myVote?.player_id ? playerNameMap.get(myVote.player_id) ?? null : null,
    momWinnerPlayerId: momWinner?.player_id ?? null,
    momWinnerPlayerName: momWinner?.player_id ? playerNameMap.get(momWinner.player_id) ?? null : null,
  };
}

export async function getMyPlayerRatingHistory(
  userId: string,
  selectedSeason?: string,
  page = 1,
): Promise<MyPlayerRatingHistoryData> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    return {
      seasons: [],
      selectedSeason: "",
      page: 1,
      pageSize: PAGE_SIZE,
      totalItems: 0,
      totalPages: 0,
      items: [],
      selectedEntryId: null,
      selectedEntry: null,
    };
  }

  const seasonMap = await getSeasonMap(userId);
  const seasons = [...seasonMap.keys()].sort((left, right) => right.localeCompare(left));
  const resolvedSeason = selectedSeason && seasonMap.has(selectedSeason) ? selectedSeason : seasons[0] ?? "";
  const resolvedSeasonId = resolvedSeason ? seasonMap.get(resolvedSeason) ?? "" : "";
  const safePage = Math.max(1, Number.isFinite(page) ? page : 1);

  if (!resolvedSeasonId) {
    return {
      seasons,
      selectedSeason: resolvedSeason,
      page: 1,
      pageSize: PAGE_SIZE,
      totalItems: 0,
      totalPages: 0,
      items: [],
      selectedEntryId: null,
      selectedEntry: null,
    };
  }

  const from = (safePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [{ count }, { data: matchRows }] = await Promise.all([
    supabase
      .from("league_matches")
      .select("id, user_vote:match_mom_votes!inner(id)", { count: "exact", head: true })
      .eq("season_id", resolvedSeasonId)
      .eq("user_vote.user_id", userId),
    supabase
      .from("league_matches")
      .select(
        "id, season_id, match_date, round, stage_label, competition, competition_code, league_code, status, home_team:teams!league_matches_home_team_id_fkey(*), away_team:teams!league_matches_away_team_id_fkey(*), user_vote:match_mom_votes!inner(*)",
      )
      .eq("season_id", resolvedSeasonId)
      .eq("user_vote.user_id", userId)
      .order("match_date", { ascending: false })
      .range(from, to),
  ]);

  const normalizedMatches = (matchRows ?? []) as MatchWithVoteRow[];
  const matchIds = normalizedMatches.map((row) => row.id ?? "").filter(Boolean);

  if (!matchIds.length) {
    return {
      seasons,
      selectedSeason: resolvedSeason,
      page: safePage,
      pageSize: PAGE_SIZE,
      totalItems: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
      items: [],
      selectedEntryId: null,
      selectedEntry: null,
    };
  }

  const [{ data: ratingRows }, { data: momRows }] = await Promise.all([
    supabase
      .from("match_player_ratings")
      .select("*")
      .eq("user_id", userId)
      .in("match_id", matchIds),
    supabase
      .from("match_mom_votes")
      .select("*")
      .eq("user_id", userId)
      .in("match_id", matchIds),
  ]);

  const ratings = (ratingRows ?? []) as MatchPlayerRating[];
  const moms = (momRows ?? []) as MatchMomVote[];
  const playerIds = Array.from(
    new Set([
      ...ratings.map((row) => row.player_id),
      ...moms.map((row) => row.player_id),
    ]),
  );

  const { data: playerRows } = playerIds.length
    ? await supabase.from("players").select("id, name").in("id", playerIds)
    : { data: [] };

  const playerNameMap = new Map(
    ((playerRows ?? []) as Array<{ id: string; name: string }>).map((row) => [row.id, row.name]),
  );

  const ratingsByMatchId = new Map<string, MatchPlayerRating[]>();
  for (const rating of ratings) {
    const list = ratingsByMatchId.get(rating.match_id) ?? [];
    list.push(rating);
    ratingsByMatchId.set(rating.match_id, list);
  }

  const items = normalizedMatches
    .map((row) => normalizeHistoryListItem(row, ratingsByMatchId, playerNameMap))
    .filter((row): row is MyPlayerRatingHistoryListItem => row !== null)
    .map((row) => ({ ...row, season: resolvedSeason }));

  return {
    seasons,
    selectedSeason: resolvedSeason,
    page: safePage,
    pageSize: PAGE_SIZE,
    totalItems: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
    items,
    selectedEntryId: items[0]?.matchId ?? null,
    selectedEntry: items[0] ? await getHistoryDetail(userId, items[0].matchId, resolvedSeason) : null,
  };
}

export async function getMyPlayerRatingHistoryDetail(
  userId: string,
  selectedEntryId: string | null,
  selectedSeason: string,
) {
  if (!selectedEntryId) return null;
  return getHistoryDetail(userId, selectedEntryId, selectedSeason);
}
