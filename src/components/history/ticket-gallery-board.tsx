"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { TicketArchive } from "@/types";
import { parseKstDate } from "@/lib/utils";

interface TicketGalleryBoardProps {
  tickets: TicketArchive[];
}

interface GalleryImage {
  src: string;
  title: string;
  memo: string | null;
  year: string;
  key: string;
}

function getArchiveYear(ticket: TicketArchive) {
  if (ticket.archive_year) {
    return String(ticket.archive_year);
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    timeZone: "Asia/Seoul",
  }).format(parseKstDate(ticket.created_at));
}

export function TicketGalleryBoard({ tickets }: TicketGalleryBoardProps) {
  const galleryImages = useMemo<GalleryImage[]>(
    () =>
      tickets.flatMap((ticket) =>
        ticket.images
          .filter(Boolean)
          .map((src, index) => ({
            src,
            title: ticket.title,
            memo: ticket.description ?? null,
            year: getArchiveYear(ticket),
            key: `${ticket.id}-${index}-${src}`,
          })),
      ),
    [tickets],
  );

  const groupedImages = useMemo(
    () =>
      galleryImages.reduce<Record<string, GalleryImage[]>>((acc, image) => {
        acc[image.year] = [...(acc[image.year] ?? []), image];
        return acc;
      }, {}),
    [galleryImages],
  );

  const [activeImageKey, setActiveImageKey] = useState<string | null>(null);
  const activeImage = galleryImages.find((image) => image.key === activeImageKey) ?? null;

  return (
    <>
      <div className="page-grid gap-5">
        <div className="grid gap-6">
          {Object.entries(groupedImages).map(([year, images]) => (
            <section key={year} className="grid gap-3">
              <p className="text-sm font-black text-slate-950">{year}</p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((image) => (
                  <button
                    key={image.key}
                    type="button"
                    onClick={() => setActiveImageKey(image.key)}
                    className="group relative aspect-square overflow-hidden rounded-[22px] border border-[color:var(--line)] bg-slate-100 text-left shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                  >
                    <Image
                      src={image.src}
                      alt={image.title}
                      fill
                      sizes="(max-width: 640px) 45vw, 28vw"
                      className="object-cover transition duration-200 group-hover:scale-[1.03]"
                    />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {activeImage ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(2,6,23,0.78)] px-4 py-6"
          onClick={() => setActiveImageKey(null)}
        >
          <div className="relative w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActiveImageKey(null)}
              className="absolute right-3 top-3 z-[1] inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.92)] text-lg font-black text-slate-950 shadow-[0_12px_24px_rgba(15,23,42,0.18)]"
              aria-label="이미지 닫기"
            >
              ×
            </button>

            <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_28px_56px_rgba(15,23,42,0.35)]">
              <div className="relative aspect-[4/3] w-full bg-slate-100 sm:aspect-[16/10]">
                <Image
                  src={activeImage.src}
                  alt={activeImage.title}
                  fill
                  sizes="90vw"
                  className="object-contain"
                  priority
                />
              </div>
              <div className="px-5 py-4">
                <p className="text-base font-black text-slate-950">{activeImage.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {activeImage.memo ?? "메모가 없습니다."}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
