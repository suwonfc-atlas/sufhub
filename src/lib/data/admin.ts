import { createServerSupabaseClient } from "@/lib/supabase/server"
import type {
  Chant,
  ExperienceRule,
  GuideContent,
  HistoryTimeline,
  Inquiry,
  CompetitionCode,
  LeagueCode,
  LeagueMatch,
  MatchLineup,
  MapPlace,
  Notice,
  NoticePageContent,
  News,
  Player,
  PlayerSeason,
  PlayerStat,
  SeatZone,
  Season,
  SeasonTeamLeague,
  Stadium,
  Standing,
  Supporter,
  UserAccount,
  Team,
  TicketArchive,
  Uniform,
} from "@/types"

import { buildStandings } from "./league"
import { getFanRatingSettlementSummary, type FanRatingSettlementSummary } from "./fan-rating-settlement"

export const ADMIN_PAGE_SIZE = 10
const ADMIN_BULK_FETCH_SIZE = 1000

export interface AdminPageResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface AdminStandingsResult {
  seasons: Season[]
  selectedSeason: string
  selectedLeague: LeagueCode
  standings: Standing[]
}

export interface AdminDashboardLineupContext {
  primaryTeamId: string | null
  roster: PlayerSeason[]
  lineups: MatchLineup[]
}

export interface AdminDashboardFanRatingContext extends FanRatingSettlementSummary {}

function normalizePage(page?: number) {
  return page && page > 0 ? Math.floor(page) : 1
}

function createEmptyPageResult<T>(page = 1): AdminPageResult<T> {
  return {
    items: [],
    page,
    pageSize: ADMIN_PAGE_SIZE,
    totalCount: 0,
    totalPages: 1,
  }
}

function createPageResult<T>(
  items: T[],
  totalCount: number | null,
  page: number,
): AdminPageResult<T> {
  const safePage = normalizePage(page)
  const resolvedTotalCount = totalCount ?? 0

  return {
    items,
    page: safePage,
    pageSize: ADMIN_PAGE_SIZE,
    totalCount: resolvedTotalCount,
    totalPages: Math.max(1, Math.ceil(resolvedTotalCount / ADMIN_PAGE_SIZE)),
  }
}

function getPageRange(page?: number) {
  const safePage = normalizePage(page)
  const from = (safePage - 1) * ADMIN_PAGE_SIZE
  const to = from + ADMIN_PAGE_SIZE - 1

  return { page: safePage, from, to }
}

async function fetchAllLeagueMatches(supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>) {
  const items: Array<LeagueMatch & { season_record?: Season | null }> = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from("league_matches")
      .select(
        "*, season_record:seasons(*), home_team:teams!league_matches_home_team_id_fkey(*), away_team:teams!league_matches_away_team_id_fkey(*)",
      )
      .order("match_date", { ascending: false })
      .range(from, from + ADMIN_BULK_FETCH_SIZE - 1)

    if (error) {
      return [] as Array<LeagueMatch & { season_record?: Season | null }>
    }

    const batch = (data ?? []) as Array<LeagueMatch & { season_record?: Season | null }>
    items.push(...batch)

    if (batch.length < ADMIN_BULK_FETCH_SIZE) {
      break
    }

    from += ADMIN_BULK_FETCH_SIZE
  }

  return items
}

