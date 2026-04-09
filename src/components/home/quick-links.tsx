import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  History,
  Music2,
  Newspaper,
  Trophy,
} from "lucide-react";

import { SurfaceCard } from "@/components/ui/surface-card";
import { quickLinks } from "@/lib/constants/site";

const iconMap = {
  trophy: Trophy,
  "bar-chart": BarChart3,
  music: Music2,
  "book-open": BookOpen,
  history: History,
  newspaper: Newspaper,
};

export function QuickLinks() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {quickLinks.map((link, index) => {
        const Icon = iconMap[link.icon as keyof typeof iconMap];
        const accent =
          index % 3 === 0
            ? "bg-[rgba(21,93,252,0.1)] text-[color:var(--brand-blue)]"
            : index % 3 === 1
              ? "bg-[rgba(13,27,112,0.1)] text-[color:var(--brand-navy)]"
              : "bg-[rgba(230,69,69,0.1)] text-[color:var(--brand-red)]";

        return (
          <Link key={link.href} href={link.href}>
            <SurfaceCard className="flex h-full flex-col gap-3 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[rgba(21,93,252,0.18)]">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-black text-slate-950">{link.title}</h2>
                <p className="text-xs leading-5 text-slate-600">{link.description}</p>
              </div>
            </SurfaceCard>
          </Link>
        );
      })}
    </div>
  );
}
