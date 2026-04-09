import { NextResponse } from "next/server"

import { getHomeStandingsData } from "@/lib/data/public"
import type { LeagueCode } from "@/types"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const season = searchParams.get("season") ?? ""
  const league = (searchParams.get("league") ?? "K1") as LeagueCode

  if (!season || !["K1", "K2"].includes(league)) {
    return NextResponse.json({ rows: [] }, { status: 400 })
  }

  const rows = await getHomeStandingsData(season, league)
  return NextResponse.json({ rows })
}
