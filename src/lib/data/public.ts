import { createPublicSupabaseClient } from "@/lib/supabase"
import type {
  Chant,
  CompetitionCode,
  GuideCategory,
  GuideContent,
  HistoryTimeline,
  LeagueCode,
  LeagueMatch,
  MapPlace,
  Match,
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
  Team,
  TicketArchive,
  Uniform,
  UniformType,
} from "@/types"

import { buildClubMatches, buildStandings, getPrimaryTeam } from "./league"

export type HomePlayerLeaderMetric =
  | "goals"
  | "assists"
  | "attack-point"
  | "rating"
  | "minutes"
  | "yellow-cards"
  | "red-cards"

export interface HomeLeagueStandingRow {
  id: string
  rank: number
  teamName: string
  teamShortName?: string | null
  teamLogoUrl?: string | null
  points: number
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  isHighlighted: boolean
}

export interface HomePlayerLeaderRow {
  id: string
  name: string
  position: string
  displayValue: string
}

export interface HomePageOverview {
  currentSeason: string
  defaultLeague: LeagueCode
  nextMatch: Match | null
  latestMatch: Match | null
  initialLeagueRows: HomeLeagueStandingRow[]
  initialPlayerRows: HomePlayerLeaderRow[]
  primaryTeamId: string | null
}

export type ScheduleView = "all" | "upcoming" | "past"
export type ScheduleCompetitionFilter = "all" | CompetitionCode

export interface SchedulePageData {
  seasons: string[]
  selectedSeason: string
  selectedView: ScheduleView
  selectedCompetition: ScheduleCompetitionFilter
  competitionOptions: ScheduleCompetitionFilter[]
  matches: Match[]
}

const HOME_PLAYER_METRICS: HomePlayerLeaderMetric[] = [
  "goals",
  "assists",
  "attack-point",
  "rating",
  "minutes",
  "yellow-cards",
  "red-cards",
]

function formatHomePlayerMetricValue(metric: HomePlayerLeaderMetric, value: number) {
  switch (metric) {
    case "rating":
      return value.toFixed(2)
    case "minutes":
      return `${value.toLocaleString("ko-KR")}분`
    default:
      return value.toLocaleString("ko-KR")
  }
}

function getHomePlayerMetricValue(stat: PlayerStat, metric: HomePlayerLeaderMetric) {
  switch (metric) {
    case "goals":
      return stat.goals
    case "assists":
      return stat.assists
    case "attack-point":
      return stat.goals + stat.assists
    case "rating":
      return stat.rating_average ?? null
    case "minutes":
      return stat.minutes_played
    case "yellow-cards":
      return stat.yellow_cards
    case "red-cards":
      return stat.red_cards
    default:
      return null
  }
}

function toHomeStandingRows(standings: Standing[], primaryTeamId: string | null) {
  return standings.map((standing) => ({
    id: standing.id,
    rank: standing.rank,
    teamName: standing.team_name,
    teamShortName: standing.team_short_name,
    teamLogoUrl: standing.team_logo_url,
    points: standing.points,
    played: standing.played,
    won: standing.won,
    drawn: standing.drawn,
    lost: standing.lost,
    goalsFor: standing.goals_for,
    goalsAgainst: standing.goals_against,
    goalDiff: standing.goal_diff,
    isHighlighted: standing.team_id === primaryTeamId,
  }))
}

function toHomePlayerRows(stats: PlayerStat[], metric: HomePlayerLeaderMetric) {
  return [...stats]
    .map((stat) => ({
      id: stat.id,
      name: stat.player?.name ?? "선수 미등록",
      position: stat.player?.position ?? "-",
      value: getHomePlayerMetricValue(stat, metric),
    }))
    .filter((row) => row.value !== null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0) || a.name.localeCompare(b.name, "ko"))
    .map((row) => ({
      id: row.id,
      name: row.name,
      position: row.position,
      displayValue: formatHomePlayerMetricValue(metric, row.value ?? 0),
    }))
}

