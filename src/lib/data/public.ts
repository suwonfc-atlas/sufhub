import { createPublicSupabaseClient } from "@/lib/supabase"
import type {
  Chant,
  CompetitionCode,
  GuideCategory,
  GuideContent,
  HistoryTimeline,
  LeagueCode,
  LeagueMatch,
  MatchLineup,
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
  Supporter,
  Team,
  TicketArchive,
  Uniform,
  UniformType,
} from "@/types"

import { buildClubMatches, buildStandings, getPrimaryTeam } from "./league"
import { formatRoundLabel, parseKstDate } from "@/lib/utils"

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
  playerId: string
  name: string
  nameEn: string | null
  birthDate: string | null
  nationality: string | null
  profileImageUrl: string | null
  bio: string | null
  squadNumber: number | null
  isCaptain: boolean
  position: string
  appearances: number
  goals: number
  assists: number
  attackPoints: number
  ratingAverage: number | null
  minutesPlayed: number
  yellowCards: number
  redCards: number
  fanRatingAverage?: number | null
  fanRatingMatches?: number
  fanMomCount?: number
  fanTopComment?: string | null
  fanTopCommentLikes?: number
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
  matchLineup: HomeMatchLineup | null
}

export interface HomeLineupPlayer {
  id: string
  name: string
  position: string
  squadNumber: number | null
  isCaptain: boolean
}

export interface HomeMatchLineup {
  matchId: string
  season: string
  competitionCode: CompetitionCode
  round: number | null
  stageLabel: string | null
  matchDate: string
  homeTeamName: string
  awayTeamName: string
  teamName: string
  starters: HomeLineupPlayer[]
  bench: HomeLineupPlayer[]
}

const HOME_LINEUP_POSITION_ORDER: Record<string, number> = {
  GK: 0,
  DF: 1,
  MF: 2,
  FW: 3,
}

function sortHomeLineupPlayers(players: HomeLineupPlayer[]) {
  return [...players].sort((a, b) => {
    const positionGap =
      (HOME_LINEUP_POSITION_ORDER[a.position] ?? 99) -
      (HOME_LINEUP_POSITION_ORDER[b.position] ?? 99)

    if (positionGap !== 0) return positionGap

    const squadA = a.squadNumber ?? 999
    const squadB = b.squadNumber ?? 999
    if (squadA !== squadB) return squadA - squadB

    return a.name.localeCompare(b.name, "ko")
  })
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

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

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
      playerId: stat.player_id,
      name: stat.player?.name ?? "선수 미등록",
      nameEn: stat.player?.name_en ?? null,
      birthDate: stat.player?.birth_date ?? null,
      nationality: stat.player?.nationality ?? null,
      profileImageUrl: stat.player?.profile_image_url ?? null,
      bio: stat.player?.bio ?? null,
      squadNumber: null as number | null,
      isCaptain: false,
      position: stat.player?.position ?? "-",
      appearances: stat.appearances,
      goals: stat.goals,
      assists: stat.assists,
      attackPoints: stat.goals + stat.assists,
      ratingAverage: stat.rating_average ?? null,
      minutesPlayed: stat.minutes_played,
      yellowCards: stat.yellow_cards,
      redCards: stat.red_cards,
      fanRatingAverage: stat.fan_rating_average ?? null,
      fanRatingMatches: stat.fan_rating_matches ?? 0,
      fanMomCount: stat.fan_mom_count ?? 0,
      fanTopComment: stat.fan_top_comment ?? null,
      fanTopCommentLikes: stat.fan_top_comment_likes ?? 0,
      value: getHomePlayerMetricValue(stat, metric),
    }))
    .filter((row) => row.value !== null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0) || a.name.localeCompare(b.name, "ko"))
    .map((row) => ({
      id: row.id,
      playerId: row.playerId,
      name: row.name,
      nameEn: row.nameEn,
      birthDate: row.birthDate,
      nationality: row.nationality,
      profileImageUrl: row.profileImageUrl,
      bio: row.bio,
      squadNumber: row.squadNumber,
      isCaptain: row.isCaptain,
      position: row.position,
      appearances: row.appearances,
      goals: row.goals,
      assists: row.assists,
      attackPoints: row.attackPoints,
      ratingAverage: row.ratingAverage,
      minutesPlayed: row.minutesPlayed,
      yellowCards: row.yellowCards,
      redCards: row.redCards,
      fanRatingAverage: row.fanRatingAverage,
      fanRatingMatches: row.fanRatingMatches,
      fanMomCount: row.fanMomCount,
      fanTopComment: row.fanTopComment,
      fanTopCommentLikes: row.fanTopCommentLikes,
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
  }).format(parseKstDate(matchDate))
}