async function getAdminLeagueData() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return {
      teams: [] as Team[],
      seasons: [] as Season[],
      seasonTeamLeagues: [] as SeasonTeamLeague[],
      leagueMatches: [] as LeagueMatch[],
    }
  }

  try {
    const leagueMatchesPromise = fetchAllLeagueMatches(supabase)
    const [
      { data: teams, error: teamsError },
      { data: seasons, error: seasonsError },
      { data: seasonTeamLeagues, error: assignmentsError },
      leagueMatches,
    ] = await Promise.all([
      supabase.from("teams").select("*").order("created_at", { ascending: false }),
      supabase
        .from("seasons")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("season_team_leagues")
        .select("*, season:seasons(*), team:teams(*)")
        .order("created_at", { ascending: false }),
      leagueMatchesPromise,
    ])

    if (teamsError || seasonsError || assignmentsError) {
      return {
        teams: [] as Team[],
        seasons: [] as Season[],
        seasonTeamLeagues: [] as SeasonTeamLeague[],
        leagueMatches: [] as LeagueMatch[],
      }
    }

    return {
      teams: (teams ?? []) as Team[],
      seasons: (seasons ?? []) as Season[],
      seasonTeamLeagues: (seasonTeamLeagues ?? []) as SeasonTeamLeague[],
      leagueMatches: (leagueMatches as Array<LeagueMatch & { season_record?: Season | null }>).map(
        (match) => ({
          ...match,
          season: match.season_record?.code ?? "",
        }),
      ) as LeagueMatch[],
    }
  } catch {
    return {
      teams: [] as Team[],
      seasons: [] as Season[],
      seasonTeamLeagues: [] as SeasonTeamLeague[],
      leagueMatches: [] as LeagueMatch[],
    }
  }
}

export async function getAdminTeams() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase.from("teams").select("*").order("created_at", { ascending: false })

  if (error) return []
  return (data ?? []) as Team[]
}

export async function getAdminTeamsPage(page = 1) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return createEmptyPageResult<Team>(page)

  const { from, to, page: safePage } = getPageRange(page)
  const { data, count, error } = await supabase
    .from("teams")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) return createEmptyPageResult<Team>(safePage)
  return createPageResult((data ?? []) as Team[], count, safePage)
}

export async function getAdminSeasons() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("seasons")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return []
  return (data ?? []) as Season[]
}

export async function getAdminSeasonsPage(page = 1) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return createEmptyPageResult<Season>(page)

  const { from, to, page: safePage } = getPageRange(page)
  const { data, count, error } = await supabase
    .from("seasons")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) return createEmptyPageResult<Season>(safePage)
  return createPageResult((data ?? []) as Season[], count, safePage)
}

export async function getAdminSeasonTeamLeagues() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("season_team_leagues")
    .select("*, season:seasons(*), team:teams(*)")
    .order("created_at", { ascending: false })

  if (error) return []
  return (data ?? []) as SeasonTeamLeague[]
}

export async function getAdminSeasonTeamLeaguesPage(page = 1) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return createEmptyPageResult<SeasonTeamLeague>(page)

  const { from, to, page: safePage } = getPageRange(page)
  const { data, count, error } = await supabase
    .from("season_team_leagues")
    .select("*, season:seasons(*), team:teams(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) return createEmptyPageResult<SeasonTeamLeague>(safePage)
  return createPageResult((data ?? []) as SeasonTeamLeague[], count, safePage)
}

export async function getAdminMatches() {
  const { leagueMatches } = await getAdminLeagueData()
  return leagueMatches
}

export async function getAdminDashboardLineupContext(): Promise<AdminDashboardLineupContext> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return {
      primaryTeamId: null,
      roster: [],
      lineups: [],
    }
  }

  const { data: primaryTeamData } = await supabase
    .from("teams")
    .select("id")
    .eq("is_primary", true)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle()

  const primaryTeamId = (primaryTeamData as { id?: string } | null)?.id ?? null
  if (!primaryTeamId) {
    return {
      primaryTeamId: null,
      roster: [],
      lineups: [],
    }
  }

  const [{ data: rosterData }, { data: lineupsData }] = await Promise.all([
    supabase
      .from("player_seasons")
      .select("*, player:players(*), season_record:seasons(*), team:teams(*)")
      .eq("team_id", primaryTeamId)
      .order("season", { ascending: false })
      .order("squad_number", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("match_lineups")
      .select("*")
      .eq("team_id", primaryTeamId)
      .order("created_at", { ascending: false }),
  ])

  return {
    primaryTeamId,
    roster: (rosterData ?? []) as PlayerSeason[],
    lineups: (lineupsData ?? []) as MatchLineup[],
  }
}

export async function getAdminDashboardFanRatingContext(): Promise<AdminDashboardFanRatingContext> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return {
      pendingCount: 0,
      settledCount: 0,
      openMatch: null,
    }
  }

  return getFanRatingSettlementSummary(supabase)
}

