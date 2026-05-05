import type { Metadata } from "next";
import { Black_Han_Sans, Noto_Sans_KR } from "next/font/google";
import { unstable_cache } from "next/cache";
import Script from "next/script";
import { cookies } from "next/headers";

import { AppFrame } from "@/components/layout/app-frame";
import { siteConfig } from "@/lib/constants/site";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Team } from "@/types";

import "./globals.css";

export const preferredRegion = "icn1";

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

const getPrimaryTeamLogoUrl = unstable_cache(
  async () => {
    try {
      const supabase = await createServerSupabaseClient();

      if (!supabase) return undefined;

      const { data } = await supabase
        .from("teams")
        .select("logo_url")
        .eq("is_primary", true)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      return (data as Pick<Team, "logo_url"> | null)?.logo_url ?? undefined;
    } catch {
      return undefined;
    }
  },
  ["primary-team-logo-url"],
  { revalidate: 3600 },
);

export async function generateMetadata(): Promise<Metadata> {
  const primaryTeamLogoUrl = await getPrimaryTeamLogoUrl();

  const images = primaryTeamLogoUrl ? [primaryTeamLogoUrl] : undefined;

  return {
    title: {
      default: siteConfig.name,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    icons: {
      icon: [
        { url: "/favicon/favicon.ico" },
        { url: "/favicon/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { url: "/favicon/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get("sufhub_session")?.value);

  return (
    <html
      lang="ko"
      className={`${bodyFont.variable} ${displayFont.variable} antialiased`}
    >
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-29R0ZKJ56K"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-29R0ZKJ56K');
          `}
        </Script>
      </head>
      <body>
        <AppFrame isAuthenticated={hasSession}>{children}</AppFrame>
      </body>
    </html>
  );
}
