"use client";

import {
  MonitorSpeaker,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { SurfaceCard } from "@/components/ui/surface-card";
import { cn, formatDuration } from "@/lib/utils";
import { useChantPlayerStore } from "@/store/chant-player";

interface DesktopMiniPlayerProps {
  isPlaying: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onOpenDetail: () => void;
  onPlayNext: () => void;
  onPlayPrevious: () => void;
  onTogglePlayback: () => void;
}

function DesktopMiniPlayer({
  isPlaying,
  title,
  description,
  onClose,
  onOpenDetail,
  onPlayNext,
  onPlayPrevious,
  onTogglePlayback,
}: DesktopMiniPlayerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-40 hidden lg:block">
      <SurfaceCard className="w-[22rem] border-slate-200 bg-[rgba(255,255,255,0.96)] px-4 py-3 shadow-[0_20px_50px_rgba(8,20,76,0.18)] backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <button type="button" onClick={onOpenDetail} className="min-w-0 flex-1 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-blue)]">
              Now Playing
            </p>
            <h3 className="mt-1 truncate text-sm font-black text-slate-950">
              {title}
            </h3>
            <p className="mt-1 truncate text-xs text-slate-500">{description}</p>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(13,27,112,0.06)] text-[color:var(--brand-navy)]"
            aria-label="재생 종료"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onPlayPrevious}
            className="rounded-full bg-[rgba(13,27,112,0.06)] p-2.5 text-[color:var(--brand-navy)]"
            aria-label="이전 곡"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onTogglePlayback}
            className="rounded-full bg-[color:var(--brand-navy)] p-3 text-white"
            aria-label={isPlaying ? "일시정지" : "재생"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
          </button>
          <button
            type="button"
            onClick={onPlayNext}
            className="rounded-full bg-[rgba(13,27,112,0.06)] p-2.5 text-[color:var(--brand-navy)]"
            aria-label="다음 곡"
          >
            <SkipForward className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onOpenDetail}
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-[rgba(21,93,252,0.08)] px-3 py-2 text-xs font-semibold text-[color:var(--brand-blue)]"
          >
            <MonitorSpeaker className="h-3.5 w-3.5" />
            상세
          </button>
        </div>
      </SurfaceCard>
    </div>
  );
}