export async function getAdminMatchesPage(
  page = 1,
  competitionCode: "all" | CompetitionCode = "all",
  seasonId?: string,
  round?: number,
  stageLabel?: string,
) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return createEmptyPageResult<LeagueMatch>(page)

  const { from, to, page: safePage } = getPageRange(page)
  let query = supabase
    .from("league_matches")
    .select(
      "*, season_record:seasons(*), home_team:teams!league_matches_home_team_id_fkey(*), away_team:teams!league_matches_away_team_id_fkey(*)",
      { count: "exact" },
    )
    .order("match_date", { ascending: false })

  if (competitionCode !== "all") {
    query = query.eq("competition_code", competitionCode)
  }

  if (seasonId) {
    query = query.eq("season_id", seasonId)
  }

  if (typeof round === "number" && Number.isFinite(round) && round > 0) {
    query = query.eq("round", round)
  }

  if (stageLabel) {
    query = query.eq("stage_label", stageLabel)
  }

  const { data, count, error } = await query.range(from, to)

  if (error) return createEmptyPageResult<LeagueMatch>(safePage)

  const items = ((data ?? []) as Array<LeagueMatch & { season_record?: Season | null }>).map((match) => ({
    ...match,
    season: match.season_record?.code ?? "",
  })) as LeagueMatch[]

  return createPageResult(items, count, safePage)
}

export async function getAdminStandings(
  seasonCode?: string,
  leagueCode: LeagueCode = "K1",
): Promise<AdminStandingsResult> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return {
      seasons: [],
      selectedSeason: seasonCode ?? "",
      selectedLeague: leagueCode,
      standings: [],
    }
  }

  const { data: seasonsData, error: seasonsError } = await supabase
    .from("seasons")
    .select("*")
    .order("code", { ascending: false })

  if (seasonsError) {
    return {
      seasons: [],
      selectedSeason: seasonCode ?? "",
      selectedLeague: leagueCode,
      standings: [],
    }
  }

  const seasons = (seasonsData ?? []) as Season[]
  const selectedSeasonRecord =
    seasons.find((season) => season.code === seasonCode) ??
    seasons.find((season) => season.is_current) ??
    seasons[0] ??
    null

  if (!selectedSeasonRecord) {
    return {
      seasons,
      selectedSeason: seasonCode ?? "",
      selectedLeague: leagueCode,
      standings: [],
    }
  }

  const [{ data: seasonTeamLeaguesData, error: assignmentsError }, { data: leagueMatchesData, error: matchesError }] =
    await Promise.all([
      supabase
        .from("season_team_leagues")
        .select("*, season:seasons(*), team:teams(*)")
        .eq("season_id", selectedSeasonRecord.id)
        .eq("league_code", leagueCode),
      supabase
        .from("league_matches")
        .select(
          "*, season_record:seasons(*), home_team:teams!league_matches_home_team_id_fkey(*), away_team:teams!league_matches_away_team_id_fkey(*)",
        )
        .eq("season_id", selectedSeasonRecord.id)
        .eq("league_code", leagueCode)
        .order("match_date", { ascending: false }),
    ])

  if (assignmentsError || matchesError) {
    return {
      seasons,
      selectedSeason: selectedSeasonRecord.code,
      selectedLeague: leagueCode,
      standings: [],
    }
  }

  const seasonTeamLeagues = (seasonTeamLeaguesData ?? []) as SeasonTeamLeague[]
  const teams = seasonTeamLeagues
    .map((assignment) => assignment.team)
    .filter((team): team is Team => Boolean(team))
  const leagueMatches = ((leagueMatchesData ?? []) as Array<LeagueMatch & { season_record?: Season | null }>).map(
    (match) => ({
      ...match,
      season: match.season_record?.code ?? selectedSeasonRecord.code,
    }),
  ) as LeagueMatch[]

  return {
    seasons,
    selectedSeason: selectedSeasonRecord.code,
    selectedLeague: leagueCode,
    standings: buildStandings(teams, seasonTeamLeagues, leagueMatches).filter(
      (standing) =>
        standing.season === selectedSeasonRecord.code && standing.league_code === leagueCode,
    ),
  }
}

