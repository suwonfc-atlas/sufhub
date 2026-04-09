"use server";

import { revalidatePath } from "next/cache";

import { isAdminUser } from "@/lib/auth/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ChantCategory,
  CompetitionCode,
  GuideCategory,
  LeagueCode,
  MapPlaceCategory,
  MatchStatus,
  PlayerPosition,
  UniformType,
} from "@/types";

type ServerSupabase = NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>;

type AdminSupabaseContext =
  | { kind: "error"; result: AdminMutationResult }
  | { kind: "ok"; supabase: ServerSupabase };

export interface AdminMutationResult {
  status: "success" | "error";
  message: string;
  entityId?: string;
}

export interface MatchMutationInput {
  id?: string;
  season_id: string;
  competition_code: CompetitionCode;
  league_code: LeagueCode | "";
  round: string;
  stage_label: string;
  stage_order: string;
  match_date: string;
  home_team_id: string;
  away_team_id: string;
  highlight_url: string;
  stadium_name: string;
  home_score: string;
  away_score: string;
  status: MatchStatus;
  competition: string;
}

export interface TeamMutationInput {
  id?: string;
  name: string;
  short_name: string;
  logo_url: string;
  home_stadium_name: string;
  is_primary: boolean;
  is_active: boolean;
}

export interface SeasonMutationInput {
  id?: string;
  code: string;
  is_current: boolean;
  is_active: boolean;
}

export interface SeasonTeamLeagueMutationInput {
  id?: string;
  season_id: string;
  team_id: string;
  league_code: LeagueCode;
}

export interface SeasonTeamStatsSyncInput {
  season_id: string;
  team_id: string;
  stats_payload_json: string;
}

export interface MatchJsonSyncInput {
  season_id: string;
  league_code: LeagueCode;
  matches_payload_json: string;
}

export interface PlayerMutationInput {
  id?: string;
  name: string;
  name_en: string;
  position: PlayerPosition;
  birth_date: string;
  nationality: string;
  profile_image_url: string;
  bio: string;
}

export interface PlayerSeasonMutationInput {
  id?: string;
  player_id: string;
  season_id: string;
  team_id: string;
  season: string;
  squad_number: string;
  is_captain: boolean;
  is_active: boolean;
  is_injured: boolean;
  injury_detail: string;
  is_loan: boolean;
  loan_team: string;
  is_national_team: boolean;
}

export interface PlayerStatMutationInput {
  id?: string;
  player_id: string;
  season: string;
  appearances: string;
  goals: string;
  assists: string;
  rating_average: string;
  yellow_cards: string;
  red_cards: string;
  minutes_played: string;
  clean_sheets: string;
}

export interface SeatZoneMutationInput {
  id?: string;
  zone_name: string;
  description: string;
  atmosphere: string;
  price_range: string;
  tips: string;
  image_url: string;
  sort_order: string;
  is_active: boolean;
}

export interface GuideContentMutationInput {
  id?: string;
  category: GuideCategory;
  title: string;
  description: string;
  content: string;
  image_url: string;
  external_url: string;
  sort_order: string;
  is_active: boolean;
}

export interface TimelineMutationInput {
  id?: string;
  year: string;
  title: string;
  description: string;
  image_url: string;
  sort_order: string;
  is_active: boolean;
}

export interface StadiumMutationInput {
  id?: string;
  name: string;
  archive_year: string;
  address: string;
  capacity: string;
  description: string;
  images: string;
  latitude: string;
  longitude: string;
  sort_order: string;
  is_active: boolean;
  is_current: boolean;
}

export interface TicketMutationInput {
  id?: string;
  title: string;
  archive_year: string;
  description: string;
  images: string;
  sort_order: string;
  is_active: boolean;
}

export interface UniformMutationInput {
  id?: string;
  season: string;
  type: UniformType;
  manufacturer: string;
  image_url: string;
  description: string;
  sort_order: string;
  is_active: boolean;
}

export interface MapPlaceMutationInput {
  id?: string;
  name: string;
  category: MapPlaceCategory;
  naver_place_url: string;
  address: string;
  phone: string;
  benefit_info: string;
  menu_items: string[];
  description: string;
  image_url: string;
  is_active: boolean;
}

export interface ChantMutationInput {
  id?: string;
  title: string;
  lyrics: string;
  audio_url: string;
  duration: string;
  category: ChantCategory;
  description: string;
  sort_order: string;
  is_active: boolean;
}

export interface NewsMutationInput {
  id?: string;
  title: string;
  source: string;
  url: string;
  thumbnail_url: string;
  published_at: string;
  is_active: boolean;
}

export interface SitePageMutationInput {
  id?: string;
  page_key: string;
  title: string;
  description: string;
  content: string;
  is_active: boolean;
}

export interface NoticeMutationInput {
  id?: string;
  title: string;
  content: string;
  published_at: string;
  is_active: boolean;
  is_pinned: boolean;
}

export interface InquiryStatusMutationInput {
  id: string;
  status: "inquiry" | "processing" | "completed";
}

function success(message: string, entityId?: string): AdminMutationResult {
  return { status: "success", message, entityId };
}

function failure(message: string): AdminMutationResult {
  return { status: "error", message };
}

function normalizeString(value: string) {
  return value.trim();
}

function normalizeNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseInteger(value: string, label: string) {
  const trimmed = value.trim();
  const parsed = Number.parseInt(trimmed, 10);

  if (!trimmed || Number.isNaN(parsed)) {
    throw new Error(`${label} 값을 확인해 주세요.`);
  }

  return parsed;
}

function parseNullableInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isNaN(parsed)) {
    throw new Error("숫자 형식이 올바르지 않습니다.");
  }
  return parsed;
}

function parseNullableFloat(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  if (Number.isNaN(parsed)) {
    throw new Error("숫자 형식이 올바르지 않습니다.");
  }
  return parsed;
}

function parseImageList(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function toSeoulIsoString(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("일시를 입력해 주세요.");
  }
  return new Date(`${trimmed}:00+09:00`).toISOString();
}

function toNullableIsoString(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return new Date(`${trimmed}:00+09:00`).toISOString();
}

function getRequiredServerEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} 환경 변수가 필요합니다.`);
  }
  return value;
}

async function geocodeAddress(address: string) {
  const trimmedAddress = normalizeString(address);
  if (!trimmedAddress) {
    throw new Error("주소를 입력해 주세요.");
  }

  const keyId = getRequiredServerEnv("NAVER_MAPS_GEOCODE_API_KEY_ID");
  const key = getRequiredServerEnv("NAVER_MAPS_GEOCODE_API_KEY");
  const endpoint = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(trimmedAddress)}`;

  const response = await fetch(endpoint, {
    headers: {
      "x-ncp-apigw-api-key-id": keyId,
      "x-ncp-apigw-api-key": key,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("주소로 좌표를 찾지 못했습니다.");
  }

  const data = (await response.json()) as {
    addresses?: Array<{ x?: string; y?: string }>;
  };
  const firstAddress = data.addresses?.[0];

  if (!firstAddress?.x || !firstAddress?.y) {
    throw new Error("입력한 주소로 좌표를 찾지 못했습니다.");
  }

  return {
    latitude: Number.parseFloat(firstAddress.y),
    longitude: Number.parseFloat(firstAddress.x),
  };
}

async function getAdminSupabase(): Promise<AdminSupabaseContext> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return {
      kind: "error",
      result: failure("Supabase 환경 변수가 없어 관리자 작업을 실행할 수 없습니다."),
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return { kind: "error", result: failure(error.message) };
  }

  if (!isAdminUser(user)) {
    return { kind: "error", result: failure("관리자 권한이 필요합니다.") };
  }

  return { kind: "ok", supabase };
}