function getArchiveRoundLabel(round: number | null, stageLabel: string | null) {
  return stageLabel?.trim() || formatRoundLabel(round) || "-"
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
      .sort((a, b) => parseKstDate(b.match_date).getTime() - parseKstDate(a.match_date).getTime())
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
    .select("player_id, squad_number, is_captain")
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

  const rosterMap = new Map(
    ((rosterData ?? []) as Array<{ player_id: string; squad_number: number | null; is_captain: boolean | null }>).map(
      (row) => [
        row.player_id,
        {
          squadNumber: row.squad_number ?? null,
          isCaptain: Boolean(row.is_captain),
        },
      ],
    ),
  )

  return toHomePlayerRows((statsData ?? []) as PlayerStat[], metric).map((row) => ({
    ...row,
    squadNumber: rosterMap.get(row.playerId)?.squadNumber ?? null,
    isCaptain: rosterMap.get(row.playerId)?.isCaptain ?? false,
  }))
}

async function getHomeMatchLineup(
  supabase: NonNullable<ReturnType<typeof createPublicSupabaseClient>>,
  match: Match | null,
  seasonId: string,
  primaryTeam: Team,
): Promise<HomeMatchLineup | null> {
  if (!match) return null

  const { data: lineupData, error: lineupError } = await supabase
    .from("match_lineups")
    .select("*")
    .eq("match_id", match.id)
    .eq("team_id", primaryTeam.id)
    .maybeSingle()

  if (lineupError || !lineupData) {
    return null
  }

  const lineup = lineupData as MatchLineup
  const selectedPlayerIds = [
    ...lineup.starters_player_ids,
    ...lineup.bench_player_ids,
  ]

  if (!selectedPlayerIds.length) {
    return null
  }

  const { data: rosterData, error: rosterError } = await supabase
    .from("player_seasons")
    .select("player_id, squad_number, is_captain, player:players(*)")
    .eq("season_id", seasonId)
    .eq("team_id", primaryTeam.id)
    .eq("is_active", true)
    .in("player_id", selectedPlayerIds)

  if (rosterError) {
    return null
  }

  const normalizedRosterRows = (
    (rosterData ?? []) as Array<{
      player_id: string
      squad_number: number | null
      is_captain: boolean | null
      player?: Player | Player[] | null
    }>
  ).map((row) => {
    const playerRecord = Array.isArray(row.player) ? (row.player[0] ?? null) : (row.player ?? null)

    return {
      player_id: row.player_id as string,
      squad_number: (row.squad_number ?? null) as number | null,
      is_captain: Boolean(row.is_captain),
      player: playerRecord as Player | null,
    }
  })

  const rosterMap = new Map(
    normalizedRosterRows.map((row) => [
      row.player_id,
      {
        id: row.player_id,
        name: row.player?.name ?? "선수",
        position: row.player?.position ?? "-",
        squadNumber: row.squad_number ?? null,
        isCaptain: row.is_captain,
      } satisfies HomeLineupPlayer,
    ]),
  )

  const starters = sortHomeLineupPlayers(
    lineup.starters_player_ids
      .map((id) => rosterMap.get(id))
      .filter((item): item is HomeLineupPlayer => Boolean(item)),
  )
  const bench = sortHomeLineupPlayers(
    lineup.bench_player_ids
      .map((id) => rosterMap.get(id))
      .filter((item): item is HomeLineupPlayer => Boolean(item)),
  )

  if (!starters.length) {
    return null
  }

  return {
    matchId: match.id,
    season: match.season,
    competitionCode: match.competition_code,
    round: match.round,
    stageLabel: match.stage_label,
    matchDate: match.match_date,
    homeTeamName: match.venue === "home" ? primaryTeam.name : match.opponent,
    awayTeamName: match.venue === "home" ? match.opponent : primaryTeam.name,
    teamName: primaryTeam.name,
    starters,
    bench,
  }
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
      matchLineup: null,
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
      matchLineup: null,
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
  const lineupTargetMatch =
    clubMatches.find((match) => match.status === "live") ??
    clubMatches.find((match) => match.status !== "finished") ??
    null
  const [initialLeagueRows, initialPlayerRows, matchLineup] = await Promise.all([
    getHomeStandingsData(currentSeason.code, defaultLeague),
    getHomePlayerLeadersData(currentSeason.code, "goals"),
    getHomeMatchLineup(supabase, lineupTargetMatch, currentSeason.id, primaryTeam),
  ])

  return {
    currentSeason: currentSeason.code,
    defaultLeague,
    nextMatch,
    latestMatch,
    initialLeagueRows,
    initialPlayerRows,
    primaryTeamId: primaryTeam.id,
    matchLineup,
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
    const isSelectedLeaguePlayoff =
      match.league_code === selectedLeague && match.competition_code === selectedLeague && match.round === 99

    if (!matchesSelectedTeam && !isSelectedLeaguePlayoff) {
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

export async function getNoticeById(id: string) {
  const supabase = createPublicSupabaseClient()
  if (!supabase) return null as Notice | null

  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle()

  if (error) return null as Notice | null
  return (data ?? null) as Notice | null
}

export async function getSupporters() {
  const supabase = createPublicSupabaseClient()
  if (!supabase) return [] as Supporter[]

  const { data, error } = await supabase
    .from("supporters")
    .select("*")
    .order("display_order", { ascending: true })

  if (error) return [] as Supporter[]
  return (data ?? []) as Supporter[]
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
  fanSummary: {
    season: string
    fanRatingAverage: number | null
    fanRatingMatches: number
    fanMomCount: number
    fanTopComment: string | null
    fanTopCommentLikes: number
  } | null
  recentFanResults: Array<{
    id: string
    matchId: string
    season: string
    competition: string
    roundLabel: string
    matchDate: string
    opponentName: string
    fanRatingAverage: number | null
    ratingVoteCount: number
    momVoteCount: number
    isMomWinner: boolean
    topComment: string | null
    topCommentLikeCount: number
  }>
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

  const playerStats = stats
    .filter((stat) => stat.player_id === id)
    .sort((left, right) => right.season.localeCompare(left.season))

  const fanSummarySource =
    playerStats.find(
      (stat) =>
        (stat.fan_rating_matches ?? 0) > 0 ||
        (stat.fan_mom_count ?? 0) > 0 ||
        Boolean(stat.fan_top_comment),
    ) ?? null

  const supabase = createPublicSupabaseClient()
  let recentFanResults: PlayerArchiveDetail["recentFanResults"] = []
  const playerTeamIds = new Set(player.player_seasons.map((season) => season.team_id).filter(Boolean))

  if (supabase) {
    const { data: fanResultRows } = await supabase
      .from("player_fan_rating_results")
      .select(
        "id, match_id, fan_rating_average, rating_vote_count, mom_vote_count, is_mom_winner, top_comment, top_comment_like_count, match:league_matches(match_date, competition, round, stage_label, season_record:seasons(code), home_team_id, away_team_id, home_team:teams!league_matches_home_team_id_fkey(name, short_name), away_team:teams!league_matches_away_team_id_fkey(name, short_name))",
      )
      .eq("player_id", id)
      .order("settled_at", { ascending: false })
      .limit(5)

    recentFanResults = ((fanResultRows ?? []) as Array<{
      id?: string
      match_id?: string
      fan_rating_average?: number | null
      rating_vote_count?: number
      mom_vote_count?: number
      is_mom_winner?: boolean
      top_comment?: string | null
      top_comment_like_count?: number
      match?:
        | {
            match_date?: string
            competition?: string
            round?: number | null
            stage_label?: string | null
            home_team_id?: string
            away_team_id?: string
            season_record?: { code?: string | null } | Array<{ code?: string | null }> | null
            home_team?: { name?: string | null; short_name?: string | null } | Array<{ name?: string | null; short_name?: string | null }> | null
            away_team?: { name?: string | null; short_name?: string | null } | Array<{ name?: string | null; short_name?: string | null }> | null
          }
        | Array<{
            match_date?: string
            competition?: string
            round?: number | null
            stage_label?: string | null
            home_team_id?: string
            away_team_id?: string
            season_record?: { code?: string | null } | Array<{ code?: string | null }> | null
            home_team?: { name?: string | null; short_name?: string | null } | Array<{ name?: string | null; short_name?: string | null }> | null
            away_team?: { name?: string | null; short_name?: string | null } | Array<{ name?: string | null; short_name?: string | null }> | null
          }>
        | null
    }>)
      .map((row) => {
        const match = relationOne(row.match)
        const seasonRecord = relationOne(match?.season_record)
        const homeTeam = relationOne(match?.home_team)
        const awayTeam = relationOne(match?.away_team)
        const isHome = playerTeamIds.has(match?.home_team_id ?? "")
        const opponentName = isHome
          ? awayTeam?.short_name ?? awayTeam?.name ?? "상대팀"
          : homeTeam?.short_name ?? homeTeam?.name ?? "상대팀"

        return {
          id: row.id ?? "",
          matchId: row.match_id ?? "",
          season: seasonRecord?.code ?? "",
          competition: match?.competition ?? "경기",
          roundLabel: getArchiveRoundLabel(match?.round ?? null, match?.stage_label ?? null),
          matchDate: match?.match_date ?? "",
          opponentName,
          fanRatingAverage: row.fan_rating_average ?? null,
          ratingVoteCount: row.rating_vote_count ?? 0,
          momVoteCount: row.mom_vote_count ?? 0,
          isMomWinner: Boolean(row.is_mom_winner),
          topComment: row.top_comment ?? null,
          topCommentLikeCount: row.top_comment_like_count ?? 0,
        }
      })
      .filter((row) => row.id && row.matchId)
  }

  return {
    ...player,
    stats: playerStats,
    fanSummary: fanSummarySource
      ? {
          season: fanSummarySource.season,
          fanRatingAverage: fanSummarySource.fan_rating_average ?? null,
          fanRatingMatches: fanSummarySource.fan_rating_matches ?? 0,
          fanMomCount: fanSummarySource.fan_mom_count ?? 0,
          fanTopComment: fanSummarySource.fan_top_comment ?? null,
          fanTopCommentLikes: fanSummarySource.fan_top_comment_likes ?? 0,
        }
      : null,
    recentFanResults,
  } as PlayerArchiveDetail
}

export async function getHomePageData() {
  const [matches, standings, news] = await Promise.all([getMatches(), getStandings(), getNews(3)])

  const nextMatch =
    matches.find((match) => match.status !== "finished" && parseKstDate(match.match_date).getTime() >= Date.now()) ??
    null
  const latestMatch = [...matches].reverse().find((match) => match.status === "finished") ?? null
  const currentSeason = standings[0]?.season ?? ""
  const seasonStandings = standings.filter((standing) => standing.season === currentSeason)
  const homeTeamName = seasonStandings.find((standing) => standing.team_name.includes("??륁뜚"))?.team_name ?? "??륁뜚FC"
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
