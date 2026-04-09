"use client";

import Image from "next/image";
import { useState } from "react";

import { SurfaceCard } from "@/components/ui/surface-card";

interface GuideImageModalCardProps {
  title: string;
  description: string;
  imageSrc: string;
  fallbackLabel?: string;
}

export function GuideImageModalCard({
  title,
  description,
  imageSrc,
  fallbackLabel = "이미지 준비 중",
}: GuideImageModalCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <>
      <SurfaceCard className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-950">{title}</h2>
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        </div>

        <button
          type="button"
          onClick={() => !hasError && setIsOpen(true)}
          className="group block w-full overflow-hidden rounded-[24px] border border-[color:var(--line)] bg-slate-50 text-left"
        >
          <div className="relative aspect-[4/3] w-full bg-slate-100">
            {!hasError ? (
              <Image
                src={imageSrc}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition duration-200 group-hover:scale-[1.02]"
                onError={() => setHasError(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
                {fallbackLabel}
              </div>
            )}
          </div>
        </button>
      </SurfaceCard>

      {isOpen && !hasError ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(2,6,23,0.78)] px-4 py-6"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-3 z-[1] inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.92)] text-lg font-black text-slate-950 shadow-[0_12px_24px_rgba(15,23,42,0.18)]"
              aria-label="이미지 닫기"
            >
              ×
            </button>

            <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_28px_56px_rgba(15,23,42,0.35)]">
              <div className="relative aspect-[4/5] w-full bg-slate-100 sm:aspect-[16/10]">
                <Image
                  src={imageSrc}
                  alt={title}
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