export function ChantPlayerHost() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    closeDetail,
    currentTime,
    currentTrackId,
    dismissPlayback,
    duration,
    hasStartedPlayback,
    isDetailOpen,
    isPlaying,
    openDetail,
    playlists,
    queue,
    selectedPlaylistId,
    selectTrack,
    setCurrentTime,
    setDuration,
    setPlaying,
    togglePlayback,
    tracks,
  } = useChantPlayerStore();

  const currentTrack = useMemo(
    () => tracks.find((track) => track.id === currentTrackId) ?? null,
    [currentTrackId, tracks],
  );

  const selectedPlaylist = useMemo(
    () => playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null,
    [playlists, selectedPlaylistId],
  );

  const currentTrackIndex = useMemo(
    () => queue.findIndex((trackId) => trackId === currentTrackId),
    [currentTrackId, queue],
  );

  const totalDuration = duration > 0 ? duration : (currentTrack?.duration ?? 0);

  const playTrackByIndex = useCallback(
    (index: number) => {
      const nextTrackId = queue[index];

      if (!nextTrackId) {
        return;
      }

      selectTrack(nextTrackId, true, isDetailOpen);
    },
    [isDetailOpen, queue, selectTrack],
  );

  const handlePlayNext = useCallback(() => {
    if (!queue.length) {
      return;
    }

    const safeIndex = currentTrackIndex >= 0 ? currentTrackIndex : 0;
    const nextIndex = (safeIndex + 1) % queue.length;
    playTrackByIndex(nextIndex);
  }, [currentTrackIndex, playTrackByIndex, queue.length]);

  const handlePlayPrevious = useCallback(() => {
    if (!queue.length) {
      return;
    }

    const safeIndex = currentTrackIndex >= 0 ? currentTrackIndex : 0;
    const previousIndex = safeIndex - 1 < 0 ? queue.length - 1 : safeIndex - 1;
    playTrackByIndex(previousIndex);
  }, [currentTrackIndex, playTrackByIndex, queue.length]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !currentTrack?.audio_url) {
      return;
    }

    if (!isPlaying) {
      audio.pause();
      return;
    }

    audio.play().catch(() => {
      setPlaying(false);
    });
  }, [currentTrack?.id, currentTrack?.audio_url, isPlaying, setPlaying]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator) || !currentTrack) {
      return;
    }

    if ("MediaMetadata" in window) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: "수원FC 응원가",
        album: selectedPlaylist?.name ?? "수원FC 캐슬클럽",
      });
    }

    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

    navigator.mediaSession.setActionHandler("play", () => {
      if (!isPlaying) {
        togglePlayback();
      }
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      if (isPlaying) {
        togglePlayback();
      }
    });
    navigator.mediaSession.setActionHandler("previoustrack", handlePlayPrevious);
    navigator.mediaSession.setActionHandler("nexttrack", handlePlayNext);
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      const audio = audioRef.current;
      const nextTime = details.seekTime ?? 0;

      if (audio) {
        audio.currentTime = nextTime;
      }

      setCurrentTime(nextTime);
    });

    return () => {
      if (!("mediaSession" in navigator)) {
        return;
      }

      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("seekto", null);
    };
  }, [
    currentTrack,
    handlePlayNext,
    handlePlayPrevious,
    isPlaying,
    selectedPlaylist?.name,
    setCurrentTime,
    togglePlayback,
  ]);

  if (!currentTrack || !queue.length || !hasStartedPlayback) {
    return null;
  }

  return (
    <>
      <audio
        key={currentTrack.id}
        ref={audioRef}
        src={currentTrack.audio_url ?? undefined}
        preload="auto"
        autoPlay={isPlaying}
        playsInline
        aria-hidden="true"
        tabIndex={-1}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onEnded={handlePlayNext}
        className="fixed -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0"
      />

      <DesktopMiniPlayer
        isPlaying={isPlaying}
        title={currentTrack.title}
        description={
          selectedPlaylist?.name
            ? `${selectedPlaylist.name} 재생 중`
            : currentTrack.description ?? "응원가 재생 중"
        }
        onClose={dismissPlayback}
        onOpenDetail={openDetail}
        onPlayNext={handlePlayNext}
        onPlayPrevious={handlePlayPrevious}
        onTogglePlayback={togglePlayback}
      />

      {isDetailOpen ? (
        <div className="fixed inset-0 z-50 bg-[rgba(5,10,31,0.28)] backdrop-blur-[3px]">
          <div className="app-shell relative h-full px-3">
            <div className="absolute inset-x-3 bottom-[6.25rem] top-[calc(env(safe-area-inset-top)+0.75rem)]">
              <SurfaceCard className="flex h-full flex-col overflow-hidden rounded-[30px] border-white/30 bg-[rgba(255,255,255,0.98)] p-0">
                <div className="flex items-center justify-between border-b border-[color:var(--line)] px-4 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-blue)]">
                      상세 재생
                    </p>
                    <h2 className="mt-1 text-lg font-black text-slate-950">
                      {currentTrack.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={closeDetail}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(13,27,112,0.08)] text-[color:var(--brand-navy)]"
                    aria-label="상세 재생 닫기"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
                  <div className="rounded-[22px] bg-[linear-gradient(145deg,#081452,#155dfc)] px-4 py-3.5 text-white">
                    <p className="text-sm leading-6 text-sky-50/88">
                      {currentTrack.description ?? "선택한 응원가 설명이 여기에 표시됩니다."}
                    </p>
                  </div>

                  <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-[22px] border border-[color:var(--line)] bg-white px-4 py-5">
                    <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Lyrics
                    </p>
                    <p className="whitespace-pre-line text-center text-[1.05rem] leading-9 text-slate-800">
                      {currentTrack.lyrics ?? "가사가 아직 등록되지 않았습니다."}
                    </p>
                  </div>

                  <div className="mt-auto border-t border-[color:var(--line)] pt-4">
                    <div className="space-y-2">
                      <div className="relative">
                        <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(13,27,112,0.08)]">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#0d1b70,#155dfc)]"
                            style={{
                              width:
                                totalDuration > 0
                                  ? `${Math.min((currentTime / totalDuration) * 100, 100)}%`
                                  : "0%",
                            }}
                          />
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(totalDuration, 0)}
                          step={1}
                          value={Math.min(currentTime, Math.max(totalDuration, 0))}
                          onChange={(event) => {
                            const audio = audioRef.current;
                            const nextTime = Number(event.target.value);

                            if (audio) {
                              audio.currentTime = nextTime;
                            }

                            setCurrentTime(nextTime);
                          }}
                          className={cn(
                            "absolute inset-0 h-1.5 w-full cursor-pointer appearance-none bg-transparent",
                            "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-transparent",
                            "[&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[color:var(--brand-blue)]",
                            "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:bg-transparent",
                            "[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[color:var(--brand-blue)]",
                          )}
                          aria-label="재생 위치 이동"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                        <span>{formatDuration(currentTime)}</span>
                        <span>{formatDuration(totalDuration)}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-3 pb-1">
                      <button
                        type="button"
                        onClick={handlePlayPrevious}
                        className="rounded-full bg-[rgba(13,27,112,0.06)] p-3 text-[color:var(--brand-navy)]"
                        aria-label="이전 곡"
                      >
                        <SkipBack className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={togglePlayback}
                        className="rounded-full bg-[color:var(--brand-navy)] p-4 text-white"
                        aria-label={isPlaying ? "일시정지" : "재생"}
                      >
                        {isPlaying ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5 fill-current" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handlePlayNext}
                        className="rounded-full bg-[rgba(13,27,112,0.06)] p-3 text-[color:var(--brand-navy)]"
                        aria-label="다음 곡"
                      >
                        <SkipForward className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
