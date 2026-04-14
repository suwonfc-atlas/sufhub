import { NextResponse } from "next/server";

import { createPublicSupabaseClient } from "@/lib/supabase";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const supabase = createServiceSupabaseClient() ?? createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ available: false }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const value = (searchParams.get("value") ?? "").trim();
  if (!value) {
    return NextResponse.json({ available: false }, { status: 400 });
  }

  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("username", value)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ available: !data });
}
