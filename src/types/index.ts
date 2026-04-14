export type MapPlaceCategory =
  | "restaurant"
  | "cafe"
  | "other"
  | "stadium"
  | "food"
  | "parking"
  | "stay"
  | "etc"

export interface MapPlace {
  id: string
  name: string
  category: MapPlaceCategory
  naver_place_id?: string | null
  naver_place_url?: string | null
  address: string | null
  phone?: string | null
  description: string | null
  benefit_info: string | null
  menu_items: string[]
  latitude: number
  longitude: number
  image_url: string | null
  external_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HistoryTimeline {
  id: string
  year: number
  title: string
  description: string | null
  image_url: string | null
  sort_order: number
  created_at: string
  updated_at?: string
  is_active?: boolean
}

export interface Stadium {
  id: string
  name: string
  archive_year?: number | null
  address: string | null
  capacity: number | null
  description: string | null
  images: string[]
  latitude: number | null
  longitude: number | null
  sort_order?: number
  is_active?: boolean
  is_current: boolean
  created_at: string
  updated_at?: string
}

export interface TicketArchive {
  id: string
  title: string
  archive_year?: number | null
  description: string | null
  images: string[]
  sort_order?: number
  is_active?: boolean
  created_at: string
  updated_at?: string
}

export type UniformType = "home" | "away" | "gk-home" | "gk-away" | "special" | "special-2"

export interface Uniform {
  id: string
  season: string
  type: UniformType
  manufacturer: string | null
  image_url: string | null
  description: string | null
  sort_order: number
  created_at: string
  updated_at?: string
  is_active?: boolean
}

export type PlayerPosition = "GK" | "DF" | "MF" | "FW"

export interface Player {
  id: string
  name: string
  name_en: string | null
  position: PlayerPosition
  birth_date: string | null
  nationality: string
  profile_image_url: string | null
  bio: string | null
  created_at: string
  updated_at?: string
}

export interface PlayerSeason {
  id: string
  player_id: string
  season_id: string | null
  team_id: string | null
  season: string
  squad_number: number | null
  is_captain: boolean
  is_active: boolean
  is_injured: boolean
  injury_detail: string | null
  is_loan: boolean
  loan_team: string | null
  is_national_team: boolean
  joined_from: string | null
  left_to: string | null
  notes: string | null
  player?: Player
  season_record?: Season | null
  team?: Team | null
}

export interface PlayerWithSeason extends Player {
  player_seasons: PlayerSeason[]
}

export interface SeatZone {
  id: string
  zone_name: string
  description: string | null
  atmosphere: string | null
  price_range: string | null
  tips: string | null
  image_url: string | null
  sort_order: number
  created_at: string
  updated_at?: string
  is_active?: boolean
}

export type GuideCategory = "seats" | "away-bus" | "merch" | "groups" | "community"

export interface GuideContent {
  id: string
  category: GuideCategory
  title: string
  description: string | null
  content: string | null
  image_url: string | null
  external_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ChantCategory = "general" | "player" | "situation"

export interface Chant {
  id: string
  title: string
  lyrics: string | null
  audio_url: string | null
  duration: number | null
  category: ChantCategory
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export type MatchVenue = "home" | "away"
export type MatchStatus = "scheduled" | "live" | "finished"
export type LeagueCode = "K1" | "K2"
export type CompetitionCode = LeagueCode | "KOREA_CUP"
export type PredictionChoice = "win" | "draw" | "lose"

export interface Season {
  id: string
  code: string
  is_current: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  short_name: string | null
  logo_url: string | null
  home_stadium_name: string | null
  is_primary: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SeasonTeamLeague {
  id: string
  season_id: string
  team_id: string
  league_code: LeagueCode
  stats_payload_json?: string | null
  created_at: string
  updated_at: string
  season?: Season | null
  team?: Team | null
}

export interface LeagueMatch {
  id: string
  season_id: string
  season: string
  competition_code: CompetitionCode
  league_code: LeagueCode | null
  round: number | null
  stage_label: string | null
  stage_order: number | null
  match_date: string
  home_team_id: string
  away_team_id: string
  stadium_name: string | null
  status: MatchStatus
  home_score: number | null
  away_score: number | null
  highlight_url: string | null
  competition: string
  created_at: string
  updated_at: string
  season_record?: Season | null
  home_team?: Team | null
  away_team?: Team | null
}

export interface MatchLineup {
  id: string
  match_id: string
  team_id: string
  starters_player_ids: string[]
  bench_player_ids: string[]
  created_at: string
  updated_at: string
}

export interface Match {
  id: string
  season: string
  competition_code: CompetitionCode
  league_code: LeagueCode | null
  round: number | null
  stage_label: string | null
  stage_order: number | null
  match_date: string
  opponent: string
  opponent_logo_url: string | null
  highlight_url?: string | null
  venue: MatchVenue
  stadium_name: string | null
  score_home: number | null
  score_away: number | null
  status: MatchStatus
  competition: string
  created_at: string
  updated_at: string
}

export interface MatchPrediction {
  id: string
  user_id: string
  match_id: string
  choice: PredictionChoice
  created_at: string
  updated_at: string
}

export interface ExperienceRule {
  action: string
  points: number
  is_active: boolean
  updated_at: string
}

export interface Standing {
  id: string
  team_id: string
  season: string
  season_id: string
  league_code?: LeagueCode | null
  team_name: string
  team_short_name: string | null
  team_logo_url: string | null
  rank: number
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_diff: number
  points: number
  updated_at: string
}

export interface PlayerStat {
  id: string
  player_id: string
  season: string
  appearances: number
  goals: number
  assists: number
  rating_average?: number | null
  yellow_cards: number
  red_cards: number
  minutes_played: number
  clean_sheets: number
  updated_at: string
  player?: Player
}

export interface News {
  id: string
  title: string
  source: string | null
  url: string
  thumbnail_url: string | null
  published_at: string | null
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface NoticePageContent {
  id: string
  page_key: string
  title: string
  description: string | null
  content: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Notice {
  id: string
  title: string
  content: string | null
  is_active: boolean
  is_pinned: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Supporter {
  id: string
  name: string
  amount: number
  donated_at: string
  display_order: number
  created_at: string
  updated_at: string
}

export type InquiryType =
  | "inquiry"
  | "report"
  | "suggestion"
  | "brag"
  | "consultation"
  | "other"

export type InquiryStatus = "inquiry" | "processing" | "completed"

export interface Inquiry {
  id: string
  user_id?: string | null
  title: string
  type: InquiryType
  reply_contact?: string | null
  sender_name: string
  content: string
  status: InquiryStatus
  answer_content?: string | null
  answered_at?: string | null
  answered_by?: string | null
  created_at: string
  updated_at: string
}

export interface UserAccount {
  id: string
  username: string
  email: string
  nickname: string
  birth_date: string
  level: number
  experience: number
  is_active: boolean
  status?: "active" | "suspended" | "expelled"
  suspended_until?: string | null
  suspension_count?: number
  created_at: string
  updated_at: string
}

export interface UserConsent {
  id: string
  user_id: string
  terms_version: string
  privacy_version: string
  created_at: string
}

export interface UserSession {
  id: string
  user_id: string
  session_token: string
  expires_at: string
  created_at: string
}

export interface UserExperienceLog {
  id: string
  user_id: string
  delta: number
  total_experience: number
  reason: string
  action?: string | null
  reference_id?: string | null
  created_at: string
}
