"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import { SurfaceCard } from "@/components/ui/surface-card";
import type { Uniform, UniformType } from "@/types";

const typeLabels: Record<UniformType | "all", string> = {
  all: "전체",
  home: "홈",
  away: "원정",
  "gk-home": "GK1",
  "gk-away": "GK2",
  special: "스페셜 1",
  "special-2": "스페셜 2",
};

const typeStyles: Record<UniformType, string> = {
  home: "from-sky-700 to-blue-900 text-white",
  away: "from-slate-50 to-slate-200 text-white",
  "gk-home": "from-lime-300 to-emerald-500 text-white",
  "gk-away": "from-emerald-700 to-teal-900 text-white",
  special: "from-amber-300 to-orange-500 text-white",
  "special-2": "from-fuchsia-400 to-pink-600 text-white",
};

interface UniformFilterBoardProps {
  seasons: string[];
  selectedSeason: string;
  selectedType: UniformType | "all";
  uniforms: Uniform[];
}

export function UniformFilterBoard({
  seasons,
  selectedSeason,
  selectedType,
  uniforms,
}: UniformFilterBoardProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeUniformId, setActiveUniformId] = useState<string | null>(null);

  const buildHref = (nextValues: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(nextValues).forEach(([key, value]) => {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const activeUniform = uniforms.find((uniform) => uniform.id === activeUniformId) ?? null;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {seasons.map((season) => (
            <Link
              key={season}
              href={buildHref({ season, type: selectedType === "all" ? null : selectedType })}
              scroll={false}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedSeason === season
                  ? "bg-slate-950 !text-white"
                  : "bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-700"
              }`}
            >
              {season}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(typeLabels) as Array<keyof typeof typeLabels>).map((type) => (
            <Link
              key={type}
              href={buildHref({ season: selectedSeason || null, type: type === "all" ? null : type })}
              scroll={false}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedType === type
                  ? "bg-sky-100 !text-white [background:var(--brand-blue)]"
                  : "bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {typeLabels[type]}
            </Link>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {uniforms.map((uniform) => (
            <SurfaceCard key={uniform.id} className="space-y-4">
              <button
                type="button"
                onClick={() => uniform.image_url && setActiveUniformId(uniform.id)}
                className={`relative flex aspect-[4/5] w-full items-end overflow-hidden rounded-[24px] bg-gradient-to-b p-5 text-left ${typeStyles[uniform.type]}`}
              >
                {uniform.image_url ? (
                  <>
                    <Image
                      src={uniform.image_url}
                      alt={`${uniform.season} ${typeLabels[uniform.type]} 유니폼`}
                      fill
                      sizes="(max-width: 768px) 90vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.42))]" />
                  </>
                ) : null}

                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
                    {typeLabels[uniform.type]}
                  </p>
                  <h2 className="mt-2 text-3xl font-black">{uniform.season}</h2>
                </div>
              </button>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-950">
                  {typeLabels[uniform.type]} 유니폼
                </h3>
                <p className="text-sm text-slate-500">{uniform.manufacturer}</p>
                <p className="text-sm leading-6 text-slate-600">{uniform.description}</p>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </div>

      {activeUniform?.image_url ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(2,6,23,0.78)] px-4 py-6"
          onClick={() => setActiveUniformId(null)}
        >
          <div className="relative w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActiveUniformId(null)}
              className="absolute right-3 top-3 z-[1] inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.92)] text-lg font-black text-slate-950 shadow-[0_12px_24px_rgba(15,23,42,0.18)]"
              aria-label="유니폼 이미지 닫기"
            >
              ×
            </button>

            <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_28px_56px_rgba(15,23,42,0.35)]">
              <div className="relative aspect-[4/5] w-full bg-slate-100 sm:aspect-[16/10]">
                <Image
                  src={activeUniform.image_url}
                  alt={`${activeUniform.season} ${typeLabels[activeUniform.type]} 유니폼`}
                  fill
                  sizes="90vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