function revalidatePaths(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}

async function ensureSeasonTeamAssignment(
  supabase: ServerSupabase,
  seasonId: string,
  leagueCode: LeagueCode,
  teamId: string,
) {
  const { count, error } = await supabase
    .from("season_team_leagues")
    .select("*", { count: "exact", head: true })
    .eq("season_id", seasonId)
    .eq("league_code", leagueCode)
    .eq("team_id", teamId)

  if (error) {
    throw error
  }

  return (count ?? 0) > 0
}

async function ensureSeasonTeamMembership(
  supabase: ServerSupabase,
  seasonId: string,
  teamId: string,
) {
  const { count, error } = await supabase
    .from("season_team_leagues")
    .select("*", { count: "exact", head: true })
    .eq("season_id", seasonId)
    .eq("team_id", teamId)

  if (error) {
    throw error
  }

  return (count ?? 0) > 0
}

async function getSeasonTeamLeagueBySeasonAndTeam(
  supabase: ServerSupabase,
  seasonId: string,
  teamId: string,
) {
  const { data, error } = await supabase
    .from("season_team_leagues")
    .select("*, season:seasons(*), team:teams(*)")
    .eq("season_id", seasonId)
    .eq("team_id", teamId)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function saveSeason(input: SeasonMutationInput): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase()
    if (admin.kind === "error") return admin.result

    const payload = {
      code: normalizeString(input.code),
      is_current: input.is_current,
      is_active: input.is_active,
    }

    if (payload.is_current) {
      const resetQuery = admin.supabase.from("seasons").update({ is_current: false }).eq("is_current", true)

      if (input.id) {
        await resetQuery.neq("id", input.id)
      } else {
        await resetQuery
      }
    }

    const { error } = input.id
      ? await admin.supabase.from("seasons").update(payload).eq("id", input.id)
      : await admin.supabase.from("seasons").insert(payload)

    if (error) return failure(error.message)

    revalidatePaths([
      "/",
      "/admin",
      "/admin/seasons",
      "/admin/matches",
      "/admin/standings",
      "/matches",
      "/matches/schedule",
      "/matches/standings",
    ])
    return success(input.id ? "시즌 정보를 수정했습니다." : "시즌을 추가했습니다.")
  } catch (error) {
    return failure(error instanceof Error ? error.message : "시즌 저장 중 오류가 발생했습니다.")
  }
}

export async function deleteSeason(id: string): Promise<AdminMutationResult> {
  const admin = await getAdminSupabase()
  if (admin.kind === "error") return admin.result

  const [{ count: assignmentCount }, { count: matchCount }] = await Promise.all([
    admin.supabase.from("season_team_leagues").select("*", { count: "exact", head: true }).eq("season_id", id),
    admin.supabase.from("league_matches").select("*", { count: "exact", head: true }).eq("season_id", id),
  ])

  if ((assignmentCount ?? 0) > 0 || (matchCount ?? 0) > 0) {
    return failure("팀 배정 또는 경기 일정이 남아 있는 시즌은 삭제할 수 없습니다.")
  }

  const { error } = await admin.supabase.from("seasons").delete().eq("id", id)
  if (error) return failure(error.message)

  revalidatePaths([
    "/",
    "/admin",
    "/admin/seasons",
    "/admin/matches",
    "/admin/standings",
    "/matches",
    "/matches/schedule",
    "/matches/standings",
  ])
  return success("시즌을 삭제했습니다.")
}

export async function saveSeasonTeamLeague(input: SeasonTeamLeagueMutationInput): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase()
    if (admin.kind === "error") return admin.result

    const payload: {
      season_id: string
      team_id: string
      league_code: LeagueCode
    } = {
      season_id: normalizeString(input.season_id),
      team_id: normalizeString(input.team_id),
      league_code: input.league_code === "K2" ? "K2" : "K1",
    }

    const { error } = input.id
      ? await admin.supabase.from("season_team_leagues").update(payload).eq("id", input.id)
      : await admin.supabase.from("season_team_leagues").insert(payload)

    if (error) return failure(error.message)

    revalidatePaths([
      "/",
      "/admin",
      "/admin/seasons",
      "/admin/matches",
      "/admin/standings",
      "/matches",
      "/matches/schedule",
      "/matches/standings",
    ])
    return success(input.id ? "시즌 리그 배정을 수정했습니다." : "시즌 리그 배정을 추가했습니다.")
  } catch (error) {
    return failure(error instanceof Error ? error.message : "시즌 리그 배정 저장 중 오류가 발생했습니다.")
  }
}

export async function deleteSeasonTeamLeague(id: string): Promise<AdminMutationResult> {
  const admin = await getAdminSupabase()
  if (admin.kind === "error") return admin.result

  const { data: assignment, error: assignmentError } = await admin.supabase
    .from("season_team_leagues")
    .select("*")
    .eq("id", id)
    .single()

  if (assignmentError) return failure(assignmentError.message)

  const [{ count: homeCount }, { count: awayCount }] = await Promise.all([
    admin.supabase
      .from("league_matches")
      .select("*", { count: "exact", head: true })
      .eq("season_id", assignment.season_id)
      .eq("league_code", assignment.league_code)
      .eq("home_team_id", assignment.team_id),
    admin.supabase
      .from("league_matches")
      .select("*", { count: "exact", head: true })
      .eq("season_id", assignment.season_id)
      .eq("league_code", assignment.league_code)
      .eq("away_team_id", assignment.team_id),
  ])

  if ((homeCount ?? 0) > 0 || (awayCount ?? 0) > 0) {
    return failure("이미 경기 일정에 사용된 팀 배정은 삭제할 수 없습니다.")
  }

  const { error } = await admin.supabase.from("season_team_leagues").delete().eq("id", id)
  if (error) return failure(error.message)

  revalidatePaths([
    "/",
    "/admin",
    "/admin/seasons",
    "/admin/matches",
    "/admin/standings",
    "/matches",
    "/matches/schedule",
    "/matches/standings",
  ])
  return success("시즌 리그 배정을 삭제했습니다.")
}

