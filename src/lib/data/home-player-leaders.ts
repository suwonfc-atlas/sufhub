import { createPublicSupabaseClient } from "@/lib/supabase";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import type { Player, PlayerSeason, PlayerStat, Season, Team } from "@/types";

import {
  getHomePlayerLeadersData,
  type HomePlayerLeaderMetric as LegacyHomePlayerLeaderMetric,
  type HomePlayerLeaderRow,
} from "./public";

export type HomePlayerLeaderMetric = LegacyHomePlayerLeaderMetric | "fan-rating" | "fan-mom";

const LEGACY_METRICS: LegacyHomePlayerLeaderMetric[] = [
  "goals",
  "assists",
  "attack-point",
  "rating",
  "minutes",
  "yellow-cards",
  "red-cards",
];

interface FanAggregate {
  sum: number;
  count: number;
  momCount: number;
}

function formatDisplayValue(metric: HomePlayerLeaderMetric, aggregate: FanAggregate) {
  if (metric === "fan-rating") {
    return (aggregate.sum / aggregate.count).toFixed(2);
  }

  return `${aggregate.momCount.toLocaleString("ko-KR")}`;
}

export async function getResolvedHomePlayerLeadersData(
  seasonCode: string,
  metric: HomePlayerLeaderMetric,
): Promise<HomePlayerLeaderRow[]> {
  if (LEGACY_METRICS.includes(metric as LegacyHomePlayerLeaderMetric)) {
    return getHomePlayerLeadersData(seasonCode, metric as LegacyHomePlayerLeaderMetric);
  }

  const supabase = createServiceSupabaseClient() ?? createPublicSupabaseClient();
  if (!supabase || !seasonCode) {
    return [];
  }

  const [{ data: seasonData }, { data: primaryTeamData }] = await Promise.all([
    supabase.from("seasons").select("*").eq("code", seasonCode).eq("is_active", true).limit(1).maybeSingle(),
    supabase.from("teams").select("*").eq("is_primary", true).eq("is_active", true).limit(1).maybeSingle(),
  ]);

  const season = (seasonData as Season | null) ?? null;
  const primaryTeam = (primaryTeamData as Team | null) ?? null;
  if (!season || !primaryTeam) {
    return [];
  }

  const [{ data: rosterData }, { data: matchData }] = await Promise.all([
    supabase
      .from("player_seasons")
      .select("player_id, squad_number, is_captain, player:players(*)")
      .eq("season_id", season.id)
      .eq("team_id", primaryTeam.id)
      .eq("is_active", true),
    supabase
      .from("league_matches")
      .select("id")
      .eq("season_id", season.id)
      .eq("status", "finished")
      .or(`home_team_id.eq.${primaryTeam.id},away_team_id.eq.${primaryTeam.id}`),
  ]);

  const rosterRows = (rosterData ?? []) as Array<{
    player_id: string;
    squad_number: number | null;
    is_captain: boolean | null;
    player?: Player | Player[] | null;
  }>;
  const playerIds = rosterRows.map((row) => row.player_id).filter(Boolean);
  const matchIds = ((matchData ?? []) as Array<{ id: string }>).map((row) => row.id);

  if (!playerIds.length || !matchIds.length) {
    return [];
  }

  const [{ data: statsData }, { data: ratingData }, { data: momData }] = await Promise.all([
    supabase
      .from("player_stats")
      .select("*, player:players(*)")
      .eq("season", seasonCode)
      .in("player_id", playerIds),
    supabase
      .from("match_player_ratings")
      .select("player_id, rating")
      .in("match_id", matchIds)
      .in("player_id", playerIds),
    supabase
      .from("match_mom_votes")
      .select("player_id")
      .in("match_id", matchIds)
      .in("player_id", playerIds),
  ]);

  const statsMap = new Map(
    ((statsData ?? []) as PlayerStat[]).map((row) => [row.player_id, row]),
  );

  const rosterMap = new Map(
    rosterRows.map((row) => [
      row.player_id,
      {
        squadNumber: row.squad_number ?? null,
        isCaptain: Boolean(row.is_captain),
        player: Array.isArray(row.player) ? (row.player[0] ?? null) : (row.player ?? null),
      },
    ]),
  );

  const aggregates = new Map<string, FanAggregate>();
  for (const playerId of playerIds) {
    aggregates.set(playerId, { sum: 0, count: 0, momCount: 0 });
  }

  for (const row of (ratingData ?? []) as Array<{ player_id: string; rating: number }>) {
    const aggregate = aggregates.get(row.player_id);
    if (!aggregate) continue;
    aggregate.sum += row.rating;
    aggregate.count += 1;
  }

  for (const row of (momData ?? []) as Array<{ player_id: string }>) {
    const aggregate = aggregates.get(row.player_id);
    if (!aggregate) continue;
    aggregate.momCount += 1;
  }

  const rows = playerIds
    .map((playerId): HomePlayerLeaderRow | null => {
      const aggregate = aggregates.get(playerId);
      const roster = rosterMap.get(playerId);
      const stat = statsMap.get(playerId);
      const player = roster?.player ?? stat?.player ?? null;
      if (!aggregate || !roster || !player) return null;

      if (metric === "fan-rating" && aggregate.count === 0) {
        return null;
      }

      if (metric === "fan-mom" && aggregate.momCount === 0) {
        return null;
      }

      return {
        id: `${playerId}:${metric}`,
        playerId,
        name: player.name,
        nameEn: player.name_en ?? null,
        birthDate: player.birth_date ?? null,
        nationality: player.nationality ?? null,
        profileImageUrl: player.profile_image_url ?? null,
        bio: player.bio ?? null,
        squadNumber: roster.squadNumber,
        isCaptain: roster.isCaptain,
        position: player.position,
        appearances: stat?.appearances ?? 0,
        goals: stat?.goals ?? 0,
        assists: stat?.assists ?? 0,
        attackPoints: (stat?.goals ?? 0) + (stat?.assists ?? 0),
        ratingAverage: stat?.rating_average ?? null,
        minutesPlayed: stat?.minutes_played ?? 0,
        yellowCards: stat?.yellow_cards ?? 0,
        redCards: stat?.red_cards ?? 0,
        displayValue: formatDisplayValue(metric, aggregate),
      } satisfies HomePlayerLeaderRow;
    })
    .filter((row): row is HomePlayerLeaderRow => row !== null);

  return rows
    .sort((left, right) => {
      if (metric === "fan-rating") {
        return (
          Number.parseFloat(right.displayValue) - Number.parseFloat(left.displayValue) ||
          right.appearances - left.appearances ||
          left.name.localeCompare(right.name, "ko")
        );
      }

      return (
        Number.parseInt(right.displayValue, 10) - Number.parseInt(left.displayValue, 10) ||
        right.appearances - left.appearances ||
        left.name.localeCompare(right.name, "ko")
      );
    });
}
