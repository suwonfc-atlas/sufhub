"use client";

import Script from "next/script";
import { ChevronUp, LocateFixed, MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { MapPlace } from "@/types";

declare global {
  interface Window {
    __closeCastleClubInfo?: () => void;
    naver?: {
      maps: {
        Size: new (width: number, height: number) => unknown;
        Point: new (x: number, y: number) => unknown;
        LatLng: new (lat: number, lng: number) => {
          lat: () => number;
          lng: () => number;
        };
        LatLngBounds: new (
          sw: { lat: () => number; lng: () => number },
          ne: { lat: () => number; lng: () => number },
        ) => {
          hasLatLng: (latlng: { lat: () => number; lng: () => number }) => boolean;
        };
        Map: new (
          container: HTMLElement,
          options: {
            center: unknown;
            zoom: number;
            minZoom?: number;
            maxBounds?: unknown;
            scaleControl?: boolean;
            logoControl?: boolean;
            mapDataControl?: boolean;
          },
        ) => {
          setCenter: (latlng: unknown) => void;
          getCenter: () => { lat: () => number; lng: () => number };
        };
        Marker: new (options: {
          map: unknown;
          position: unknown;
          icon?: {
            url?: string;
            size?: unknown;
            scaledSize?: unknown;
            anchor?: unknown;
          };
        }) => {
          setMap: (map: unknown) => void;
          getPosition: () => unknown;
        };
        InfoWindow: new (options: {
          content: string;
          backgroundColor?: string;
          borderWidth?: number;
          disableAnchor?: boolean;
          pixelOffset?: unknown;
        }) => {
          open: (map: unknown, anchor: unknown) => void;
          close: () => void;
          setContent: (content: string) => void;
        };
        Event: {
          addListener: (
            target: unknown,
            eventName: string,
            handler: () => void,
          ) => unknown;
        };
      };
    };
  }
}

interface Point {
  latitude: number;
  longitude: number;
}

const SERVICE_BOUNDS = {
  south: 37.03,
  west: 126.9,
  north: 37.338,
  east: 127.12,
};

const SUWON_STADIUM_CENTER: Point = {
  latitude: 37.29778,
  longitude: 127.01139,
};

const CATEGORY_LABELS: Record<MapPlace["category"], string> = {
  stadium: "경기장",
  food: "맛집",
  parking: "주차",
  stay: "숙소",
  etc: "기타",
};

function clampToServiceArea(point: Point): Point {
  return {
    latitude: Math.min(Math.max(point.latitude, SERVICE_BOUNDS.south), SERVICE_BOUNDS.north),
    longitude: Math.min(Math.max(point.longitude, SERVICE_BOUNDS.west), SERVICE_BOUNDS.east),
  };
}

function calculateDistance(from: Point, to: Point) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }

  return `${distanceKm.toFixed(1)}km`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizePhoneNumber(value: string) {
  return value.replace(/[^\d+]/g, "");
}

function getPopupCenterPoint(point: Point) {
  const latitudeOffset = typeof window !== "undefined" && window.innerWidth < 1024 ? 0.0036 : 0.002;

  return clampToServiceArea({
    latitude: point.latitude + latitudeOffset,
    longitude: point.longitude,
  });
}