export async function saveSeasonTeamStatsPayload(
  input: SeasonTeamStatsSyncInput,
): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase()
    if (admin.kind === "error") return admin.result

    const assignment = await getSeasonTeamLeagueBySeasonAndTeam(
      admin.supabase,
      normalizeString(input.season_id),
      normalizeString(input.team_id),
    )

    const { error } = await admin.supabase
      .from("season_team_leagues")
      .update({ stats_payload_json: normalizeNullableString(input.stats_payload_json) })
      .eq("id", assignment.id)

    if (error) return failure(error.message)

    revalidatePaths(["/admin", "/admin/players"])
    return success("선수 스탯 JSON을 저장했습니다.")
  } catch (error) {
    return failure(error instanceof Error ? error.message : "선수 스탯 JSON 저장 중 오류가 발생했습니다.")
  }
}

type ExternalSeasonPlayerStat = {
  playerId?: string
  playerName?: string
  fullName?: string | null
  position?: PlayerPosition
  countryName?: string | null
  image?: string | null
  dateOfBirth?: string | null
  backNumber?: number | null
  matchesPlayed?: number | null
  goals?: number | null
  assists?: number | null
  indexScore?: number | null
  yellowCards?: number | null
  redCards?: number | null
  minsPlayed?: number | null
  cleanSheets?: number | null
}

type ExternalLeagueMatch = {
  matchRound?: string | number | null
  round?: string | number | null
  gameDateTime?: string | null
  match_date?: string | null
  homeTeamName?: string | null
  awayTeamName?: string | null
  home_name?: string | null
  away_name?: string | null
  homeTeamScore?: number | string | null
  awayTeamScore?: number | string | null
  home_score?: number | string | null
  away_score?: number | string | null
}

const TEAM_NAME_ALIASES: Record<string, string> = {
  수원: "삼성",
  서울E: "E랜",
  충북청주: "청주",
  수원FC: "수원",
  충남아산: "아산",
}

function normalizeTeamLookupName(value: string) {
  const trimmed = normalizeString(value)
  return TEAM_NAME_ALIASES[trimmed] ?? trimmed
}

function parseRequiredScore(value: number | string | null | undefined, label: string) {
  if (value === null || value === undefined || value === "") {
    throw new Error(`${label} 값이 필요합니다.`)
  }

  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10)
  if (Number.isNaN(parsed)) {
    throw new Error(`${label} 값이 올바르지 않습니다.`)
  }

  return parsed
}

function parseExternalMatchDateTime(value: string | null | undefined) {
  const trimmed = normalizeString(value ?? "")
  if (!trimmed) {
    throw new Error("경기 일시 값이 필요합니다.")
  }

  const normalized = trimmed.replace(" ", "T")
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(normalized)) {
    return new Date(normalized).toISOString()
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
    return new Date(`${normalized}:00+09:00`).toISOString()
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(normalized)) {
    return new Date(`${normalized}+09:00`).toISOString()
  }

  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("경기 일시 형식이 올바르지 않습니다.")
  }

  return parsed.toISOString()
}

export async function syncSeasonTeamPlayerStats(
  input: SeasonTeamStatsSyncInput,
): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase()
    if (admin.kind === "error") return admin.result

    const assignment = await getSeasonTeamLeagueBySeasonAndTeam(
      admin.supabase,
      normalizeString(input.season_id),
      normalizeString(input.team_id),
    )

    const statsPayloadJson = normalizeString(input.stats_payload_json || assignment.stats_payload_json || "")
    if (!statsPayloadJson) {
      return failure("선수 스탯 JSON을 먼저 입력해 주세요.")
    }

    if (statsPayloadJson !== (assignment.stats_payload_json ?? "")) {
      const saveResult = await saveSeasonTeamStatsPayload(input)
      if (saveResult.status === "error") {
        return saveResult
      }
    }

    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(statsPayloadJson)
    } catch {
      return failure("선수 스탯 JSON 형식이 올바르지 않습니다.")
    }

    const stats = (
      Array.isArray(parsedJson)
        ? parsedJson
        : Array.isArray((parsedJson as { seasonPlayerStats?: unknown[] })?.seasonPlayerStats)
          ? (parsedJson as { seasonPlayerStats: unknown[] }).seasonPlayerStats
          : Array.isArray((parsedJson as { result?: { seasonPlayerStats?: unknown[] } })?.result?.seasonPlayerStats)
            ? (parsedJson as { result: { seasonPlayerStats: unknown[] } }).result.seasonPlayerStats
            : []
    ) as ExternalSeasonPlayerStat[]

    if (!Array.isArray(stats) || !stats.length) {
      return failure("가져올 선수 스탯 데이터가 없습니다.")
    }

    const seasonCode = assignment.season?.code ?? ""
    let syncedCount = 0

    for (const item of stats) {
      const playerName = normalizeString(item.playerName ?? "")
      if (!playerName) continue

      const birthDate = normalizeNullableString(item.dateOfBirth ?? "")
      let playerQuery = admin.supabase.from("players").select("*").eq("name", playerName)
      playerQuery = birthDate ? playerQuery.eq("birth_date", birthDate) : playerQuery.is("birth_date", null)

      const { data: existingPlayers, error: existingPlayerError } = await playerQuery.limit(1)
      if (existingPlayerError) {
        return failure(existingPlayerError.message)
      }

      const playerPayload = {
        name: playerName,
        position: item.position ?? "MF",
        birth_date: birthDate,
        nationality: normalizeString(item.countryName ?? "대한민국"),
        profile_image_url: normalizeNullableString(item.image ?? ""),
      }

      let playerId = (existingPlayers?.[0] as { id: string } | undefined)?.id

      if (playerId) {
        const { error: playerUpdateError } = await admin.supabase
          .from("players")
          .update(playerPayload)
          .eq("id", playerId)

        if (playerUpdateError) {
          return failure(playerUpdateError.message)
        }
      } else {
        const { data: insertedPlayer, error: insertPlayerError } = await admin.supabase
          .from("players")
          .insert({
            ...playerPayload,
            bio: null,
          })
          .select("id")
          .single()

        if (insertPlayerError) {
          return failure(insertPlayerError.message)
        }

        playerId = insertedPlayer.id
      }

      const { data: existingSeasonRow, error: existingSeasonError } = await admin.supabase
        .from("player_seasons")
        .select("id")
        .eq("player_id", playerId)
        .eq("season", seasonCode)
        .maybeSingle()

      if (existingSeasonError) {
        return failure(existingSeasonError.message)
      }

      if (existingSeasonRow?.id) {
        const { error: updateSeasonError } = await admin.supabase
          .from("player_seasons")
          .update({
            season_id: assignment.season_id,
            team_id: assignment.team_id,
            squad_number: item.backNumber ?? null,
            is_active: true,
          })
          .eq("id", existingSeasonRow.id)

        if (updateSeasonError) {
          return failure(updateSeasonError.message)
        }
      } else {
        const { error: insertSeasonError } = await admin.supabase.from("player_seasons").insert({
          player_id: playerId,
          season_id: assignment.season_id,
          team_id: assignment.team_id,
          season: seasonCode,
          squad_number: item.backNumber ?? null,
          is_captain: false,
          is_active: true,
          is_injured: false,
          injury_detail: null,
          is_loan: false,
          loan_team: null,
          is_national_team: false,
          joined_from: null,
          left_to: null,
          notes: null,
        })

        if (insertSeasonError) {
          return failure(insertSeasonError.message)
        }
      }

      const { error: upsertStatsError } = await admin.supabase.from("player_stats").upsert(
        {
          player_id: playerId,
          season: seasonCode,
          appearances: item.matchesPlayed ?? 0,
          goals: item.goals ?? 0,
          assists: item.assists ?? 0,
          rating_average: item.indexScore ?? null,
          yellow_cards: item.yellowCards ?? 0,
          red_cards: item.redCards ?? 0,
          minutes_played: item.minsPlayed ?? 0,
          clean_sheets: item.cleanSheets ?? 0,
        },
        { onConflict: "player_id,season" },
      )

      if (upsertStatsError) {
        return failure(upsertStatsError.message)
      }

      syncedCount += 1
    }

    revalidatePaths(["/", "/admin", "/admin/players", "/history/players", "/matches/stats"])
    return success(`선수 스탯 ${syncedCount}건을 갱신했습니다.`)
  } catch (error) {
    return failure(error instanceof Error ? error.message : "선수 스탯 동기화 중 오류가 발생했습니다.")
  }
}