async function getLeagueData() {
  const supabase = createPublicSupabaseClient()
  if (!supabase) {
    return {
      teams: [] as Team[],
      seasons: [] as Season[],
      seasonTeamLeagues: [] as SeasonTeamLeague[],
      leagueMatches: [] as LeagueMatch[],
    }
  }

  try {
    const [
      { data: teams, error: teamsError },
      { data: seasons, error: seasonsError },
      { data: seasonTeamLeagues, error: assignmentsError },
      { data: leagueMatches, error: matchesError },
    ] = await Promise.all([
      supabase.from("teams").select("*").eq("is_active", true).order("name", { ascending: true }),
      supabase
        .from("seasons")
        .select("*")
        .eq("is_active", true)
        .order("is_current", { ascending: false })
        .order("code", { ascending: false }),
      supabase
        .from("season_team_leagues")
        .select("*, season:seasons(*), team:teams(*)")
        .order("updated_at", { ascending: false }),
      supabase
        .from("league_matches")
        .select(
          "*, season_record:seasons(*), home_team:teams!league_matches_home_team_id_fkey(*), away_team:teams!league_matches_away_team_id_fkey(*)",
        )
        .order("match_date", { ascending: true }),
    ])

    if (teamsError || seasonsError || assignmentsError || matchesError) {
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
      seasonTeamLeagues: ((seasonTeamLeagues ?? []) as SeasonTeamLeague[]).filter(
        (item) => item.season?.is_active && item.team?.is_active,
      ),
      leagueMatches: ((leagueMatches ?? []) as Array<LeagueMatch & { season_record?: Season | null }>).map(
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

function getMonthLabel(matchDate: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    timeZone: "Asia/Seoul",
  }).format(new Date(matchDate))
}

function sortCompetitionFilters(
  items: ScheduleCompetitionFilter[],
  defaultLeague?: LeagueCode,
) {
  const order: ScheduleCompetitionFilter[] = [
    "all",
    defaultLeague ?? "K1",
    defaultLeague === "K2" ? "K1" : "K2",
    "KOREA_CUP",
  ]

  return Array.from(new Set(items)).sort((a, b) => order.indexOf(a) - order.indexOf(b))
}

export async function getMatches() {
  const { teams, leagueMatches } = await getLeagueData()
  const primaryTeam = getPrimaryTeam(teams)
  return buildClubMatches(leagueMatches, teams, primaryTeam?.id)
}

export async function getSchedulePageData(params?: {
  season?: string
  competition?: ScheduleCompetitionFilter
  view?: ScheduleView
}) {
  const supabase = createPublicSupabaseClient()
  if (!supabase) {
    return {
      seasons: [] as string[],
      selectedSeason: "",
      selectedView: "all" as ScheduleView,
      selectedCompetition: "all" as ScheduleCompetitionFilter,
      competitionOptions: ["all"] as ScheduleCompetitionFilter[],
      matches: [] as Match[],
    }
  }

  const [{ data: seasonsData }, { data: primaryTeamData }] = await Promise.all([
    supabase
      .from("seasons")
      .select("*")
      .eq("is_active", true)
      .order("is_current", { ascending: false })
      .order("code", { ascending: false }),
    supabase.from("teams").select("*").eq("is_primary", true).eq("is_active", true).limit(1).maybeSingle(),
  ])

  const seasons = (seasonsData ?? []) as Season[]
  const primaryTeam = (primaryTeamData as Team | null) ?? null
  const selectedSeason =
    params?.season && seasons.some((season) => season.code === params.season)
      ? params.season
      : (seasons[0]?.code ?? "")
  const selectedView: ScheduleView =
    params?.view === "upcoming" || params?.view === "past" ? params.view : "all"
  const seasonRecord = seasons.find((season) => season.code === selectedSeason) ?? null

  if (!seasonRecord || !primaryTeam) {
    return {
      seasons: seasons.map((season) => season.code),
      selectedSeason,
      selectedView,
      selectedCompetition: "all" as ScheduleCompetitionFilter,
      competitionOptions: ["all"] as ScheduleCompetitionFilter[],
      matches: [] as Match[],
    }
  }

  const [{ data: assignmentsData }, { data: matchesData }] = await Promise.all([
    supabase
      .from("season_team_leagues")
      .select("league_code")
      .eq("season_id", seasonRecord.id)
      .eq("team_id", primaryTeam.id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("league_matches")
      .select(
        "*, season_record:seasons(*), home_team:teams!league_matches_home_team_id_fkey(*), away_team:teams!league_matches_away_team_id_fkey(*)",
      )
      .eq("season_id", seasonRecord.id)
      .or(`home_team_id.eq.${primaryTeam.id},away_team_id.eq.${primaryTeam.id}`)
      .order("match_date", { ascending: true }),
  ])

  const defaultLeague = ((assignmentsData as { league_code?: LeagueCode | null } | null)?.league_code ??
    "K1") as LeagueCode
  const leagueMatches = ((matchesData ?? []) as Array<LeagueMatch & { season_record?: Season | null }>).map(
    (match) => ({
      ...match,
      season: match.season_record?.code ?? "",
    }),
  ) as LeagueMatch[]

  const competitionOptions = sortCompetitionFilters(
    ["all", ...leagueMatches.map((match) => match.competition_code)],
    defaultLeague,
  )
  const selectedCompetition =
    params?.competition && competitionOptions.includes(params.competition)
      ? params.competition
      : ("all" as ScheduleCompetitionFilter)

  let filteredMatches = buildClubMatches(
    leagueMatches,
    [primaryTeam],
    primaryTeam.id,
    selectedCompetition,
  )

  if (selectedView === "upcoming") {
    filteredMatches = filteredMatches.filter((match) => match.status !== "finished")
  } else if (selectedView === "past") {
    filteredMatches = filteredMatches
      .filter((match) => match.status === "finished")
      .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())
  }

  return {
    seasons: seasons.map((season) => season.code),
    selectedSeason,
    selectedView,
    selectedCompetition,
    competitionOptions,
    matches: filteredMatches,
  } satisfies SchedulePageData
}

export async function getStandings() {
  const { teams, seasonTeamLeagues, leagueMatches } = await getLeagueData()
  return buildStandings(teams, seasonTeamLeagues, leagueMatches)
}

export async function getHomeStandingsData(seasonCode: string, leagueCode: LeagueCode) {
  const supabase = createPublicSupabaseClient()
  if (!supabase || !seasonCode) return [] as HomeLeagueStandingRow[]

  const [{ data: seasonsData }, { data: primaryTeamData }] = await Promise.all([
    supabase.from("seasons").select("*").eq("code", seasonCode).eq("is_active", true).limit(1).maybeSingle(),
    supabase.from("teams").select("*").eq("is_primary", true).eq("is_active", true).limit(1).maybeSingle(),
  ])

  const season = (seasonsData as Season | null) ?? null
  const primaryTeam = (primaryTeamData as Team | null) ?? null
  if (!season) return [] as HomeLeagueStandingRow[]

  const [{ data: assignmentsData }, { data: matchesData }] = await Promise.all([
    supabase
      .from("season_team_leagues")
      .select("*, season:seasons(*), team:teams(*)")
      .eq("season_id", season.id)
      .eq("league_code", leagueCode)
      .order("created_at", { ascending: false }),
    supabase
      .from("league_matches")
      .select(
        "*, season_record:seasons(*), home_team:teams!league_matches_home_team_id_fkey(*), away_team:teams!league_matches_away_team_id_fkey(*)",
      )
      .eq("season_id", season.id)
      .eq("league_code", leagueCode)
      .order("match_date", { ascending: true }),
  ])

  const seasonTeamLeagues = ((assignmentsData ?? []) as SeasonTeamLeague[]).filter(
    (item) => item.team?.is_active,
  )
  const leagueTeams = seasonTeamLeagues
    .map((item) => item.team)
    .filter((team): team is Team => Boolean(team))
  const leagueMatches = ((matchesData ?? []) as Array<LeagueMatch & { season_record?: Season | null }>).map(
    (match) => ({
      ...match,
      season: match.season_record?.code ?? "",
    }),
  ) as LeagueMatch[]

  const standings = buildStandings(leagueTeams, seasonTeamLeagues, leagueMatches).filter(
    (standing) => standing.season === seasonCode && standing.league_code === leagueCode,
  )

  return toHomeStandingRows(standings, primaryTeam?.id ?? null)
}

export async function getHomePlayerLeadersData(
  seasonCode: string,
  metric: HomePlayerLeaderMetric,
) {
  const supabase = createPublicSupabaseClient()
  if (!supabase || !seasonCode || !HOME_PLAYER_METRICS.includes(metric)) {
    return [] as HomePlayerLeaderRow[]
  }

  const [{ data: seasonsData }, { data: primaryTeamData }] = await Promise.all([
    supabase.from("seasons").select("*").eq("code", seasonCode).eq("is_active", true).limit(1).maybeSingle(),
    supabase.from("teams").select("*").eq("is_primary", true).eq("is_active", true).limit(1).maybeSingle(),
  ])

  const season = (seasonsData as Season | null) ?? null
  const primaryTeam = (primaryTeamData as Team | null) ?? null
  if (!season || !primaryTeam) return [] as HomePlayerLeaderRow[]

  const { data: rosterData } = await supabase
    .from("player_seasons")
    .select("player_id")
    .eq("season_id", season.id)
    .eq("team_id", primaryTeam.id)
    .eq("is_active", true)

  const playerIds = Array.from(new Set((rosterData ?? []).map((row) => row.player_id))).filter(Boolean)
  if (!playerIds.length) return [] as HomePlayerLeaderRow[]

  const { data: statsData } = await supabase
    .from("player_stats")
    .select("*, player:players(*)")
    .eq("season", seasonCode)
    .in("player_id", playerIds)

  return toHomePlayerRows((statsData ?? []) as PlayerStat[], metric)
}

export async function getHomePageOverview(): Promise<HomePageOverview> {
  const supabase = createPublicSupabaseClient()
  if (!supabase) {
    return {
      currentSeason: "",
      defaultLeague: "K1",
      nextMatch: null,
      latestMatch: null,
      initialLeagueRows: [],
      initialPlayerRows: [],
      primaryTeamId: null,
    }
  }

  const [{ data: seasonsData }, { data: primaryTeamData }] = await Promise.all([
    supabase
      .from("seasons")
      .select("*")
      .eq("is_active", true)
      .order("is_current", { ascending: false })
      .order("code", { ascending: false }),
    supabase.from("teams").select("*").eq("is_primary", true).eq("is_active", true).limit(1).maybeSingle(),
  ])

  const seasons = (seasonsData ?? []) as Season[]
  const currentSeason = seasons[0] ?? null
  const primaryTeam = (primaryTeamData as Team | null) ?? null
  if (!currentSeason || !primaryTeam) {
    return {
      currentSeason: currentSeason?.code ?? "",
      defaultLeague: "K1",
      nextMatch: null,
      latestMatch: null,
      initialLeagueRows: [],
      initialPlayerRows: [],
      primaryTeamId: primaryTeam?.id ?? null,
    }
  }

  const [{ data: assignmentsData }, { data: clubMatchesData }] = await Promise.all([
    supabase
      .from("season_team_leagues")
      .select("*, season:seasons(*), team:teams(*)")
      .eq("season_id", currentSeason.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("league_matches")
      .select(
        "*, season_record:seasons(*), home_team:teams!league_matches_home_team_id_fkey(*), away_team:teams!league_matches_away_team_id_fkey(*)",
      )
      .eq("season_id", currentSeason.id)
      .or(`home_team_id.eq.${primaryTeam.id},away_team_id.eq.${primaryTeam.id}`)
      .order("match_date", { ascending: true }),
  ])

  const seasonTeamLeagues = ((assignmentsData ?? []) as SeasonTeamLeague[]).filter(
    (item) => item.season?.is_active && item.team?.is_active,
  )
  const defaultLeague =
    seasonTeamLeagues.find((item) => item.team_id === primaryTeam.id)?.league_code ?? "K1"

  const clubMatches = buildClubMatches(
    ((clubMatchesData ?? []) as Array<LeagueMatch & { season_record?: Season | null }>).map((match) => ({
      ...match,
      season: match.season_record?.code ?? "",
    })) as LeagueMatch[],
    [primaryTeam],
    primaryTeam.id,
  )

  const nextMatch = clubMatches.find((match) => match.status !== "finished") ?? null
  const latestMatch = [...clubMatches].reverse().find((match) => match.status === "finished") ?? null
  const [initialLeagueRows, initialPlayerRows] = await Promise.all([
    getHomeStandingsData(currentSeason.code, defaultLeague),
    getHomePlayerLeadersData(currentSeason.code, "goals"),
  ])

  return {
    currentSeason: currentSeason.code,
    defaultLeague,
    nextMatch,
    latestMatch,
    initialLeagueRows,
    initialPlayerRows,
    primaryTeamId: primaryTeam.id,
  }
}

export async function getSeasonArchiveData(params?: {
  season?: string
  league?: LeagueCode
  team?: string
  month?: string
  competition?: ScheduleCompetitionFilter
}) {
  const supabase = createPublicSupabaseClient()
  if (!supabase) {
    return {
      seasons: [] as Season[],
      primaryTeam: null as Team | null,
      selectedSeason: "",
      leagues: [] as LeagueCode[],
      selectedLeague: "K1" as LeagueCode,
      teams: [] as Team[],
      selectedTeamKey: "primary",
      selectedTeamId: "__all__",
      selectedCompetition: "all" as ScheduleCompetitionFilter,
      competitionOptions: ["all"] as ScheduleCompetitionFilter[],
      selectedMonth: "all",
      monthOptions: [] as string[],
      standings: [] as Standing[],
      scheduleMode: "league" as const,
      scheduleMatches: [] as LeagueMatch[],
    }
  }

  const [{ data: seasonsData }, { data: primaryTeamData }] = await Promise.all([
    supabase
      .from("seasons")
      .select("*")
      .eq("is_active", true)
      .order("is_current", { ascending: false })
      .order("code", { ascending: false }),
    supabase.from("teams").select("*").eq("is_primary", true).eq("is_active", true).limit(1).maybeSingle(),
  ])

  const seasons = (seasonsData ?? []) as Season[]
  const primaryTeam = (primaryTeamData as Team | null) ?? null
  const selectedSeason =
    params?.season && seasons.some((season) => season.code === params.season)
      ? params.season
      : (seasons[0]?.code ?? "")
  const seasonRecord = seasons.find((season) => season.code === selectedSeason) ?? null

  if (!seasonRecord) {
    return {
      seasons,
      primaryTeam,
      selectedSeason: "",
      leagues: [] as LeagueCode[],
      selectedLeague: "K1" as LeagueCode,
      teams: [] as Team[],
      selectedTeamKey: "primary",
      selectedTeamId: "__all__",
      selectedCompetition: "all" as ScheduleCompetitionFilter,
      competitionOptions: ["all"] as ScheduleCompetitionFilter[],
      selectedMonth: "all",
      monthOptions: [] as string[],
      standings: [] as Standing[],
      scheduleMode: "league" as const,
      scheduleMatches: [] as LeagueMatch[],
    }
  }

  const { data: assignmentsData } = await supabase
    .from("season_team_leagues")
    .select("*, season:seasons(*), team:teams(*)")
    .eq("season_id", seasonRecord.id)
    .order("created_at", { ascending: false })

  const seasonTeamLeagues = ((assignmentsData ?? []) as SeasonTeamLeague[]).filter(
    (item) => item.team?.is_active,
  )
  const leagues = Array.from(new Set(seasonTeamLeagues.map((item) => item.league_code))).sort(
    (a, b) => a.localeCompare(b),
  ) as LeagueCode[]

  const defaultLeague =
    (primaryTeam
      ? seasonTeamLeagues.find((item) => item.team_id === primaryTeam.id)?.league_code
      : null) ??
    leagues[0] ??
    "K1"
  const selectedLeague =
    params?.league && leagues.includes(params.league) ? params.league : defaultLeague

  const leagueTeams = seasonTeamLeagues
    .filter((item) => item.league_code === selectedLeague)
    .map((item) => item.team)
    .filter((team): team is Team => Boolean(team))
    .sort((a, b) => (a.short_name ?? a.name).localeCompare(b.short_name ?? b.name, "ko"))

  const defaultTeamId =
    primaryTeam && leagueTeams.some((team) => team.id === primaryTeam.id) ? primaryTeam.id : "__all__"
  const rawSelectedTeamKey = params?.team ?? "primary"
  const selectedTeamId =
    rawSelectedTeamKey === "primary"
      ? defaultTeamId
      : rawSelectedTeamKey === "__all__" || leagueTeams.some((team) => team.id === rawSelectedTeamKey)
        ? rawSelectedTeamKey
        : defaultTeamId
  const selectedTeamKey =
    rawSelectedTeamKey === "primary" || rawSelectedTeamKey === "__all__" || selectedTeamId === rawSelectedTeamKey
      ? rawSelectedTeamKey
      : "primary"

  const matchSelect =
    "*, season_record:seasons(*), home_team:teams!league_matches_home_team_id_fkey(*), away_team:teams!league_matches_away_team_id_fkey(*)"

  const standingsMatchQuery = supabase
    .from("league_matches")
    .select(matchSelect)
    .eq("season_id", seasonRecord.id)
    .eq("league_code", selectedLeague)
    .order("match_date", { ascending: true })

  const scheduleMatchQuery = supabase
    .from("league_matches")
    .select(matchSelect)
    .eq("season_id", seasonRecord.id)
    .order("match_date", { ascending: true })

  const [{ data: standingsMatchesData }, { data: allScheduleMatchesData }] = await Promise.all([
    standingsMatchQuery,
    scheduleMatchQuery,
  ])

  const standingsLeagueMatches = (
    (standingsMatchesData ?? []) as Array<LeagueMatch & { season_record?: Season | null }>
  ).map((match) => ({
    ...match,
    season: match.season_record?.code ?? "",
  })) as LeagueMatch[]

  const allScheduleMatches = (
    (allScheduleMatchesData ?? []) as Array<LeagueMatch & { season_record?: Season | null }>
  ).map((match) => ({
    ...match,
    season: match.season_record?.code ?? "",
  })) as LeagueMatch[]

  const competitionOptions = sortCompetitionFilters(
    ["all", ...allScheduleMatches.map((match) => match.competition_code)],
    selectedLeague,
  )
  const selectedCompetition =
    params?.competition && competitionOptions.includes(params.competition)
      ? params.competition
      : ("all" as ScheduleCompetitionFilter)

  const competitionFilteredScheduleMatches = allScheduleMatches.filter((match) => {
    if (selectedTeamId === "__all__") {
      if (selectedCompetition === "all") {
        return match.league_code === selectedLeague
      }

      return match.competition_code === selectedCompetition
    }

    const matchesSelectedTeam =
      match.home_team_id === selectedTeamId || match.away_team_id === selectedTeamId

    if (!matchesSelectedTeam) {
      return false
    }

    return selectedCompetition === "all" || match.competition_code === selectedCompetition
  })

  const monthOptions = Array.from(
    new Set(competitionFilteredScheduleMatches.map((match) => getMonthLabel(match.match_date))),
  )
  const selectedMonth =
    params?.month === "all" || !params?.month
      ? "all"
      : monthOptions.includes(params.month)
        ? params.month
        : "all"

  const monthFilteredLeagueMatches =
    selectedMonth === "all"
      ? competitionFilteredScheduleMatches
      : competitionFilteredScheduleMatches.filter((match) => getMonthLabel(match.match_date) === selectedMonth)

  const standings = buildStandings(leagueTeams, seasonTeamLeagues, standingsLeagueMatches).filter(
    (standing) => standing.season === selectedSeason && standing.league_code === selectedLeague,
  )

  if (selectedTeamId === "__all__") {
    return {
      seasons,
      primaryTeam,
      selectedSeason,
      leagues,
      selectedLeague,
      teams: leagueTeams,
      selectedTeamKey,
      selectedTeamId,
      selectedCompetition,
      competitionOptions,
      selectedMonth,
      monthOptions,
      standings,
      scheduleMode: "league" as const,
      scheduleMatches: monthFilteredLeagueMatches,
    }
  }

  return {
    seasons,
    primaryTeam,
    selectedSeason,
    leagues,
    selectedLeague,
    teams: leagueTeams,
    selectedTeamKey,
    selectedTeamId,
    selectedCompetition,
    competitionOptions,
    selectedMonth,
    monthOptions,
    standings,
    scheduleMode: "club" as const,
    scheduleMatches: buildClubMatches(
      monthFilteredLeagueMatches,
      leagueTeams,
      selectedTeamId,
      selectedCompetition,
    ) as Match[],
  }
}

export async function getNews(limit?: number) {
  const supabase = createPublicSupabaseClient()
  if (!supabase) return []

  let query = supabase
    .from("news")
    .select("*")
    .eq("is_active", true)
    .order("published_at", { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) return []

  const news = (data ?? []) as News[]
  return limit ? news.slice(0, limit) : news
}

export async function getNoticePageContent() {
  const supabase = createPublicSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("site_pages")
    .select("*")
    .eq("page_key", "notices")
    .eq("is_active", true)
    .maybeSingle()

  if (error) return null
  return (data ?? null) as NoticePageContent | null
}

export async function getNotices() {
  const supabase = createPublicSupabaseClient()
  if (!supabase) return [] as Notice[]

  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .eq("is_active", true)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })

  if (error) return [] as Notice[]
  return (data ?? []) as Notice[]
}

export async function getPlayerStats() {
  const supabase = createPublicSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("player_stats")
    .select("*, player:players(*)")
    .order("season", { ascending: false })
    .order("goals", { ascending: false })

  if (error) return []
  return (data ?? []) as PlayerStat[]
}

export async function getMapPlaces() {
  const supabase = createPublicSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("map_places")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) return []
  return (data ?? []) as MapPlace[]
}

export async function getChants() {
  const supabase = createPublicSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("chants")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) return []
  return (data ?? []) as Chant[]
}