export async function getAdminSeatZones() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase.from("seat_zones").select("*").order("created_at", { ascending: false })

  if (error) return []
  return (data ?? []) as SeatZone[]
}

export async function getAdminGuideContents() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase.from("guide_contents").select("*").order("created_at", { ascending: false })

  if (error) return []
  return (data ?? []) as GuideContent[]
}

export async function getAdminGuideContentsPage(category: "groups" | "community", page = 1) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return createEmptyPageResult<GuideContent>(page)

  const { from, to, page: safePage } = getPageRange(page)
  const { data, count, error } = await supabase
    .from("guide_contents")
    .select("*", { count: "exact" })
    .eq("category", category)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) return createEmptyPageResult<GuideContent>(safePage)
  return createPageResult((data ?? []) as GuideContent[], count, safePage)
}

export async function getAdminHistoryTimeline() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("history_timeline")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return []
  return (data ?? []) as HistoryTimeline[]
}

export async function getAdminHistoryTimelinePage(page = 1) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return createEmptyPageResult<HistoryTimeline>(page)

  const { from, to, page: safePage } = getPageRange(page)
  const { data, count, error } = await supabase
    .from("history_timeline")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) return createEmptyPageResult<HistoryTimeline>(safePage)
  return createPageResult((data ?? []) as HistoryTimeline[], count, safePage)
}

export async function getAdminStadiums() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("stadiums")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return []
  return (data ?? []) as Stadium[]
}

export async function getAdminStadiumsPage(page = 1) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return createEmptyPageResult<Stadium>(page)

  const { from, to, page: safePage } = getPageRange(page)
  const { data, count, error } = await supabase
    .from("stadiums")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) return createEmptyPageResult<Stadium>(safePage)
  return createPageResult((data ?? []) as Stadium[], count, safePage)
}

export async function getAdminTickets() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("ticket_archives")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return []
  return (data ?? []) as TicketArchive[]
}

export async function getAdminTicketsPage(page = 1) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return createEmptyPageResult<TicketArchive>(page)

  const { from, to, page: safePage } = getPageRange(page)
  const { data, count, error } = await supabase
    .from("ticket_archives")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) return createEmptyPageResult<TicketArchive>(safePage)
  return createPageResult((data ?? []) as TicketArchive[], count, safePage)
}

export async function getAdminUniforms() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("uniforms")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return []
  return (data ?? []) as Uniform[]
}

export async function getAdminUniformsPage(page = 1) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return createEmptyPageResult<Uniform>(page)

  const { from, to, page: safePage } = getPageRange(page)
  const { data, count, error } = await supabase
    .from("uniforms")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) return createEmptyPageResult<Uniform>(safePage)
  return createPageResult((data ?? []) as Uniform[], count, safePage)
}

export async function getAdminMapPlaces() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase.from("map_places").select("*").order("created_at", { ascending: false })

  if (error) return []
  return (data ?? []) as MapPlace[]
}

export async function getAdminMapPlacesPage(page = 1) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return createEmptyPageResult<MapPlace>(page)

  const { from, to, page: safePage } = getPageRange(page)
  const { data, count, error } = await supabase
    .from("map_places")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) return createEmptyPageResult<MapPlace>(safePage)
  return createPageResult((data ?? []) as MapPlace[], count, safePage)
}

export async function getAdminChants() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase.from("chants").select("*").order("created_at", { ascending: false })

  if (error) return []
  return (data ?? []) as Chant[]
}

export async function getAdminChantsPage(page = 1) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return createEmptyPageResult<Chant>(page)

  const { from, to, page: safePage } = getPageRange(page)
  const { data, count, error } = await supabase
    .from("chants")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) return createEmptyPageResult<Chant>(safePage)
  return createPageResult((data ?? []) as Chant[], count, safePage)
}

export async function getAdminNews() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase.from("news").select("*").order("created_at", { ascending: false })

  if (error) return []
  return (data ?? []) as News[]
}