export async function syncSeasonLeagueMatchesFromJson(
  input: MatchJsonSyncInput,
): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase()
    if (admin.kind === "error") return admin.result

    const seasonId = normalizeString(input.season_id)
    const leagueCode: LeagueCode = input.league_code === "K2" ? "K2" : "K1"
    const payloadJson = normalizeString(input.matches_payload_json)

    if (!seasonId) {
      return failure("시즌을 선택해 주세요.")
    }

    if (!payloadJson) {
      return failure("경기 JSON을 입력해 주세요.")
    }

    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(payloadJson)
    } catch {
      return failure("경기 JSON 형식이 올바르지 않습니다.")
    }

    const matches = (
      Array.isArray(parsedJson)
        ? parsedJson
        : Array.isArray((parsedJson as { games?: unknown[] })?.games)
          ? (parsedJson as { games: unknown[] }).games
          : Array.isArray((parsedJson as { result?: { games?: unknown[] } })?.result?.games)
            ? (parsedJson as { result: { games: unknown[] } }).result.games
            : []
    ) as ExternalLeagueMatch[]

    if (!matches.length) {
      return failure("가져올 경기 데이터가 없습니다.")
    }

    const { data: assignments, error: assignmentsError } = await admin.supabase
      .from("season_team_leagues")
      .select("team_id, team:teams(id, name, short_name, home_stadium_name)")
      .eq("season_id", seasonId)
      .eq("league_code", leagueCode)

    if (assignmentsError) {
      return failure(assignmentsError.message)
    }

    const teamLookup = new Map<
      string,
      { id: string; name: string | null; short_name: string | null; home_stadium_name: string | null }
    >()

    for (const assignment of assignments ?? []) {
      const teamRelation = assignment.team as unknown
      const team = (Array.isArray(teamRelation) ? teamRelation[0] : teamRelation) as
        | {
        id: string
        name: string | null
        short_name: string | null
        home_stadium_name: string | null
      }
        | null

      if (!team) continue

      if (team.name) teamLookup.set(normalizeTeamLookupName(team.name), team)
      if (team.short_name) teamLookup.set(normalizeTeamLookupName(team.short_name), team)
    }

    let syncedCount = 0

    for (const item of matches) {
      const roundValue = item.matchRound ?? item.round
      const round =
        roundValue === null || roundValue === undefined || roundValue === ""
          ? null
          : Number.parseInt(String(roundValue), 10)

      if (round === null || Number.isNaN(round)) {
        return failure("라운드 값이 올바르지 않은 경기가 있습니다.")
      }

      const homeName = normalizeTeamLookupName(item.homeTeamName ?? item.home_name ?? "")
      const awayName = normalizeTeamLookupName(item.awayTeamName ?? item.away_name ?? "")

      if (!homeName || !awayName) {
        return failure("홈팀 또는 원정팀 정보가 없는 경기가 있습니다.")
      }

      const homeTeam = teamLookup.get(homeName)
      const awayTeam = teamLookup.get(awayName)

      if (!homeTeam || !awayTeam) {
        return failure(`팀 매칭에 실패했습니다: ${homeName} vs ${awayName}`)
      }

      const matchDate = parseExternalMatchDateTime(item.gameDateTime ?? item.match_date)
      const homeScore = parseRequiredScore(item.homeTeamScore ?? item.home_score, "홈팀 점수")
      const awayScore = parseRequiredScore(item.awayTeamScore ?? item.away_score, "원정팀 점수")

      const payload = {
        season_id: seasonId,
        competition_code: leagueCode,
        league_code: leagueCode,
        round,
        stage_label: null,
        stage_order: null,
        match_date: matchDate,
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        highlight_url: null,
        stadium_name: homeTeam.home_stadium_name ?? null,
        home_score: homeScore,
        away_score: awayScore,
        status: "finished" as MatchStatus,
        competition: leagueCode === "K2" ? "K리그2" : "K리그1",
      }

      const { data: existingMatch, error: existingMatchError } = await admin.supabase
        .from("league_matches")
        .select("id")
        .eq("season_id", seasonId)
        .eq("competition_code", leagueCode)
        .eq("league_code", leagueCode)
        .eq("round", round)
        .eq("match_date", matchDate)
        .eq("home_team_id", homeTeam.id)
        .eq("away_team_id", awayTeam.id)
        .maybeSingle()

      if (existingMatchError) {
        return failure(existingMatchError.message)
      }

      const { error } = existingMatch?.id
        ? await admin.supabase.from("league_matches").update(payload).eq("id", existingMatch.id)
        : await admin.supabase.from("league_matches").insert(payload)

      if (error) {
        return failure(error.message)
      }

      syncedCount += 1
    }

    revalidatePaths(["/", "/admin", "/admin/matches", "/matches", "/matches/schedule", "/matches/standings"])
    return success(`경기 ${syncedCount}건을 JSON으로 반영했습니다.`)
  } catch (error) {
    return failure(error instanceof Error ? error.message : "경기 JSON 반영 중 오류가 발생했습니다.")
  }
}

export async function saveTeam(input: TeamMutationInput): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase();
    if (admin.kind === "error") return admin.result;

    const payload = {
      name: normalizeString(input.name),
      short_name: normalizeNullableString(input.short_name),
      logo_url: normalizeNullableString(input.logo_url),
      home_stadium_name: normalizeNullableString(input.home_stadium_name),
      is_primary: input.is_primary,
      is_active: input.is_active,
    };

    if (payload.is_primary) {
      const resetQuery = admin.supabase
        .from("teams")
        .update({ is_primary: false })
        .eq("is_primary", true);

      if (input.id) {
        await resetQuery.neq("id", input.id);
      } else {
        await resetQuery;
      }
    }

    const { error } = input.id
      ? await admin.supabase.from("teams").update(payload).eq("id", input.id)
      : await admin.supabase.from("teams").insert(payload);

    if (error) return failure(error.message);

    revalidatePaths([
      "/",
      "/admin",
      "/admin/seasons",
      "/admin/teams",
      "/admin/matches",
      "/admin/standings",
      "/matches",
      "/matches/schedule",
      "/matches/standings",
    ]);
    return success(input.id ? "팀 정보를 수정했습니다." : "팀을 추가했습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "팀 저장 중 오류가 발생했습니다.");
  }
}

