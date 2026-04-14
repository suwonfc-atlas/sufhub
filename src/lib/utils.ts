import type { Match } from "@/types";

const KST_TIME_ZONE = "Asia/Seoul";
const TIMEZONE_SUFFIX_PATTERN = /[zZ]|[+-]\d{2}:\d{2}$/;

function normalizeDateTimeString(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const normalized = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return `${normalized}T00:00:00`;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
    return `${normalized}:00`;
  }
  return normalized;
}

export function parseKstDate(value: string) {
  const normalized = normalizeDateTimeString(value);
  if (!normalized) return new Date(NaN);
  if (TIMEZONE_SUFFIX_PATTERN.test(normalized)) {
    return new Date(normalized);
  }
  return new Date(`${normalized}+09:00`);
}

export function formatKstDateTimeString(date: Date) {
  const formatted = new Intl.DateTimeFormat("sv-SE", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
  return formatted.replace(" ", "T");
}

export function formatDateTimeInputValue(value: string | null | undefined) {
  if (!value) return "";
  const normalized = normalizeDateTimeString(value);
  return normalized ? normalized.slice(0, 16) : "";
}

export function getKstNowDate() {
  return parseKstDate(formatKstDateTimeString(new Date()));
}

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function isPathActive(pathname: string, href: string, matches: string[] = []) {
  if (pathname === href) {
    return true;
  }

  return matches.some((match) => pathname.startsWith(match));
}

export function formatDateLabel(dateString: string, withWeekday = true) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: withWeekday ? "short" : undefined,
    timeZone: KST_TIME_ZONE,
  }).format(parseKstDate(dateString));
}

export function formatMonthLabel(dateString: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    timeZone: KST_TIME_ZONE,
  }).format(parseKstDate(dateString));
}

export function formatTimeLabel(dateString: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: KST_TIME_ZONE,
  }).format(parseKstDate(dateString));
}

export function formatRoundLabel(round: number | null | undefined) {
  if (round === 99) {
    return "PO";
  }

  if (typeof round === "number") {
    return `${round}R`;
  }

  return null;
}

export function formatPublishedAt(dateString: string | null) {
  if (!dateString) {
    return "업데이트 예정";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: KST_TIME_ZONE,
  }).format(parseKstDate(dateString));
}

export function formatDuration(seconds: number | null | undefined) {
  if (!seconds || Number.isNaN(seconds)) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

export function getDDayLabel(dateString: string) {
  const target = parseKstDate(dateString);
  const today = getKstNowDate();
  const diff = Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diff === 0) {
    return "D-DAY";
  }

  if (diff > 0) {
    return `D-${diff}`;
  }

  return `D+${Math.abs(diff)}`;
}

export function getMatchScoreLabel(match: Match) {
  if (match.status !== "finished") {
    return "경기 전";
  }

  return `${match.score_home ?? 0} : ${match.score_away ?? 0}`;
}

export function getVenueLabel(match: Match) {
  return match.venue === "home" ? "홈" : "원정";
}

export function groupMatchesByMonth(matches: Match[]) {
  return matches.reduce<Record<string, Match[]>>((acc, match) => {
    const label = formatMonthLabel(match.match_date);
    acc[label] = [...(acc[label] ?? []), match];
    return acc;
  }, {});
}
