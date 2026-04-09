import type { Metadata } from "next";
import { Black_Han_Sans, Noto_Sans_KR } from "next/font/google";

import { AppFrame } from "@/components/layout/app-frame";
import { siteConfig } from "@/lib/constants/site";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Team } from "@/types";

import "./globals.css";

const bodyFont = Noto_Sans_KR({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const displayFont = Black_Han_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export async function generateMetadata(): Promise<Metadata> {
  let primaryTeamLogoUrl: string | undefined;

  try {
    const supabase = await createServerSupabaseClient();

    if (supabase) {
      const { data } = await supabase
        .from("teams")
        .select("logo_url")
        .eq("is_primary", true)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      primaryTeamLogoUrl = (data as Pick<Team, "logo_url"> | null)?.logo_url ?? undefined;
    }
  } catch {
    primaryTeamLogoUrl = undefined;
  }

  const images = primaryTeamLogoUrl ? [primaryTeamLogoUrl] : undefined;

  return {
    title: {
      default: siteConfig.name,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    openGraph: {
      title: siteConfig.name,
      description: siteConfig.description,
      images,
    },
    twitter: {
      card: "summary",
      title: siteConfig.name,
      description: siteConfig.description,
      images,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${bodyFont.variable} ${displayFont.variable} antialiased`}
    >
      <body>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