export async function deleteTeam(id: string): Promise<AdminMutationResult> {
  const admin = await getAdminSupabase();
  if (admin.kind === "error") return admin.result;

  const [{ count: homeCount }, { count: awayCount }, { count: assignmentCount }] = await Promise.all([
    admin.supabase
      .from("league_matches")
      .select("*", { count: "exact", head: true })
      .eq("home_team_id", id),
    admin.supabase
      .from("league_matches")
      .select("*", { count: "exact", head: true })
      .eq("away_team_id", id),
    admin.supabase
      .from("season_team_leagues")
      .select("*", { count: "exact", head: true })
      .eq("team_id", id),
  ]);

  if ((homeCount ?? 0) > 0 || (awayCount ?? 0) > 0) {
    return failure("이미 등록된 경기 일정이 있는 팀은 삭제할 수 없습니다.");
  }

  if ((assignmentCount ?? 0) > 0) {
    return failure("시즌 리그 배정이 남아 있는 팀은 삭제할 수 없습니다.");
  }

  const { error } = await admin.supabase.from("teams").delete().eq("id", id);
  if (error) return failure(error.message);

  revalidatePaths([
    "/",
    "/admin",
    "/admin/seasons",
    "/admin/teams",
    "/admin/matches",
    "/admin/standings",
    "/matches",
    "/matches/schedule",
    "/matches/standings",
  ]);
  return success("팀을 삭제했습니다.");
}

export async function saveMatch(input: MatchMutationInput): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase();
    if (admin.kind === "error") return admin.result;

    const competitionCode: CompetitionCode =
      input.competition_code === "K2"
        ? "K2"
        : input.competition_code === "KOREA_CUP"
          ? "KOREA_CUP"
          : "K1";
    const resolvedLeagueCode: LeagueCode | null =
      competitionCode === "KOREA_CUP" ? null : competitionCode;
    const homeTeamId = normalizeString(input.home_team_id);
    const awayTeamId = normalizeString(input.away_team_id);
    const rawStadiumName = normalizeNullableString(input.stadium_name);

    let resolvedStadiumName = rawStadiumName;
    if (homeTeamId && !resolvedStadiumName) {
      const { data: homeTeam, error: homeTeamError } = await admin.supabase
        .from("teams")
        .select("home_stadium_name")
        .eq("id", homeTeamId)
        .single();

      if (homeTeamError) return failure(homeTeamError.message);
      resolvedStadiumName = homeTeam?.home_stadium_name ?? null;
    }

    const payload: {
      season_id: string
      competition_code: CompetitionCode
      league_code: LeagueCode | null
      round: number | null
      stage_label: string | null
      stage_order: number | null
      match_date: string
      home_team_id: string
      away_team_id: string
      highlight_url: string | null
      stadium_name: string | null
      home_score: number | null
      away_score: number | null
      status: MatchStatus
      competition: string
    } = {
      season_id: normalizeString(input.season_id),
      competition_code: competitionCode,
      league_code: resolvedLeagueCode,
      round: competitionCode === "KOREA_CUP" ? null : parseNullableInteger(input.round),
      stage_label:
        competitionCode === "KOREA_CUP" ? normalizeNullableString(input.stage_label) : null,
      stage_order:
        competitionCode === "KOREA_CUP" ? parseNullableInteger(input.stage_order) : null,
      match_date: toSeoulIsoString(input.match_date),
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      highlight_url: normalizeNullableString(input.highlight_url),
      stadium_name: resolvedStadiumName,
      home_score: parseNullableInteger(input.home_score),
      away_score: parseNullableInteger(input.away_score),
      status: input.status,
      competition:
        normalizeString(input.competition) ||
        (competitionCode === "K2"
          ? "K리그2"
          : competitionCode === "KOREA_CUP"
            ? "코리아컵"
            : "K리그1"),
    };

    if (payload.home_team_id === payload.away_team_id) {
      return failure("홈팀과 원정팀은 서로 달라야 합니다.");
    }

    if (competitionCode !== "KOREA_CUP" && payload.round === null) {
      return failure("리그 경기는 라운드를 입력해 주세요.");
    }

    if (competitionCode === "KOREA_CUP" && !payload.stage_label) {
      return failure("코리아컵 경기는 단계명을 입력해 주세요.");
    }

    const [homeAssigned, awayAssigned] = await Promise.all([
      competitionCode === "KOREA_CUP"
        ? ensureSeasonTeamMembership(admin.supabase, payload.season_id, payload.home_team_id)
        : ensureSeasonTeamAssignment(
            admin.supabase,
            payload.season_id,
            payload.league_code!,
            payload.home_team_id,
          ),
      competitionCode === "KOREA_CUP"
        ? ensureSeasonTeamMembership(admin.supabase, payload.season_id, payload.away_team_id)
        : ensureSeasonTeamAssignment(
            admin.supabase,
            payload.season_id,
            payload.league_code!,
            payload.away_team_id,
          ),
    ])

    if (!homeAssigned || !awayAssigned) {
      return failure(
        competitionCode === "KOREA_CUP"
          ? "선택한 시즌에 배정된 팀만 코리아컵 경기로 등록할 수 있습니다."
          : "선택한 시즌과 리그에 배정된 팀만 경기로 등록할 수 있습니다.",
      )
    }

    const { error } = input.id
      ? await admin.supabase.from("league_matches").update(payload).eq("id", input.id)
      : await admin.supabase.from("league_matches").insert(payload);

    if (error) return failure(error.message);

    revalidatePaths(["/", "/admin", "/admin/seasons", "/admin/matches", "/matches", "/matches/schedule", "/matches/standings"]);
    return success(input.id ? "경기 정보를 수정했습니다." : "경기를 추가했습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "경기 저장 중 오류가 발생했습니다.");
  }
}

export async function deleteMatch(id: string): Promise<AdminMutationResult> {
  const admin = await getAdminSupabase();
  if (admin.kind === "error") return admin.result;

  const { error } = await admin.supabase.from("league_matches").delete().eq("id", id);
  if (error) return failure(error.message);

  revalidatePaths(["/", "/admin", "/admin/seasons", "/admin/matches", "/matches", "/matches/schedule", "/matches/standings"]);
  return success("경기를 삭제했습니다.");
}