export async function getAdminNewsPage(page = 1) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return createEmptyPageResult<News>(page)

  const { from, to, page: safePage } = getPageRange(page)
  const { data, count, error } = await supabase
    .from("news")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) return createEmptyPageResult<News>(safePage)
  return createPageResult((data ?? []) as News[], count, safePage)
}

export async function getAdminNoticePageContent() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("site_pages")
    .select("*")
    .eq("page_key", "notices")
    .maybeSingle()

  if (error) return null
  return (data ?? null) as NoticePageContent | null
}

export async function getAdminNoticesPage(page = 1) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return createEmptyPageResult<Notice>(page)

  const { from, to, page: safePage } = getPageRange(page)
  const { data, count, error } = await supabase
    .from("notices")
    .select("*", { count: "exact" })
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .range(from, to)

  if (error) return createEmptyPageResult<Notice>(safePage)
  return createPageResult((data ?? []) as Notice[], count, safePage)
}

export async function getAdminSupportersPage(page = 1) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return createEmptyPageResult<Supporter>(page)

  const { from, to, page: safePage } = getPageRange(page)
  const { data, count, error } = await supabase
    .from("supporters")
    .select("*", { count: "exact" })
    .order("display_order", { ascending: true })
    .range(from, to)

  if (error) return createEmptyPageResult<Supporter>(safePage)
  return createPageResult((data ?? []) as Supporter[], count, safePage)
}

export async function getAdminUsersPage(page = 1) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return createEmptyPageResult<UserAccount>(page)

  const { from, to, page: safePage } = getPageRange(page)
  const { data, count, error } = await supabase
    .from("users")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) return createEmptyPageResult<UserAccount>(safePage)
  return createPageResult((data ?? []) as UserAccount[], count, safePage)
}

export async function getAdminExperienceRules() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return [] as ExperienceRule[]

  const { data, error } = await supabase
    .from("experience_rules")
    .select("*")
    .order("action", { ascending: true })

  if (error) return [] as ExperienceRule[]
  return (data ?? []) as ExperienceRule[]
}

export async function getAdminUserById(id: string) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle()
  if (error) return null
  return (data as UserAccount | null) ?? null
}

export async function getAdminInquiriesPage(
  page = 1,
  status: "all" | "inquiry" | "processing" | "completed" = "all",
) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return createEmptyPageResult<Inquiry>(page)

  const { from, to, page: safePage } = getPageRange(page)
  const isOldestFirst =
    status === "all" || status === "inquiry" || status === "processing"

  let query = supabase
    .from("inquiries")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: isOldestFirst })

  if (status !== "all") {
    query = query.eq("status", status)
  }

  const { data, count, error } = await query.range(from, to)

  if (error) return createEmptyPageResult<Inquiry>(safePage)
  return createPageResult((data ?? []) as Inquiry[], count, safePage)
}

export async function getAdminInquiryById(id: string) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase.from("inquiries").select("*").eq("id", id).maybeSingle()

  if (error) return null
  return (data as Inquiry | null) ?? null
}

export async function getAdminPlayerStats() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("player_stats")
    .select("*, player:players(*)")
    .order("created_at", { ascending: false })

  if (error) return []
  return (data ?? []) as PlayerStat[]
}

export async function getAdminPlayerStatsPage(page = 1) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return createEmptyPageResult<PlayerStat>(page)

  const { from, to, page: safePage } = getPageRange(page)
  const { data, count, error } = await supabase
    .from("player_stats")
    .select("*, player:players(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) return createEmptyPageResult<PlayerStat>(safePage)
  return createPageResult((data ?? []) as PlayerStat[], count, safePage)
}

export interface AdminPlayerArchiveItem extends Player {
  player_seasons: PlayerSeason[]
}

export interface AdminPlayerRosterItem extends PlayerSeason {
  player: Player
  season_record?: Season | null
  team?: Team | null
  stat?: PlayerStat | null
}

