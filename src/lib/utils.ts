import type { Match } from "@/types";

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
    timeZone: "Asia/Seoul",
  }).format(new Date(dateString));
}

export function formatMonthLabel(dateString: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    timeZone: "Asia/Seoul",
  }).format(new Date(dateString));
}

export function formatTimeLabel(dateString: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(new Date(dateString));
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
    timeZone: "Asia/Seoul",
  }).format(new Date(dateString));
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
  const target = new Date(dateString);
  const today = new Date();
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