export async function savePlayer(input: PlayerMutationInput): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase();
    if (admin.kind === "error") return admin.result;

    const payload = {
      name: normalizeString(input.name),
      name_en: normalizeNullableString(input.name_en),
      position: input.position,
      birth_date: normalizeNullableString(input.birth_date),
      nationality: normalizeString(input.nationality),
      profile_image_url: normalizeNullableString(input.profile_image_url),
      bio: normalizeNullableString(input.bio),
    };

    const query = input.id
      ? admin.supabase.from("players").update(payload).eq("id", input.id).select("id").single()
      : admin.supabase.from("players").insert(payload).select("id").single();

    const { data, error } = await query;
    if (error) return failure(error.message);

    revalidatePaths(["/admin", "/admin/players", "/history/players", "/matches/stats"]);
    return success(input.id ? "선수 정보를 수정했습니다." : "선수를 추가했습니다.", data?.id ?? input.id);
  } catch (error) {
    return failure(error instanceof Error ? error.message : "선수 저장 중 오류가 발생했습니다.");
  }
}

export async function deletePlayer(id: string): Promise<AdminMutationResult> {
  const admin = await getAdminSupabase();
  if (admin.kind === "error") return admin.result;

  const { error } = await admin.supabase.from("players").delete().eq("id", id);
  if (error) return failure(error.message);

  revalidatePaths(["/admin", "/admin/players", "/history/players", "/matches/stats"]);
  return success("선수를 삭제했습니다.");
}

export async function savePlayerSeason(input: PlayerSeasonMutationInput): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase();
    if (admin.kind === "error") return admin.result;

      const payload = {
        player_id: normalizeString(input.player_id),
        season_id: normalizeNullableString(input.season_id),
        team_id: normalizeNullableString(input.team_id),
        season: normalizeString(input.season),
        squad_number: parseNullableInteger(input.squad_number),
        is_captain: input.is_captain,
        is_active: input.is_active,
        is_injured: input.is_injured,
        injury_detail: normalizeNullableString(input.injury_detail),
        is_loan: input.is_loan,
        loan_team: normalizeNullableString(input.loan_team),
        is_national_team: input.is_national_team,
        joined_from: null,
        left_to: null,
        notes: null,
      };

    const { error } = input.id
      ? await admin.supabase.from("player_seasons").update(payload).eq("id", input.id)
      : await admin.supabase.from("player_seasons").insert(payload);

    if (error) return failure(error.message);

    revalidatePaths(["/admin", "/admin/players", "/history/players"]);
    return success(input.id ? "선수 시즌 정보를 수정했습니다." : "선수 시즌 정보를 추가했습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "선수 시즌 저장 중 오류가 발생했습니다.");
  }
}

export async function deletePlayerSeason(id: string): Promise<AdminMutationResult> {
  const admin = await getAdminSupabase();
  if (admin.kind === "error") return admin.result;

  const { error } = await admin.supabase.from("player_seasons").delete().eq("id", id);
  if (error) return failure(error.message);

  revalidatePaths(["/admin", "/admin/players", "/history/players"]);
  return success("선수 시즌 정보를 삭제했습니다.");
}

export async function savePlayerStat(input: PlayerStatMutationInput): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase();
    if (admin.kind === "error") return admin.result;

    const payload = {
      player_id: normalizeString(input.player_id),
      season: normalizeString(input.season),
      appearances: parseInteger(input.appearances, "출전"),
      goals: parseInteger(input.goals, "득점"),
      assists: parseInteger(input.assists, "도움"),
      rating_average: parseNullableFloat(input.rating_average),
      yellow_cards: parseInteger(input.yellow_cards, "경고"),
      red_cards: parseInteger(input.red_cards, "퇴장"),
      minutes_played: parseInteger(input.minutes_played, "출전 시간"),
      clean_sheets: parseInteger(input.clean_sheets, "클린시트"),
    };

    const { error } = input.id
      ? await admin.supabase.from("player_stats").update(payload).eq("id", input.id)
      : await admin.supabase.from("player_stats").insert(payload);

    if (error) return failure(error.message);

    revalidatePaths(["/", "/admin", "/admin/players", "/history/players", "/matches/stats"]);
    return success(input.id ? "선수 스탯을 수정했습니다." : "선수 스탯을 추가했습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "선수 스탯 저장 중 오류가 발생했습니다.");
  }
}

export async function deletePlayerStat(id: string): Promise<AdminMutationResult> {
  const admin = await getAdminSupabase();
  if (admin.kind === "error") return admin.result;

  const { error } = await admin.supabase.from("player_stats").delete().eq("id", id);
  if (error) return failure(error.message);

  revalidatePaths(["/", "/admin", "/admin/players", "/history/players", "/matches/stats"]);
  return success("선수 스탯을 삭제했습니다.");
}

export async function deletePlayerRosterEntry(id: string): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase();
    if (admin.kind === "error") return admin.result;

    const { data: roster, error: rosterError } = await admin.supabase
      .from("player_seasons")
      .select("id, player_id, season")
      .eq("id", id)
      .single();

    if (rosterError || !roster) {
      return failure(rosterError?.message ?? "선수 시즌 정보를 찾을 수 없습니다.");
    }

    const { error: statError } = await admin.supabase
      .from("player_stats")
      .delete()
      .eq("player_id", roster.player_id)
      .eq("season", roster.season);

    if (statError) return failure(statError.message);

    const { error: seasonError } = await admin.supabase.from("player_seasons").delete().eq("id", id);
    if (seasonError) return failure(seasonError.message);

    const { count, error: countError } = await admin.supabase
      .from("player_seasons")
      .select("*", { count: "exact", head: true })
      .eq("player_id", roster.player_id);

    if (countError) return failure(countError.message);

    if (!count) {
      const { error: playerError } = await admin.supabase.from("players").delete().eq("id", roster.player_id);
      if (playerError) return failure(playerError.message);
    }

    revalidatePaths(["/", "/admin", "/admin/players", "/history/players", "/matches/stats"]);
    return success("선수 등록 정보를 삭제했습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "선수 등록 삭제 중 오류가 발생했습니다.");
  }
}
export async function saveSeatZone(input: SeatZoneMutationInput): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase();
    if (admin.kind === "error") return admin.result;

    const payload = {
      zone_name: normalizeString(input.zone_name),
      description: normalizeNullableString(input.description),
      atmosphere: normalizeNullableString(input.atmosphere),
      price_range: normalizeNullableString(input.price_range),
      tips: normalizeNullableString(input.tips),
      image_url: normalizeNullableString(input.image_url),
      sort_order: parseInteger(input.sort_order, "정렬"),
      is_active: input.is_active,
    };

    const { error } = input.id
      ? await admin.supabase.from("seat_zones").update(payload).eq("id", input.id)
      : await admin.supabase.from("seat_zones").insert(payload);

    if (error) return failure(error.message);

    revalidatePaths(["/admin", "/admin/guide", "/guide", "/guide/seats"]);
    return success(input.id ? "좌석 구역을 수정했습니다." : "좌석 구역을 추가했습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "좌석 구역 저장 중 오류가 발생했습니다.");
  }
}

