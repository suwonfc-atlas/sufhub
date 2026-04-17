import { NextResponse } from "next/server";

import {
  getResolvedHomePlayerLeadersData,
  type HomePlayerLeaderMetric,
} from "@/lib/data/home-player-leaders";

export const dynamic = "force-dynamic";

const VALID_METRICS: HomePlayerLeaderMetric[] = [
  "goals",
  "assists",
  "attack-point",
  "rating",
  "fan-rating",
  "fan-mom",
  "minutes",
  "yellow-cards",
  "red-cards",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get("season") ?? "";
  const metric = (searchParams.get("metric") ?? "goals") as HomePlayerLeaderMetric;

  if (!season || !VALID_METRICS.includes(metric)) {
    return NextResponse.json({ rows: [] }, { status: 400 });
  }

  const rows = await getResolvedHomePlayerLeadersData(season, metric);
  return NextResponse.json({ rows });
}
