import type { CompetitionCode, LeagueMatch, Match, SeasonTeamLeague, Standing, Team } from "@/types";

function getPrimaryTeamFallback(teams: Team[]) {
  return teams.find((team) => team.is_primary) ?? teams.find((team) => team.name.includes("수원")) ?? null;
}

function sortStandings(rows: Standing[]) {
  return [...rows].sort((a, b) => {
    if (a.season !== b.season) {
      return b.season.localeCompare(a.season);
    }

    const leagueOrder = (code: string | null | undefined) => (code === "K2" ? 1 : 0);
    if (leagueOrder(a.league_code) !== leagueOrder(b.league_code)) {
      return leagueOrder(a.league_code) - leagueOrder(b.league_code);
    }

    return a.rank - b.rank;
  });
}

export function getPrimaryTeam(teams: Team[]) {
  return getPrimaryTeamFallback(teams);
}

export function buildClubMatches(
  leagueMatches: LeagueMatch[],
  teams: Team[],
  targetTeamId?: string | null,
  competitionCode: CompetitionCode | "all" = "all",
) {
  const resolvedTeamId = targetTeamId ?? getPrimaryTeamFallback(teams)?.id ?? null;

  if (!resolvedTeamId) {
    return [] as Match[];
  }

  return [...leagueMatches]
    .filter((match) => match.home_team_id === resolvedTeamId || match.away_team_id === resolvedTeamId)
    .filter((match) => competitionCode === "all" || match.competition_code === competitionCode)
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
    .map((match) => {
      const venue = match.home_team_id === resolvedTeamId ? "home" : "away";
      const opponentTeam =
        venue === "home"
          ? match.away_team ?? teams.find((team) => team.id === match.away_team_id) ?? null
          : match.home_team ?? teams.find((team) => team.id === match.home_team_id) ?? null;
      const homeTeam =
        match.home_team ?? teams.find((team) => team.id === match.home_team_id) ?? null;

      return {
        id: match.id,
        season: match.season,
        competition_code: match.competition_code,
        league_code: match.league_code,
        round: match.round,
        stage_label: match.stage_label,
        stage_order: match.stage_order,
        match_date: match.match_date,
        opponent: opponentTeam?.short_name ?? opponentTeam?.name ?? "상대 팀",
        opponent_logo_url: opponentTeam?.logo_url ?? null,
        highlight_url: match.highlight_url,
        venue,
        stadium_name: match.stadium_name ?? homeTeam?.home_stadium_name ?? null,
        score_home: match.home_score,
        score_away: match.away_score,
        status: match.status,
        competition: match.competition,
        created_at: match.created_at,
        updated_at: match.updated_at,
      } satisfies Match;
    });
}

export function buildStandings(
  teams: Team[],
  seasonTeamLeagues: SeasonTeamLeague[],
  leagueMatches: LeagueMatch[],
) {
  const grouped = new Map<
    string,
    {
      seasonId: string;
      season: string;
      leagueCode: Standing["league_code"];
      rows: Map<
        string,
        {
          team: Team;
          played: number;
          won: number;
          drawn: number;
          lost: number;
          goalsFor: number;
          goalsAgainst: number;
          updatedAt: string;
        }
      >;
    }
  >();

  const ensureGroup = (seasonId: string, season: string, leagueCode: Standing["league_code"]) => {
    const key = `${seasonId}:${leagueCode ?? "K1"}`;
    const existing = grouped.get(key);

    if (existing) {
      return existing;
    }

    const next = {
      seasonId,
      season,
      leagueCode,
      rows: new Map<
        string,
        {
          team: Team;
          played: number;
          won: number;
          drawn: number;
          lost: number;
          goalsFor: number;
          goalsAgainst: number;
          updatedAt: string;
        }
      >(),
    };

    grouped.set(key, next);
    return next;
  };

  for (const assignment of seasonTeamLeagues) {
    const team = assignment.team ?? teams.find((item) => item.id === assignment.team_id);
    const seasonCode = assignment.season?.code ?? "";

    if (!team || !seasonCode) {
      continue;
    }

    const group = ensureGroup(assignment.season_id, seasonCode, assignment.league_code);
    group.rows.set(team.id, {
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      updatedAt: team.updated_at,
    });
  }

  for (const match of leagueMatches) {
    const group = ensureGroup(match.season_id, match.season, match.league_code);

    for (const teamId of [match.home_team_id, match.away_team_id]) {
      if (group.rows.has(teamId)) {
        continue;
      }

      const team =
        (teamId === match.home_team_id ? match.home_team : match.away_team) ??
        teams.find((item) => item.id === teamId);

      if (!team) {
        continue;
      }

      group.rows.set(team.id, {
        team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        updatedAt: team.updated_at,
      });
    }
  }

  const finishedMatches = leagueMatches.filter(
    (match) =>
      match.status === "finished" &&
      match.home_score !== null &&
      match.away_score !== null &&
      match.league_code !== null &&
      match.competition_code !== "KOREA_CUP",
  );

  for (const match of finishedMatches) {
    const group = grouped.get(`${match.season_id}:${match.league_code}`);
    if (!group) continue;

    const home = group.rows.get(match.home_team_id);
    const away = group.rows.get(match.away_team_id);

    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += match.home_score ?? 0;
    home.goalsAgainst += match.away_score ?? 0;
    away.goalsFor += match.away_score ?? 0;
    away.goalsAgainst += match.home_score ?? 0;
    home.updatedAt = match.updated_at;
    away.updatedAt = match.updated_at;

    if ((match.home_score ?? 0) > (match.away_score ?? 0)) {
      home.won += 1;
      away.lost += 1;
    } else if ((match.home_score ?? 0) < (match.away_score ?? 0)) {
      away.won += 1;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
    }
  }

  const standings: Standing[] = [];

  for (const group of grouped.values()) {
    const rankedRows = [...group.rows.values()]
      .map((row) => ({
        ...row,
        points: row.won * 3 + row.drawn,
        goalDiff: row.goalsFor - row.goalsAgainst,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        return a.team.name.localeCompare(b.team.name, "ko");
      });

    rankedRows.forEach((row, index) => {
      standings.push({
        id: `${group.seasonId}-${group.leagueCode}-${row.team.id}`,
        team_id: row.team.id,
        season: group.season,
        season_id: group.seasonId,
        league_code: group.leagueCode,
        team_name: row.team.name,
        team_short_name: row.team.short_name,
        team_logo_url: row.team.logo_url,
        rank: index + 1,
        played: row.played,
        won: row.won,
        drawn: row.drawn,
        lost: row.lost,
        goals_for: row.goalsFor,
        goals_against: row.goalsAgainst,
        goal_diff: row.goalDiff,
        points: row.points,
        updated_at: row.updatedAt,
      });
    });
  }

  return sortStandings(standings);
}