export async function deleteSeatZone(id: string): Promise<AdminMutationResult> {
  const admin = await getAdminSupabase();
  if (admin.kind === "error") return admin.result;

  const { error } = await admin.supabase.from("seat_zones").delete().eq("id", id);
  if (error) return failure(error.message);

  revalidatePaths(["/admin", "/admin/guide", "/guide", "/guide/seats"]);
  return success("좌석 구역을 삭제했습니다.");
}

export async function saveGuideContent(input: GuideContentMutationInput): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase();
    if (admin.kind === "error") return admin.result;

    const payload = {
      category: input.category,
      title: normalizeString(input.title),
      description: normalizeNullableString(input.description),
      content: normalizeNullableString(input.content),
      image_url: normalizeNullableString(input.image_url),
      external_url: normalizeNullableString(input.external_url),
      sort_order: parseInteger(input.sort_order, "정렬"),
      is_active: input.is_active,
    };

    const { error } = input.id
      ? await admin.supabase.from("guide_contents").update(payload).eq("id", input.id)
      : await admin.supabase.from("guide_contents").insert(payload);

    if (error) return failure(error.message);

    revalidatePaths(["/admin", "/admin/guide", "/guide", "/guide/away-bus", "/guide/merch", "/guide/groups", "/guide/community"]);
    return success(input.id ? "가이드 콘텐츠를 수정했습니다." : "가이드 콘텐츠를 추가했습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "가이드 저장 중 오류가 발생했습니다.");
  }
}

export async function deleteGuideContent(id: string): Promise<AdminMutationResult> {
  const admin = await getAdminSupabase();
  if (admin.kind === "error") return admin.result;

  const { error } = await admin.supabase.from("guide_contents").delete().eq("id", id);
  if (error) return failure(error.message);

  revalidatePaths(["/admin", "/admin/guide", "/guide", "/guide/away-bus", "/guide/merch", "/guide/groups", "/guide/community"]);
  return success("가이드 콘텐츠를 삭제했습니다.");
}

export async function saveTimeline(input: TimelineMutationInput): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase();
    if (admin.kind === "error") return admin.result;

    const payload = {
      year: parseInteger(input.year, "연도"),
      title: normalizeString(input.title),
      description: normalizeNullableString(input.description),
      image_url: normalizeNullableString(input.image_url),
      sort_order: parseInteger(input.sort_order, "정렬"),
      is_active: input.is_active,
    };

    const { error } = input.id
      ? await admin.supabase.from("history_timeline").update(payload).eq("id", input.id)
      : await admin.supabase.from("history_timeline").insert(payload);

    if (error) return failure(error.message);

    revalidatePaths(["/admin", "/admin/history", "/history", "/history/timeline"]);
    return success(input.id ? "연표 항목을 수정했습니다." : "연표 항목을 추가했습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "연표 저장 중 오류가 발생했습니다.");
  }
}

export async function deleteTimeline(id: string): Promise<AdminMutationResult> {
  const admin = await getAdminSupabase();
  if (admin.kind === "error") return admin.result;

  const { error } = await admin.supabase.from("history_timeline").delete().eq("id", id);
  if (error) return failure(error.message);

  revalidatePaths(["/admin", "/admin/history", "/history", "/history/timeline"]);
  return success("연표 항목을 삭제했습니다.");
}

export async function saveStadium(input: StadiumMutationInput): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase();
    if (admin.kind === "error") return admin.result;

    const payload = {
      name: normalizeString(input.name),
      archive_year: parseNullableInteger(input.archive_year),
      address: normalizeNullableString(input.address),
      capacity: parseNullableInteger(input.capacity),
      description: normalizeNullableString(input.description),
      images: parseImageList(input.images),
      latitude: parseNullableFloat(input.latitude),
      longitude: parseNullableFloat(input.longitude),
      sort_order: parseInteger(input.sort_order || "0", "정렬"),
      is_active: input.is_active,
      is_current: input.is_current,
    };

    const { error } = input.id
      ? await admin.supabase.from("stadiums").update(payload).eq("id", input.id)
      : await admin.supabase.from("stadiums").insert(payload);

    if (error) return failure(error.message);

    revalidatePaths(["/admin", "/admin/history", "/history", "/history/stadium"]);
    return success(input.id ? "경기장 기록을 수정했습니다." : "경기장 기록을 추가했습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "경기장 저장 중 오류가 발생했습니다.");
  }
}

export async function deleteStadium(id: string): Promise<AdminMutationResult> {
  const admin = await getAdminSupabase();
  if (admin.kind === "error") return admin.result;

  const { error } = await admin.supabase.from("stadiums").delete().eq("id", id);
  if (error) return failure(error.message);

  revalidatePaths(["/admin", "/admin/history", "/history", "/history/stadium"]);
  return success("경기장 기록을 삭제했습니다.");
}

export async function saveTicket(input: TicketMutationInput): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase();
    if (admin.kind === "error") return admin.result;

    const payload = {
      title: normalizeString(input.title),
      archive_year: parseNullableInteger(input.archive_year),
      description: normalizeNullableString(input.description),
      images: parseImageList(input.images),
      sort_order: parseInteger(input.sort_order || "0", "정렬"),
      is_active: input.is_active,
    };

    const { error } = input.id
      ? await admin.supabase.from("ticket_archives").update(payload).eq("id", input.id)
      : await admin.supabase.from("ticket_archives").insert(payload);

    if (error) return failure(error.message);

    revalidatePaths(["/admin", "/admin/history", "/history", "/history/tickets"]);
    return success(input.id ? "티켓 기록을 수정했습니다." : "티켓 기록을 추가했습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "티켓 저장 중 오류가 발생했습니다.");
  }
}

export async function deleteTicket(id: string): Promise<AdminMutationResult> {
  const admin = await getAdminSupabase();
  if (admin.kind === "error") return admin.result;

  const { error } = await admin.supabase.from("ticket_archives").delete().eq("id", id);
  if (error) return failure(error.message);

  revalidatePaths(["/admin", "/admin/history", "/history", "/history/tickets"]);
  return success("티켓 기록을 삭제했습니다.");
}

export async function saveUniform(input: UniformMutationInput): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase();
    if (admin.kind === "error") return admin.result;

    const payload = {
      season: normalizeString(input.season),
      type: input.type,
      manufacturer: normalizeNullableString(input.manufacturer),
      image_url: normalizeNullableString(input.image_url),
      description: normalizeNullableString(input.description),
      sort_order: parseInteger(input.sort_order, "정렬"),
      is_active: input.is_active,
    };

    const { error } = input.id
      ? await admin.supabase.from("uniforms").update(payload).eq("id", input.id)
      : await admin.supabase.from("uniforms").insert(payload);

    if (error) return failure(error.message);

    revalidatePaths(["/admin", "/admin/history", "/history", "/history/uniform"]);
    return success(input.id ? "유니폼 기록을 수정했습니다." : "유니폼 기록을 추가했습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "유니폼 저장 중 오류가 발생했습니다.");
  }
}