export async function getSeatZones() {
  const supabase = createPublicSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase.from("seat_zones").select("*").order("sort_order", { ascending: true })

  if (error) return []
  return (data ?? []) as SeatZone[]
}

export async function getGuideContents(category?: GuideCategory) {
  const supabase = createPublicSupabaseClient()
  if (!supabase) return []

  let query = supabase
    .from("guide_contents")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (category) {
    query = query.eq("category", category)
  }

  const { data, error } = await query
  if (error) return []

  return (data ?? []) as GuideContent[]
}

export async function getHistoryTimeline() {
  const supabase = createPublicSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("history_timeline")
    .select("*")
    .order("year", { ascending: true })
    .order("sort_order", { ascending: true })

  if (error) return []
  return (data ?? []) as HistoryTimeline[]
}

export async function getStadiums() {
  const supabase = createPublicSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase.from("stadiums").select("*").order("is_current", { ascending: false })

  if (error) return []
  return (data ?? []) as Stadium[]
}

export async function getTickets() {
  const supabase = createPublicSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("ticket_archives")
    .select("*")
    .eq("is_active", true)
    .order("archive_year", { ascending: false })
    .order("sort_order", { ascending: true })

  if (error) return []
  return (data ?? []) as TicketArchive[]
}

export async function getUniforms(params?: { season?: string; type?: UniformType | "all" }) {
  const supabase = createPublicSupabaseClient()
  if (!supabase) {
    return {
      seasons: [] as string[],
      selectedSeason: "",
      selectedType: "all" as UniformType | "all",
      uniforms: [] as Uniform[],
    }
  }

  const { data: seasonRows, error: seasonsError } = await supabase
    .from("uniforms")
    .select("season")
    .eq("is_active", true)
    .order("season", { ascending: false })

  if (seasonsError) {
    return {
      seasons: [] as string[],
      selectedSeason: "",
      selectedType: "all" as UniformType | "all",
      uniforms: [] as Uniform[],
    }
  }

  const seasons = Array.from(new Set((seasonRows ?? []).map((row) => String(row.season))))
  const selectedSeason =
    params?.season && seasons.includes(params.season) ? params.season : (seasons[0] ?? "")
  const selectedType = params?.type ?? "all"

  let query = supabase
    .from("uniforms")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (selectedSeason) {
    query = query.eq("season", selectedSeason)
  }

  if (selectedType !== "all") {
    query = query.eq("type", selectedType)
  }

  const { data, error } = await query
  if (error) {
    return {
      seasons,
      selectedSeason,
      selectedType,
      uniforms: [] as Uniform[],
    }
  }

  return {
    seasons,
    selectedSeason,
    selectedType,
    uniforms: (data ?? []) as Uniform[],
  }
}

