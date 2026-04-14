import { getUserFromSession } from "@/lib/auth/user";
import { createPublicSupabaseClient } from "@/lib/supabase";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import type {
  LeagueMatch,
  Match,
  MatchPrediction,
  PredictionChoice,
  Team,
  UserAccount,
} from "@/types";

import { buildClubMatches } from "./league";
import { applyExperienceReward } from "./experience";
import { parseKstDate } from "@/lib/utils";

export interface PredictionVoteCounts {
  win: number;
  draw: number;
  lose: number;
  total: number;
  winRate: number;
  drawRate: number;
  loseRate: number;
}

export interface PredictionRankingRow {
  userId: string;
  nickname: string;
  total: number;
  hits: number;
  accuracy: number;
  rank: number;
}

export interface CommunityPredictionData {
  nextMatch: Match | null;
  displayMatch?: Match | null;
  mode: "predict" | "post";
  postMessage?: string | null;
  primaryTeam: Team | null;
  userId: string | null;
  userChoice: PredictionChoice | null;
  voteCounts: PredictionVoteCounts;
  userAccuracy: {
    total: number;
    hits: number;
    accuracy: number;
  };
  ranking: PredictionRankingRow[];
}

interface PredictionRow {
  id: string;
  user_id: string;
  choice: PredictionChoice;
  match: {
    id: string;
    home_team_id: string;
    away_team_id: string;
    home_score: number | null;
    away_score: number | null;
    status: "scheduled" | "live" | "finished";
  } | null;
  user?: {
    id: string;
    nickname: string;
  } | null;
}

function normalizePredictionCounts(predictions: MatchPrediction[]): PredictionVoteCounts {
  const counts = { win: 0, draw: 0, lose: 0 };
  for (const prediction of predictions) {
    counts[prediction.choice] += 1;
  }

  const total = counts.win + counts.draw + counts.lose;
  const toRate = (value: number) => (total ? Math.round((value / total) * 100) : 0);

  return {
    ...counts,
    total,
    winRate: toRate(counts.win),
    drawRate: toRate(counts.draw),
    loseRate: toRate(counts.lose),
  };
}

function getMatchOutcomeForTeam(
  match: PredictionRow["match"],
  teamId: string,
): PredictionChoice | null {
  if (!match || match.status !== "finished") return null;
  if (match.home_score === null || match.away_score === null) return null;
  const isHome = match.home_team_id === teamId;
  const isAway = match.away_team_id === teamId;
  if (!isHome && !isAway) return null;

  if (match.home_score === match.away_score) return "draw";

  const homeWin = match.home_score > match.away_score;
  if (isHome) {
    return homeWin ? "win" : "lose";
  }

  return homeWin ? "lose" : "win";
}