export async function deleteUniform(id: string): Promise<AdminMutationResult> {
  const admin = await getAdminSupabase();
  if (admin.kind === "error") return admin.result;

  const { error } = await admin.supabase.from("uniforms").delete().eq("id", id);
  if (error) return failure(error.message);

  revalidatePaths(["/admin", "/admin/history", "/history", "/history/uniform"]);
  return success("유니폼 기록을 삭제했습니다.");
}
export async function saveMapPlace(input: MapPlaceMutationInput): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase();
    if (admin.kind === "error") return admin.result;

    const { latitude, longitude } = await geocodeAddress(input.address);

    const payload = {
      name: normalizeString(input.name),
      category: input.category,
      naver_place_url: normalizeNullableString(input.naver_place_url),
      address: normalizeString(input.address),
      phone: normalizeNullableString(input.phone),
      benefit_info: normalizeNullableString(input.benefit_info),
      menu_items: input.menu_items.map((item) => normalizeString(item)).filter(Boolean),
      description: normalizeNullableString(input.description),
      latitude,
      longitude,
      image_url: normalizeNullableString(input.image_url),
      external_url: null,
      sort_order: 0,
      is_active: input.is_active,
    };

    const { error } = input.id
      ? await admin.supabase.from("map_places").update(payload).eq("id", input.id)
      : await admin.supabase.from("map_places").insert(payload);

    if (error) return failure(error.message);

    revalidatePaths(["/admin", "/admin/map", "/map"]);
    return success(input.id ? "장소를 수정했습니다." : "장소를 추가했습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "장소 저장 중 오류가 발생했습니다.");
  }
}

export async function deleteMapPlace(id: string): Promise<AdminMutationResult> {
  const admin = await getAdminSupabase();
  if (admin.kind === "error") return admin.result;

  const { error } = await admin.supabase.from("map_places").delete().eq("id", id);
  if (error) return failure(error.message);

  revalidatePaths(["/admin", "/admin/map", "/map"]);
  return success("장소를 삭제했습니다.");
}

export async function saveChant(input: ChantMutationInput): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase();
    if (admin.kind === "error") return admin.result;

    const payload = {
      title: normalizeString(input.title),
      lyrics: normalizeNullableString(input.lyrics),
      audio_url: normalizeNullableString(input.audio_url),
      duration: parseNullableInteger(input.duration),
      category: input.category,
      description: normalizeNullableString(input.description),
      sort_order: parseInteger(input.sort_order, "정렬"),
      is_active: input.is_active,
    };

    const { error } = input.id
      ? await admin.supabase.from("chants").update(payload).eq("id", input.id)
      : await admin.supabase.from("chants").insert(payload);

    if (error) return failure(error.message);

    revalidatePaths(["/admin", "/admin/chants", "/chants"]);
    return success(input.id ? "응원가를 수정했습니다." : "응원가를 추가했습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "응원가 저장 중 오류가 발생했습니다.");
  }
}

export async function deleteChant(id: string): Promise<AdminMutationResult> {
  const admin = await getAdminSupabase();
  if (admin.kind === "error") return admin.result;

  const { error } = await admin.supabase.from("chants").delete().eq("id", id);
  if (error) return failure(error.message);

  revalidatePaths(["/admin", "/admin/chants", "/chants"]);
  return success("응원가를 삭제했습니다.");
}

export async function saveNewsItem(input: NewsMutationInput): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase();
    if (admin.kind === "error") return admin.result;

    const payload = {
      title: normalizeString(input.title),
      source: normalizeNullableString(input.source),
      url: normalizeString(input.url),
      thumbnail_url: normalizeNullableString(input.thumbnail_url),
      published_at: toNullableIsoString(input.published_at),
      is_active: input.is_active,
    };

    const { error } = input.id
      ? await admin.supabase.from("news").update(payload).eq("id", input.id)
      : await admin.supabase.from("news").insert(payload);

    if (error) return failure(error.message);

    revalidatePaths(["/admin", "/admin/news", "/news"]);
    return success(input.id ? "뉴스를 수정했습니다." : "뉴스를 추가했습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "뉴스 저장 중 오류가 발생했습니다.");
  }
}

export async function deleteNewsItem(id: string): Promise<AdminMutationResult> {
  const admin = await getAdminSupabase();
  if (admin.kind === "error") return admin.result;

  const { error } = await admin.supabase.from("news").delete().eq("id", id);
  if (error) return failure(error.message);

  revalidatePaths(["/admin", "/admin/news", "/news"]);
  return success("뉴스를 삭제했습니다.");
}

export async function saveSitePage(input: SitePageMutationInput): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase();
    if (admin.kind === "error") return admin.result;

    const payload = {
      page_key: normalizeString(input.page_key),
      title: normalizeString(input.title),
      description: normalizeNullableString(input.description),
      content: normalizeNullableString(input.content),
      is_active: input.is_active,
    };

    const { data, error } = await admin.supabase
      .from("site_pages")
      .upsert(payload, { onConflict: "page_key" })
      .select("id")
      .single();

    if (error) return failure(error.message);

    revalidatePaths(["/admin", "/admin/notices", "/notices"]);
    return success(input.id ? "페이지 소개를 수정했습니다." : "페이지 소개를 저장했습니다.", data.id);
  } catch (error) {
    return failure(error instanceof Error ? error.message : "페이지 소개 저장 중 오류가 발생했습니다.");
  }
}

export async function saveNotice(input: NoticeMutationInput): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase();
    if (admin.kind === "error") return admin.result;

    const payload = {
      title: normalizeString(input.title),
      content: normalizeNullableString(input.content),
      published_at: toNullableIsoString(input.published_at) ?? new Date().toISOString(),
      is_active: input.is_active,
      is_pinned: input.is_pinned,
    };

    const { error } = input.id
      ? await admin.supabase.from("notices").update(payload).eq("id", input.id)
      : await admin.supabase.from("notices").insert(payload);

    if (error) return failure(error.message);

    revalidatePaths(["/admin", "/admin/notices", "/notices"]);
    return success(input.id ? "공지사항을 수정했습니다." : "공지사항을 추가했습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "공지사항 저장 중 오류가 발생했습니다.");
  }
}

export async function deleteNotice(id: string): Promise<AdminMutationResult> {
  const admin = await getAdminSupabase();
  if (admin.kind === "error") return admin.result;

  const { error } = await admin.supabase.from("notices").delete().eq("id", id);
  if (error) return failure(error.message);

  revalidatePaths(["/admin", "/admin/notices", "/notices"]);
  return success("공지사항을 삭제했습니다.");
}

export async function updateInquiryStatus(
  input: InquiryStatusMutationInput,
): Promise<AdminMutationResult> {
  try {
    const admin = await getAdminSupabase();
    if (admin.kind === "error") return admin.result;

    const { error } = await admin.supabase
      .from("inquiries")
      .update({ status: input.status })
      .eq("id", input.id);

    if (error) return failure(error.message);

    revalidatePaths(["/admin", "/admin/inquiries"]);
    return success("문의 상태를 수정했습니다.");
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "문의 상태 수정 중 오류가 발생했습니다.",
    );
  }
}
