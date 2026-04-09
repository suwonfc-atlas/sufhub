import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/auth/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractMetaContent(html: string, key: string, attr: "property" | "name" = "property") {
  const escapedKey = escapeRegExp(key);
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${escapedKey}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${escapedKey}["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return "";
}

function extractTitleTag(html: string) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim() ?? "";
}

function deriveSourceFromUrl(url: string) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname.split(".")[0] ?? hostname;
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase 설정이 필요합니다." }, { status: 500 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !isAdminUser(user)) {
    return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { url } = (await request.json()) as { url: string };
  const normalizedUrl = url?.trim();

  if (!normalizedUrl) {
    return NextResponse.json({ message: "기사 URL을 먼저 입력해 주세요." }, { status: 400 });
  }

  const response = await fetch(normalizedUrl, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36",
    },
    cache: "no-store",
    redirect: "follow",
  });

  if (!response.ok) {
    return NextResponse.json({ message: "기사 정보를 불러오지 못했습니다." }, { status: 400 });
  }

  const html = await response.text();
  const title =
    extractMetaContent(html, "og:title") ||
    extractMetaContent(html, "twitter:title", "name") ||
    extractTitleTag(html);
  const source =
    extractMetaContent(html, "og:site_name") ||
    extractMetaContent(html, "twitter:site", "name").replace(/^@/, "") ||
    deriveSourceFromUrl(normalizedUrl);
  const thumbnailUrl =
    extractMetaContent(html, "og:image") ||
    extractMetaContent(html, "twitter:image", "name");

  return NextResponse.json({
    message: "기사 미리보기를 불러왔습니다.",
    title,
    source,
    thumbnail_url: thumbnailUrl,
  });
}