export interface PlayerArchiveItem extends Player {
  player_seasons: PlayerSeason[]
}

export interface PlayerArchiveDetail extends PlayerArchiveItem {
  stats: PlayerStat[]
}

export async function getPlayersArchive() {
  const [players, playerSeasons] = await Promise.all([
    (async () => {
      const supabase = createPublicSupabaseClient()
      if (!supabase) return [] as Player[]

      const { data, error } = await supabase.from("players").select("*")
      if (error) return [] as Player[]
      return (data ?? []) as Player[]
    })(),
      (async () => {
        const supabase = createPublicSupabaseClient()
        if (!supabase) return [] as PlayerSeason[]

        const { data, error } = await supabase
          .from("player_seasons")
          .select("*, player:players(*), season_record:seasons(*), team:teams(*)")
          .order("season", { ascending: false })
          .order("created_at", { ascending: false })

        if (error) return [] as PlayerSeason[]
        return (data ?? []) as PlayerSeason[]
      })(),
    ])

  return players
    .map((player) => ({
      ...player,
      player_seasons: playerSeasons.filter((season) => season.player_id === player.id),
    }))
    .filter((player) => player.player_seasons.length > 0)
}

export async function getCaptainsArchive() {
  const players = await getPlayersArchive()

  return players
    .map((player) => ({
      ...player,
      player_seasons: player.player_seasons.filter((season) => season.is_captain),
    }))
    .filter((player) => player.player_seasons.length > 0)
    .sort((a, b) => (b.player_seasons[0]?.season ?? "").localeCompare(a.player_seasons[0]?.season ?? ""))
}

