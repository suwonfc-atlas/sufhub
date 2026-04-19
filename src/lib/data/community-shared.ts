import { cache } from "react";

import { createPublicSupabaseClient } from "@/lib/supabase";
import type { LeagueMatch, Match, Team } from "@/types";

import { buildClubMatches } from "./league";

export const getCommunityBaseData = cache(async (): Promise<{
  primaryTeam: Team | null;
  clubMatches: Match[];
  teams: Team[];
  leagueMatches: LeagueMatch[];
}> => {
  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    return {
      primaryTeam: null,
      clubMatches: [],
      teams: [],
      leagueMatches: [],
    };
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
    return {
      primaryTeam: null,
      clubMatches: [],
      teams: [],
      leagueMatches: [],
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

  return {
    primaryTeam,
    clubMatches: buildClubMatches(leagueMatches, teams, primaryTeam.id),
    teams,
    leagueMatches,
  };
});