function createMarkerIcon(selected: boolean) {
  const size = selected ? 34 : 28;
  const centerSize = selected ? 10 : 8;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 14}" viewBox="0 0 ${size} ${size + 14}" fill="none">
      <defs>
        <filter id="shadow" x="0" y="0" width="${size}" height="${size + 14}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="rgba(15,23,42,0.22)"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 3}" fill="#ef4444" stroke="#1539fc" stroke-width="3"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${centerSize / 2 + 3}" fill="white" opacity="0.95"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${centerSize / 2}" fill="#facc15"/>
        <path d="M${size / 2 - 7} ${size - 2} L${size / 2 + 7} ${size - 2} L${size / 2} ${size + 12} Z" fill="#1539fc"/>
      </g>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createInfoWindowContent(place: MapPlace) {
  const primaryMenu = place.menu_items[0]?.trim();
  const telHref = place.phone ? sanitizePhoneNumber(place.phone) : "";

  const descriptionMarkup = place.description
    ? `<p style="margin: 8px 0 0; font-size: 11px; line-height: 1.45; color: #334155;">${escapeHtml(place.description)}</p>`
    : "";

  const menuMarkup = primaryMenu
    ? `<div style="margin-top: 8px; font-size: 11px; line-height: 1.45; color: #475569;">
         <p style="margin: 0 0 2px; font-weight: 800; color: #0f172a;">대표메뉴</p>
         <p style="margin: 0;">${escapeHtml(primaryMenu)}</p>
       </div>`
    : "";

  const benefitMarkup = place.benefit_info
    ? `<div style="margin-top: 8px; font-size: 11px; line-height: 1.45; color: #475569;">
         <p style="margin: 0;">${escapeHtml(place.benefit_info)}</p>
       </div>`
    : "";

  const naverButtonMarkup = place.naver_place_url
    ? `<a
         href="${escapeHtml(place.naver_place_url)}"
         target="_blank"
         rel="noreferrer"
         style="
           display: inline-flex;
           align-items: center;
           justify-content: center;
           border-radius: 9999px;
           background: #1539fc;
           padding: 8px 12px;
           font-size: 11px;
           font-weight: 800;
           color: #ffffff;
           text-decoration: none;
         "
       >네이버 플레이스 보기</a>`
    : "";

  const callButtonMarkup = telHref
    ? `<a
         href="tel:${escapeHtml(telHref)}"
         style="
           display: inline-flex;
           align-items: center;
           justify-content: center;
           border-radius: 9999px;
           background: #ef4444;
           padding: 8px 12px;
           font-size: 11px;
           font-weight: 800;
           color: #ffffff;
           text-decoration: none;
         "
       >전화하기</a>`
    : "";

  const buttonRowMarkup =
    naverButtonMarkup || callButtonMarkup
      ? `<div style="margin-top: 10px; display: flex; justify-content: space-between; gap: 8px;">
           <div style="display: flex; gap: 8px; margin-left: auto;">
             ${naverButtonMarkup}
             ${callButtonMarkup}
           </div>
         </div>`
      : "";

  return `
    <div style="
      width: 220px;
      padding: 12px 12px 10px;
      border-radius: 20px;
      background: rgba(255,255,255,0.98);
      box-shadow: 0 16px 32px rgba(15,23,42,0.16);
      border: 1px solid rgba(21,93,252,0.12);
      font-family: var(--font-body, 'Noto Sans KR', sans-serif);
    ">
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
        <span style="
          border-radius: 9999px;
          background: rgba(21,93,252,0.08);
          padding: 4px 8px;
          font-size: 10px;
          font-weight: 800;
          color: #1539fc;
        ">${escapeHtml(CATEGORY_LABELS[place.category])}</span>
        <button
          type="button"
          onclick="window.__closeCastleClubInfo && window.__closeCastleClubInfo()"
          style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border: 0;
            border-radius: 9999px;
            background: rgba(15,23,42,0.06);
            color: #0f172a;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
          "
          aria-label="팝업 닫기"
        >×</button>
      </div>
      <p style="margin: 8px 0 0; font-size: 15px; font-weight: 900; color: #020617;">${escapeHtml(place.name)}</p>
      <p style="margin: 6px 0 0; font-size: 11px; line-height: 1.45; color: #475569;">${escapeHtml(place.address ?? "주소 정보가 없습니다.")}</p>
      ${descriptionMarkup}
      ${menuMarkup}
      ${benefitMarkup}
      ${buttonRowMarkup}
    </div>
  `;
}

function StadiumIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-5 w-5 text-[color:var(--brand-blue)]"
    >
      <path
        d="M4.5 9.25 12 5.75l7.5 3.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 10.5v5.25c0 .78.64 1.42 1.42 1.42h10.16c.78 0 1.42-.64 1.42-1.42V10.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 10.5v5M12 9.5v6M16 10.5v5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8.25 14.25h7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M3.75 18.75h16.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CastleClubMap({ places }: { places: MapPlace[] }) {
  const naverClientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<{
    map: {
      setCenter: (latlng: unknown) => void;
      getCenter: () => { lat: () => number; lng: () => number };
    };
    markers: Array<{ placeId: string; marker: { setMap: (map: unknown) => void; getPosition: () => unknown } }>;
    infoWindow: {
      open: (map: unknown, anchor: unknown) => void;
      close: () => void;
      setContent: (content: string) => void;
    } | null;
    idleListener?: unknown;
    mapClickListener?: unknown;
  } | null>(null);

  const [scriptReady, setScriptReady] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<Point | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const referencePoint = useMemo(() => currentPosition ?? SUWON_STADIUM_CENTER, [currentPosition]);

  const filteredPlaces = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return places;
    }

    return places.filter((place) =>
      [place.name, place.address, place.description, place.benefit_info, place.menu_items.join(" ")]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [places, searchQuery]);

  const sortedPlaces = useMemo(
    () =>
      [...filteredPlaces].sort(
        (a, b) => calculateDistance(referencePoint, a) - calculateDistance(referencePoint, b),
      ),
    [filteredPlaces, referencePoint],
  );

  const activePlaceId = sortedPlaces.some((place) => place.id === selectedPlaceId) ? selectedPlaceId : null;
  const selectedPlace = sortedPlaces.find((place) => place.id === activePlaceId) ?? null;

  useEffect(() => {
    window.__closeCastleClubInfo = () => {
      setSelectedPlaceId(null);
    };

    return () => {
      delete window.__closeCastleClubInfo;
    };
  }, []);

  const moveMapToPoint = (point: Point, mode: "center" | "popup" = "center") => {
    if (!window.naver?.maps || !mapInstanceRef.current?.map) {
      return;
    }

    const targetPoint = mode === "popup" ? getPopupCenterPoint(point) : clampToServiceArea(point);
    mapInstanceRef.current.map.setCenter(
      new window.naver.maps.LatLng(targetPoint.latitude, targetPoint.longitude),
    );
  };

  const handleLocateCurrentPosition = () => {
    if (isLocating) {
      return;
    }

    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported in this browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setCurrentPosition(point);
        moveMapToPoint(point);

        setIsLocating(false);
      },
      (error) => {
        console.warn("Failed to get current position.", error);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  };

  const handleMoveToStadium = () => {
    setSelectedPlaceId(null);
    moveMapToPoint(SUWON_STADIUM_CENTER);
  };

  useEffect(() => {
    if (!scriptReady || !window.naver?.maps || !mapRef.current) {
      return;
    }

    const naverMaps = window.naver.maps;
    const sw = new naverMaps.LatLng(SERVICE_BOUNDS.south, SERVICE_BOUNDS.west);
    const ne = new naverMaps.LatLng(SERVICE_BOUNDS.north, SERVICE_BOUNDS.east);
    const bounds = new naverMaps.LatLngBounds(sw, ne);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.markers.forEach(({ marker }) => marker.setMap(null));
      mapInstanceRef.current.infoWindow?.close();
    }

    const centerTarget = selectedPlace
      ? getPopupCenterPoint(selectedPlace)
      : currentPosition
        ? clampToServiceArea(currentPosition)
        : SUWON_STADIUM_CENTER;
    const center = new naverMaps.LatLng(centerTarget.latitude, centerTarget.longitude);

    const map =
      mapInstanceRef.current?.map ??
      new naverMaps.Map(mapRef.current, {
        center,
        zoom: 15,
        minZoom: 12,
        maxBounds: bounds,
        scaleControl: false,
        logoControl: false,
        mapDataControl: false,
      });

    map.setCenter(center);

    const infoWindow =
      mapInstanceRef.current?.infoWindow ??
      new naverMaps.InfoWindow({
        content: "",
        backgroundColor: "transparent",
        borderWidth: 0,
        disableAnchor: false,
        pixelOffset: new naverMaps.Point(0, -16),
      });

    const markers = sortedPlaces.map((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const marker = new naverMaps.Marker({
        map,
        position: new naverMaps.LatLng(place.latitude, place.longitude),
        icon: {
          url: createMarkerIcon(isSelected),
          size: new naverMaps.Size(isSelected ? 34 : 28, isSelected ? 48 : 42),
          scaledSize: new naverMaps.Size(isSelected ? 34 : 28, isSelected ? 48 : 42),
          anchor: new naverMaps.Point(isSelected ? 17 : 14, isSelected ? 48 : 42),
        },
      });

      naverMaps.Event.addListener(marker, "click", () => {
        setSelectedPlaceId(place.id);
        setSheetOpen(true);
        moveMapToPoint(place, "popup");
      });

      return { placeId: place.id, marker };
    });

    if (!mapInstanceRef.current?.idleListener) {
      const idleListener = naverMaps.Event.addListener(map, "idle", () => {
        const currentCenter = map.getCenter();
        if (!bounds.hasLatLng(currentCenter)) {
          const nextCenter = clampToServiceArea({
            latitude: currentCenter.lat(),
            longitude: currentCenter.lng(),
          });

          map.setCenter(new naverMaps.LatLng(nextCenter.latitude, nextCenter.longitude));
        }
      });

      mapInstanceRef.current = { map, markers, infoWindow, idleListener };
    } else {
      mapInstanceRef.current = {
        map,
        markers,
        infoWindow,
        idleListener: mapInstanceRef.current.idleListener,
        mapClickListener: mapInstanceRef.current.mapClickListener,
      };
    }

    if (!mapInstanceRef.current.mapClickListener) {
      const mapClickListener = naverMaps.Event.addListener(map, "click", () => {
        setSelectedPlaceId(null);
      });
      mapInstanceRef.current.mapClickListener = mapClickListener;
    }

    if (selectedPlace) {
      const selectedMarker = markers.find((item) => item.placeId === selectedPlace.id)?.marker;
      if (selectedMarker) {
        infoWindow.setContent(createInfoWindowContent(selectedPlace));
        infoWindow.open(map, selectedMarker);
      }
    } else {
      infoWindow.close();
    }
  }, [currentPosition, scriptReady, selectedPlace, sortedPlaces]);

  const sheet = (
    <div className="overflow-hidden rounded-t-[24px] rounded-b-none bg-[rgba(255,255,255,0.98)] shadow-[0_-18px_40px_rgba(15,23,42,0.08)] backdrop-blur">
      <button
        type="button"
        onClick={() => setSheetOpen((current) => !current)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-label="주변 장소 목록 열기"
      >
        <div>
          <p className="text-sm font-black text-slate-950">주변 장소</p>
          {sheetOpen ? (
            <p className="text-[11px] text-slate-500">
              {currentPosition ? "현재 위치 기준 거리순" : "수원종합운동장 기준 거리순"}
            </p>
          ) : null}
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(13,27,112,0.06)] text-slate-700">
          <ChevronUp className={cn("h-4 w-4 transition-transform", sheetOpen && "rotate-180")} />
        </span>
      </button>

      {sheetOpen ? (
        <div className="max-h-[12rem] space-y-2 overflow-y-auto px-3 pb-3">
          {sortedPlaces.length ? (
            sortedPlaces.map((place) => {
              const distance = formatDistance(calculateDistance(referencePoint, place));

              return (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlaceId(place.id);
                    moveMapToPoint(place, "popup");
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[18px] border px-3.5 py-3 text-left transition",
                    selectedPlace?.id === place.id
                      ? "border-[rgba(21,93,252,0.18)] bg-[rgba(21,93,252,0.04)]"
                      : "border-[rgba(15,23,42,0.06)] bg-white",
                  )}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[rgba(21,93,252,0.08)] text-[color:var(--brand-blue)]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-950">{place.name}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {place.address ?? "주소 정보가 없습니다."}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs font-black text-[color:var(--brand-navy)]">{distance}</p>
                </button>
              );
            })
          ) : (
            <div className="rounded-[18px] bg-white px-4 py-4 text-sm text-slate-500">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 pb-2 text-[11px] text-slate-500">
          {selectedPlace ? "장소 목록 보기" : "표시된 장소가 없습니다."}
        </div>
      )}
    </div>
  );

  return (
    <>
      {naverClientId ? (
        <Script
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${naverClientId}`}
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
        />
      ) : null}

      <div className="relative h-full min-h-0 overflow-hidden bg-slate-100 lg:rounded-[32px]">
        {naverClientId ? (
          <div ref={mapRef} className="absolute inset-0 h-full w-full" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,#dbe7ff,#f4f7ff)] text-sm text-slate-500">
            NAVER Maps를 연결하면 지도와 장소가 표시됩니다.
          </div>
        )}

        <div className="absolute inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-10">
          <div className="flex items-center gap-2.5">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-[22px] bg-[rgba(255,255,255,0.97)] px-4 py-3 shadow-[0_14px_34px_rgba(15,23,42,0.12)] backdrop-blur">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="주변 장소 검색"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
              />
              <Search className="h-5 w-5 text-[color:var(--brand-blue)]" />
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMoveToStadium}
                className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(255,255,255,0.97)] shadow-[0_14px_34px_rgba(15,23,42,0.12)] backdrop-blur"
                aria-label="수원종합운동장으로 이동"
              >
                <StadiumIcon />
              </button>
              <button
                type="button"
                onClick={handleLocateCurrentPosition}
                disabled={isLocating}
                className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(255,255,255,0.97)] shadow-[0_14px_34px_rgba(15,23,42,0.12)] backdrop-blur"
                aria-label="내 위치로 이동"
              >
                <LocateFixed
                  className={cn("h-5 w-5 text-[color:var(--brand-blue)]", isLocating && "animate-pulse")}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-[4.5rem] z-10 lg:hidden">
          <div className="app-shell px-3">{sheet}</div>
        </div>

        <div className="absolute inset-x-0 bottom-[1rem] z-10 hidden lg:block">{sheet}</div>
      </div>
    </>
  );
}