export async function getCommunityPredictionData(): Promise<CommunityPredictionData> {
  const supabase = createPublicSupabaseClient();
  const admin = createServiceSupabaseClient();

  if (!supabase) {
    return {
      nextMatch: null,
      displayMatch: null,
      mode: "predict",
      postMessage: null,
      primaryTeam: null,
      userId: null,
      userChoice: null,
      voteCounts: normalizePredictionCounts([]),
      userAccuracy: { total: 0, hits: 0, accuracy: 0 },
      ranking: [],
    };
  }

  const user = (await getUserFromSession()) as UserAccount | null;

  const { data: primaryTeamData } = await supabase
    .from("teams")
    .select("*")
    .eq("is_primary", true)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const primaryTeam = (primaryTeamData as Team | null) ?? null;

  if (!primaryTeam) {
    return {
      nextMatch: null,
      displayMatch: null,
      mode: "predict",
      postMessage: null,
      primaryTeam: null,
      userId: user?.id ?? null,
      userChoice: null,
      voteCounts: normalizePredictionCounts([]),
      userAccuracy: { total: 0, hits: 0, accuracy: 0 },
      ranking: [],
    };
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

  const clubMatches = buildClubMatches(leagueMatches, teams, primaryTeam.id);
  const nextMatch =
    clubMatches.find(
      (match) =>
        match.status !== "finished" &&
        parseKstDate(match.match_date).getTime() >= Date.now(),
    ) ??
    clubMatches.find((match) => match.status !== "finished") ??
    null;
  const latestFinished =
    [...clubMatches].reverse().find((match) => match.status === "finished") ?? null;
  const postWindowMs = 26 * 60 * 60 * 1000;
  const isPostWindow =
    latestFinished &&
    Date.now() - parseKstDate(latestFinished.match_date).getTime() <= postWindowMs;
  const displayMatch = isPostWindow ? latestFinished : nextMatch;
  const mode: CommunityPredictionData["mode"] = isPostWindow ? "post" : "predict";

  if (!admin || !displayMatch) {
    return {
      nextMatch,
      displayMatch,
      mode,
      postMessage: isPostWindow ? "경기 종료 후 24시간(경기 시작 기준 약 26시간) 뒤 다음 경기 예측이 시작됩니다." : null,
      primaryTeam,
      userId: user?.id ?? null,
      userChoice: null,
      voteCounts: normalizePredictionCounts([]),
      userAccuracy: { total: 0, hits: 0, accuracy: 0 },
      ranking: [],
    };
  }

  const [{ data: matchPredictions }, { data: allPredictions }] = await Promise.all([
    admin.from("match_predictions").select("*").eq("match_id", displayMatch.id),
    admin.from("match_predictions").select(
      "id, user_id, choice, match:league_matches(id, home_team_id, away_team_id, home_score, away_score, status), user:users(id, nickname)",
    ),
  ]);

  const matchPredictionRows = (matchPredictions ?? []) as MatchPrediction[];
  const voteCounts = normalizePredictionCounts(matchPredictionRows);
  const userChoice =
    user?.id && matchPredictionRows.length
      ? matchPredictionRows.find((row) => row.user_id === user.id)?.choice ?? null
      : null;

  const predictionRows = (allPredictions ?? []).map((row) => {
    const raw = row as {
      id?: string;
      user_id?: string;
      choice?: PredictionChoice;
      match?: PredictionRow["match"] | PredictionRow["match"][];
      user?: PredictionRow["user"] | PredictionRow["user"][];
    };
    const match = Array.isArray(raw.match) ? raw.match[0] ?? null : raw.match ?? null;
    const userInfo = Array.isArray(raw.user) ? raw.user[0] ?? null : raw.user ?? null;

    return {
      id: raw.id ?? "",
      user_id: raw.user_id ?? "",
      choice: raw.choice ?? "win",
      match,
      user: userInfo,
    } satisfies PredictionRow;
  });
  const rankingMap = new Map<string, { nickname: string; total: number; hits: number }>();

  for (const prediction of predictionRows) {
    if (!prediction.user_id) continue;
    const outcome = getMatchOutcomeForTeam(prediction.match, primaryTeam.id);
    if (!outcome) continue;

    const record =
      rankingMap.get(prediction.user_id) ?? {
        nickname: prediction.user?.nickname ?? "팬",
        total: 0,
        hits: 0,
      };

    record.total += 1;
    if (prediction.choice === outcome) {
      record.hits += 1;
    }

    rankingMap.set(prediction.user_id, record);
  }

  const ranking = Array.from(rankingMap.entries())
    .map(([userId, record]) => ({
      userId,
      nickname: record.nickname,
      total: record.total,
      hits: record.hits,
      accuracy: record.total ? Math.round((record.hits / record.total) * 100) : 0,
    }))
    .sort(
      (a, b) =>
        b.accuracy - a.accuracy ||
        b.hits - a.hits ||
        b.total - a.total ||
        a.nickname.localeCompare(b.nickname, "ko"),
    )
    .slice(0, 30)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const currentUserStats = user?.id ? rankingMap.get(user.id) ?? null : null;

  if (user?.id) {
    const userPredictions = predictionRows.filter((row) => row.user_id === user.id);
    for (const prediction of userPredictions) {
      const outcome = getMatchOutcomeForTeam(prediction.match, primaryTeam.id);
      if (!outcome || outcome !== prediction.choice) continue;

      await applyExperienceReward({
        userId: user.id,
        action: "prediction_hit",
        referenceId: prediction.match?.id ?? null,
        reason: "예측 적중 보상",
      });
    }
  }

  return {
    nextMatch,
    displayMatch,
    mode,
    postMessage: isPostWindow ? "경기 종료 후 24시간(경기 시작 기준 약 26시간) 뒤 다음 경기 예측이 시작됩니다." : null,
    primaryTeam,
    userId: user?.id ?? null,
    userChoice,
    voteCounts,
    userAccuracy: {
      total: currentUserStats?.total ?? 0,
      hits: currentUserStats?.hits ?? 0,
      accuracy: currentUserStats?.total
        ? Math.round((currentUserStats.hits / currentUserStats.total) * 100)
        : 0,
    },
    ranking,
  };
}

export interface PredictionHistoryItem {
  id: string;
  season: string;
  matchDate: string;
  homeTeamName: string;
  awayTeamName: string;
  homeLogoUrl: string | null;
  awayLogoUrl: string | null;
  choice: PredictionChoice;
  result: PredictionChoice | null;
  status: "scheduled" | "live" | "finished";
}

export interface PredictionHistoryData {
  seasons: string[];
  selectedSeason: string;
  items: PredictionHistoryItem[];
  accuracy: number;
  total: number;
  hits: number;
}

export async function getPredictionHistoryData(
  userId: string,
  selectedSeason?: string,
): Promise<PredictionHistoryData> {
  const admin = createServiceSupabaseClient() ?? createPublicSupabaseClient();
  if (!admin) {
    return {
      seasons: [],
      selectedSeason: "",
      items: [],
      accuracy: 0,
      total: 0,
      hits: 0,
    };
  }

  const { data: primaryTeam } = await admin
    .from("teams")
    .select("id")
    .eq("is_primary", true)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const primaryTeamId = (primaryTeam as { id?: string } | null)?.id ?? null;

  const { data: predictionRows } = await admin
    .from("match_predictions")
    .select(
      "id, choice, match:league_matches(match_date, season_record:seasons(code), home_team:teams!league_matches_home_team_id_fkey(name, short_name, logo_url), away_team:teams!league_matches_away_team_id_fkey(name, short_name, logo_url), home_team_id, away_team_id, home_score, away_score, status)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const normalized = (predictionRows ?? []).map((row) => {
    const raw = row as {
      id?: string;
      choice?: PredictionChoice;
      match?: {
        match_date?: string;
        season_record?: { code?: string | null } | { code?: string | null }[] | null;
        home_team?: { name?: string | null; short_name?: string | null; logo_url?: string | null } | { name?: string | null; short_name?: string | null; logo_url?: string | null }[] | null;
        away_team?: { name?: string | null; short_name?: string | null; logo_url?: string | null } | { name?: string | null; short_name?: string | null; logo_url?: string | null }[] | null;
        home_team_id?: string;
        away_team_id?: string;
        home_score?: number | null;
        away_score?: number | null;
        status?: "scheduled" | "live" | "finished";
      } | null | Array<{
        match_date?: string;
        season_record?: { code?: string | null }[] | { code?: string | null } | null;
        home_team?: { name?: string | null; short_name?: string | null; logo_url?: string | null }[] | { name?: string | null; short_name?: string | null; logo_url?: string | null } | null;
        away_team?: { name?: string | null; short_name?: string | null; logo_url?: string | null }[] | { name?: string | null; short_name?: string | null; logo_url?: string | null } | null;
        home_team_id?: string;
        away_team_id?: string;
        home_score?: number | null;
        away_score?: number | null;
        status?: "scheduled" | "live" | "finished";
      }>;
    };

    const matchRaw = Array.isArray(raw.match) ? raw.match[0] ?? null : raw.match ?? null;
    const seasonRecord = Array.isArray(matchRaw?.season_record)
      ? matchRaw?.season_record?.[0] ?? null
      : matchRaw?.season_record ?? null;
    const homeTeam = Array.isArray(matchRaw?.home_team)
      ? matchRaw?.home_team?.[0] ?? null
      : matchRaw?.home_team ?? null;
    const awayTeam = Array.isArray(matchRaw?.away_team)
      ? matchRaw?.away_team?.[0] ?? null
      : matchRaw?.away_team ?? null;

    return {
      id: raw.id ?? "",
      choice: raw.choice ?? "win",
      match: matchRaw
        ? {
            match_date: matchRaw.match_date ?? "",
            season_record: seasonRecord,
            home_team: homeTeam,
            away_team: awayTeam,
            home_team_id: matchRaw.home_team_id ?? "",
            away_team_id: matchRaw.away_team_id ?? "",
            home_score: matchRaw.home_score ?? null,
            away_score: matchRaw.away_score ?? null,
            status: matchRaw.status ?? "scheduled",
          }
        : null,
    };
  });

  const seasons = Array.from(
    new Set(
      normalized
        .map((row) => row.match?.season_record?.code ?? "")
        .filter(Boolean),
    ),
  ).sort((a, b) => b.localeCompare(a));

  const resolvedSeason =
    selectedSeason && seasons.includes(selectedSeason)
      ? selectedSeason
      : seasons[0] ?? "";

  const items = normalized
    .filter((row) => (resolvedSeason ? row.match?.season_record?.code === resolvedSeason : true))
    .map((row) => {
      const match = row.match;
      return {
        id: row.id,
        season: match?.season_record?.code ?? "",
        matchDate: match?.match_date ?? "",
        homeTeamName: match?.home_team?.short_name ?? match?.home_team?.name ?? "-",
        awayTeamName: match?.away_team?.short_name ?? match?.away_team?.name ?? "-",
        homeLogoUrl: match?.home_team?.logo_url ?? null,
        awayLogoUrl: match?.away_team?.logo_url ?? null,
        choice: row.choice,
        result:
          match && primaryTeamId
            ? getMatchOutcomeForTeam(
                {
                  id: "",
                  home_team_id: match.home_team_id,
                  away_team_id: match.away_team_id,
                  home_score: match.home_score,
                  away_score: match.away_score,
                  status: match.status,
                },
                primaryTeamId,
              )
            : null,
        status: match?.status ?? "scheduled",
      } satisfies PredictionHistoryItem;
    });

  let hits = 0;
  let total = 0;

  for (const item of items) {
    if (item.result) {
      total += 1;
      if (item.choice === item.result) hits += 1;
    }
  }

  return {
    seasons,
    selectedSeason: resolvedSeason,
    items,
    accuracy: total ? Math.round((hits / total) * 100) : 0,
    total,
    hits,
  };
}