export async function getAdminPlayersArchive() {
  const [players, playerSeasons] = await Promise.all([
    (async () => {
      const supabase = await createServerSupabaseClient()
      if (!supabase) return [] as Player[]

      const { data, error } = await supabase.from("players").select("*").order("created_at", { ascending: false })
      if (error) return [] as Player[]
      return (data ?? []) as Player[]
    })(),
    (async () => {
      const supabase = await createServerSupabaseClient()
      if (!supabase) return [] as PlayerSeason[]

      const { data, error } = await supabase
        .from("player_seasons")
        .select("*, player:players(*)")
        .order("created_at", { ascending: false })

      if (error) return [] as PlayerSeason[]
      return (data ?? []) as PlayerSeason[]
    })(),
  ])

  return players.map((player) => ({
    ...player,
    player_seasons: playerSeasons.filter((season) => season.player_id === player.id),
  })) as AdminPlayerArchiveItem[]
}

export async function getAdminPlayersPage(page = 1) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return createEmptyPageResult<AdminPlayerArchiveItem>(page)

  const { from, to, page: safePage } = getPageRange(page)
  const { data: players, count, error } = await supabase
    .from("players")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) return createEmptyPageResult<AdminPlayerArchiveItem>(safePage)

  const playerRows = (players ?? []) as Player[]
  if (!playerRows.length) {
    return createPageResult<AdminPlayerArchiveItem>([], count, safePage)
  }

  const playerIds = playerRows.map((player) => player.id)
  const { data: playerSeasons } = await supabase
    .from("player_seasons")
    .select("*")
    .in("player_id", playerIds)
    .order("created_at", { ascending: false })

  const items = playerRows.map((player) => ({
    ...player,
    player_seasons: ((playerSeasons ?? []) as PlayerSeason[]).filter((season) => season.player_id === player.id),
  })) as AdminPlayerArchiveItem[]

  return createPageResult(items, count, safePage)
}

export async function getAdminPlayerSeasonsPage(page = 1) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return createEmptyPageResult<PlayerSeason>(page)

  const { from, to, page: safePage } = getPageRange(page)
  const { data, count, error } = await supabase
    .from("player_seasons")
    .select("*, player:players(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) return createEmptyPageResult<PlayerSeason>(safePage)
  return createPageResult((data ?? []) as PlayerSeason[], count, safePage)
}

export async function getAdminPlayerRosterPage(page = 1, seasonId?: string) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return createEmptyPageResult<AdminPlayerRosterItem>(page)

  const { from, to, page: safePage } = getPageRange(page)
  let query = supabase
    .from("player_seasons")
    .select("*, player:players(*), season_record:seasons(*), team:teams(*)", { count: "exact" })
    .order("created_at", { ascending: false })

  if (seasonId) {
    query = query.eq("season_id", seasonId)
  }

  const { data, count, error } = await query.range(from, to)

  if (error) return createEmptyPageResult<AdminPlayerRosterItem>(safePage)

  const rosterRows = (data ?? []) as PlayerSeason[]
  if (!rosterRows.length) {
    return createPageResult<AdminPlayerRosterItem>([], count, safePage)
  }

  const playerIds = Array.from(new Set(rosterRows.map((row) => row.player_id)))
  const seasonCodes = Array.from(
    new Set(rosterRows.map((row) => row.season_record?.code ?? row.season).filter(Boolean)),
  )

  let statsByKey = new Map<string, PlayerStat>()
  if (playerIds.length && seasonCodes.length) {
    const { data: stats } = await supabase
      .from("player_stats")
      .select("*, player:players(*)")
      .in("player_id", playerIds)
      .in("season", seasonCodes)

    statsByKey = new Map(
      ((stats ?? []) as PlayerStat[]).map((stat) => [`${stat.player_id}:${stat.season}`, stat]),
    )
  }

  const items = rosterRows.map((row) => {
    const seasonCode = row.season_record?.code ?? row.season
    return {
      ...row,
      season: seasonCode,
      stat: statsByKey.get(`${row.player_id}:${seasonCode}`) ?? null,
    }
  }) as AdminPlayerRosterItem[]

  return createPageResult(items, count, safePage)
}