export async function getPlayerArchiveDetail(id: string) {
  const [players, stats] = await Promise.all([getPlayersArchive(), getPlayerStats()])
  const player = players.find((item) => item.id === id)

  if (!player) {
    return null
  }

  return {
    ...player,
    stats: stats.filter((stat) => stat.player_id === id),
  } as PlayerArchiveDetail
}

export async function getHomePageData() {
  const [matches, standings, news] = await Promise.all([getMatches(), getStandings(), getNews(3)])

  const nextMatch =
    matches.find((match) => match.status !== "finished" && new Date(match.match_date).getTime() >= Date.now()) ?? null
  const latestMatch = [...matches].reverse().find((match) => match.status === "finished") ?? null
  const currentSeason = standings[0]?.season ?? ""
  const seasonStandings = standings.filter((standing) => standing.season === currentSeason)
  const homeTeamName = seasonStandings.find((standing) => standing.team_name.includes("수원"))?.team_name ?? "수원FC"
  const suwonIndex = seasonStandings.findIndex((standing) => standing.team_name === homeTeamName)
  const standingsFocus =
    suwonIndex === -1
      ? seasonStandings.slice(0, 5)
      : seasonStandings.slice(Math.max(0, suwonIndex - 2), Math.min(seasonStandings.length, suwonIndex + 3))

  return {
    news,
    nextMatch,
    latestMatch,
    standingsFocus,
  }
}
