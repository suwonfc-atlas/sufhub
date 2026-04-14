export interface NavItem {
  href: string;
  label: string;
  match?: string[];
  external?: boolean;
}

export interface PreviewSection {
  href: string;
  title: string;
  description: string;
  external?: boolean;
}

export const NEWS_EXTERNAL_URL =
  "https://cafe.naver.com/f-e/cafes/25746834/menus/16";

export const siteConfig = {
  name: "SuFHub",
  accentName: "SUFHUB",
  description:
    "수원FC를 위한 경기 일정, 기록, 응원가, 직관 정보, 지도 정보를 모바일 중심으로 정리한 서비스입니다.",
};

export const primaryNavigation: NavItem[] = [
  { href: "/", label: "홈" },
  { href: "/matches/schedule", label: "경기", match: ["/matches"] },
  { href: "/community", label: "커뮤니티" },
  { href: "/chants", label: "응원가" },
];

export const moreNavigation: NavItem[] = [
  { href: "/map", label: "캐슬클럽" },
  { href: "/info", label: "수원FC 인포" },
  { href: "/mypage", label: "마이페이지" },
];

export const quickLinks = [
  {
    href: "/matches/schedule",
    title: "경기 일정",
    description: "이번 시즌 일정과 최근 경기 결과를 빠르게 확인합니다.",
    icon: "trophy",
  },
  {
    href: "/matches/standings",
    title: "리그 순위",
    description: "수원FC가 속한 리그 순위와 기록을 바로 확인합니다.",
    icon: "bar-chart",
  },
  {
    href: "/chants",
    title: "응원가",
    description: "응원가를 고르고 플레이리스트로 바로 재생합니다.",
    icon: "music",
  },
  {
    href: "/guide",
    title: "직관 가이드",
    description: "좌석, 원정버스, 굿즈, 멤버십 정보를 한 번에 모아봅니다.",
    icon: "book-open",
  },
  {
    href: "/history",
    title: "역대 시즌",
    description: "시즌별 순위와 수원FC 일정, 리그 기록을 확인합니다.",
    icon: "history",
  },
  {
    href: "/notices",
    title: "공지사항",
    description: "중요한 공지와 서비스 안내를 먼저 확인합니다.",
    icon: "newspaper",
  },
];

export const guidePreviewSections: PreviewSection[] = [
  {
    href: "/guide/seats",
    title: "좌석 가이드",
    description: "좌석 구성과 가시야 차이를 비교합니다.",
  },
  {
    href: "/guide/away-bus",
    title: "원정버스",
    description: "원정버스 신청 링크와 신청 순서를 확인합니다.",
  },
  {
    href: "/guide/merch",
    title: "굿즈",
    description: "온라인 스토어와 경기장 MD 안내를 확인합니다.",
  },
  {
    href: "https://suwonfc.com/?p=19",
    title: "멤버십",
    description: "수원FC 멤버십 안내 페이지로 이동합니다.",
    external: true,
  },
  {
    href: "https://suwonfc.com/?p=90",
    title: "캐슬클럽",
    description: "수원FC 캐슬클럽 안내 페이지로 이동합니다.",
    external: true,
  },
  {
    href: "/guide/groups",
    title: "소모임",
    description: "응원단과 모임 정보를 확인합니다.",
  },
  {
    href: "/guide/community",
    title: "채널",
    description: "공식 채널과 커뮤니티 링크를 안내합니다.",
  },
];

export const historyPreviewSections: PreviewSection[] = [
  {
    href: "/history/seasons",
    title: "역대 시즌",
    description: "시즌별 순위와 수원FC 일정, 리그 기록을 확인합니다.",
  },
  {
    href: "/history/timeline",
    title: "구단 연혁",
    description: "중요했던 시즌과 순간들을 연도별로 정리했습니다.",
  },
  {
    href: "/history/stadium",
    title: "경기장",
    description: "연도별 경기장 기록을 갤러리로 모아봅니다.",
  },
  {
    href: "/history/tickets",
    title: "티켓",
    description: "연도별 티켓 아카이브를 갤러리로 확인합니다.",
  },
  {
    href: "/history/uniform",
    title: "유니폼",
    description: "시즌별 유니폼을 비교합니다.",
  },
  {
    href: "/history/players",
    title: "선수단",
    description: "시즌별 선수단 정보를 확인합니다.",
  },
];

export const matchTabs = [
  { href: "/matches/schedule", label: "일정" },
  { href: "/matches/standings", label: "순위" },
  { href: "/matches/stats", label: "스탯" },
];

export const mapCategoryLabels: Record<string, string> = {
  stadium: "경기장",
  food: "맛집",
  parking: "주차",
  stay: "숙소",
  etc: "기타",
};
