"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Play,
  Plus,
  Trash2,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";

import { SurfaceCard } from "@/components/ui/surface-card";
import { cn, formatDuration } from "@/lib/utils";
import { useChantPlayerStore, type ChantPlaylist } from "@/store/chant-player";
import type { Chant } from "@/types";

function getLyricsPreview(lyrics: string | null) {
  if (!lyrics) {
    return "가사는 아직 등록되지 않았습니다.";
  }

  return lyrics.replace(/\n+/g, " ").slice(0, 90);
}

function getPlaylistTarget(
  playlists: ChantPlaylist[],
  selectedPlaylistId: string | null,
) {
  if (selectedPlaylistId) {
    return selectedPlaylistId;
  }

  if (playlists.length === 1) {
    return playlists[0]?.id ?? null;
  }

  return null;
}

export function ChantsBoard({ chants }: { chants: Chant[] }) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const {
    addTrackToPlaylist,
    addTracksToPlaylist,
    createPlaylist,
    currentTrackId,
    initializeQueue,
    playPlaylist,
    playlists,
    queue,
    removePlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
    selectPlaylist,
    selectTrack,
    selectedPlaylistId,
    tracks,
  } = useChantPlayerStore();

  useEffect(() => {
    initializeQueue(chants);
  }, [chants, initializeQueue]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const legacyMediaQuery = mediaQuery as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };
    const update = () =>
      setIsTouchDevice(mediaQuery.matches || window.navigator.maxTouchPoints > 0);

    update();

    if ("addEventListener" in mediaQuery) {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    legacyMediaQuery.addListener?.(update);
    return () => legacyMediaQuery.removeListener?.(update);
  }, []);

  const trackMap = useMemo(
    () => new Map(tracks.map((track) => [track.id, track])),
    [tracks],
  );

  const nowListening =
    tracks.find((track) => track.id === currentTrackId) ?? tracks[0] ?? null;

  const selectedPlaylist =
    playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null;

  const selectedPlaylistTracks = (selectedPlaylist?.trackIds ?? [])
    .map((trackId) => trackMap.get(trackId))
    .filter((track): track is Chant => Boolean(track));

  const suggestedPlaylistId = getPlaylistTarget(playlists, selectedPlaylistId);

  const handleCreatePlaylist = () => {
    const nextName = window.prompt("플레이리스트 이름을 입력해 주세요.");

    if (!nextName) {
      return;
    }

    const playlistId = createPlaylist(nextName);

    if (playlistId) {
      selectPlaylist(playlistId);
    }
  };

  const resolvePlaylistTarget = () => {
    let playlistId = suggestedPlaylistId;

    if (!playlistId) {
      const names = playlists.map((playlist) => `- ${playlist.name}`).join("\n");
      const answer = window.prompt(
        playlists.length
          ? `추가할 플레이리스트 이름을 입력해 주세요.\n${names}`
          : "먼저 플레이리스트 이름을 입력해 주세요.",
      );

      if (!answer) {
        return null;
      }

      playlistId = createPlaylist(answer);
    }

    if (!playlistId) {
      return null;
    }

    selectPlaylist(playlistId);
    return playlistId;
  };

  const handleAddToPlaylist = (trackId: string) => {
    const playlistId = resolvePlaylistTarget();

    if (!playlistId) {
      return;
    }

    addTrackToPlaylist(trackId, playlistId);
  };

  const handleAddAllToPlaylist = () => {
    const playlistId = resolvePlaylistTarget();

    if (!playlistId) {
      return;
    }

    addTracksToPlaylist(
      chants.map((chant) => chant.id),
      playlistId,
    );
  };

  const handlePlaylistDragEnd = (result: DropResult) => {
    if (!selectedPlaylistId || !result.destination) {
      return;
    }

    if (result.destination.index === result.source.index) {
      return;
    }

    reorderPlaylistTracks(
      selectedPlaylistId,
      result.source.index,
      result.destination.index,
    );
  };

  const handleDeletePlaylist = () => {
    if (!selectedPlaylist) {
      return;
    }

    if (
      selectedPlaylist.trackIds.length > 0 &&
      !window.confirm(
        `"${selectedPlaylist.name}" 플레이리스트에 곡이 들어 있습니다. 정말 삭제할까요?`,
      )
    ) {
      return;
    }

    removePlaylist(selectedPlaylist.id);
  };

  return (
    <div className="grid gap-4 pb-4">
      {nowListening ? (
        <SurfaceCard className="overflow-hidden bg-[linear-gradient(145deg,#081452,#155dfc)] p-0 text-white">
          <button
            type="button"
            onClick={() => selectTrack(nowListening.id, true, true)}
            className="block w-full px-4 py-4 text-left"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-100/88">
                Now Listening
              </p>
              <h1 className="mt-2 text-[1.45rem] font-black leading-tight">
                {nowListening.title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-sky-50/88">
                {nowListening.description ?? "지금 선택한 응원가를 바로 들을 수 있습니다."}
              </p>
            </div>
          </button>
        </SurfaceCard>
      ) : null}

      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-blue)]">
              Chant List
            </p>
            <h2 className="mt-1 text-lg font-black text-slate-950">응원가 목록</h2>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-500">{chants.length}곡</p>
            <button
              type="button"
              onClick={handleAddAllToPlaylist}
              className="rounded-full bg-[rgba(13,27,112,0.06)] px-3.5 py-2 text-xs font-semibold text-[color:var(--brand-navy)]"
            >
              전체 담기
            </button>
          </div>
        </div>

        <SurfaceCard className="overflow-hidden p-0">
          <div className="grid gap-0">
            {chants.map((chant) => {
              const isCurrent = chant.id === currentTrackId;
              const alreadyAdded = selectedPlaylist?.trackIds.includes(chant.id) ?? false;

              return (
                <div
                  key={chant.id}
                  className={cn(
                    "grid grid-cols-[1fr_auto] items-center gap-3 border-b border-[color:var(--line)] px-3.5 py-3 last:border-b-0",
                    isCurrent && "bg-[rgba(21,93,252,0.06)]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => selectTrack(chant.id, true, true)}
                    className="min-w-0 text-left"
                  >
                    <p className="truncate text-[15px] font-black text-slate-950">
                      {chant.title}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {getLyricsPreview(chant.lyrics)}
                    </p>
                    {isCurrent ? (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--brand-blue)]">
                        <Volume2 className="h-3.5 w-3.5" />
                        현재 재생 중
                      </p>
                    ) : null}
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">
                      {formatDuration(chant.duration)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddToPlaylist(chant.id)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold",
                        alreadyAdded
                          ? "bg-[rgba(21,93,252,0.12)] text-[color:var(--brand-blue)]"
                          : "bg-[rgba(13,27,112,0.06)] text-slate-600",
                      )}
                    >
                      {alreadyAdded ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      {alreadyAdded ? "추가됨" : "담기"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-blue)]">
              Playlist
            </p>
            <h2 className="mt-1 text-lg font-black text-slate-950">플레이리스트</h2>
          </div>
          <div className="flex items-center gap-2">
            {selectedPlaylist ? (
              <button
                type="button"
                onClick={handleDeletePlaylist}
                className="rounded-full bg-[rgba(239,68,68,0.08)] px-4 py-2 text-sm font-semibold text-red-500"
              >
                플레이리스트 삭제
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleCreatePlaylist}
              className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white"
            >
              새로 만들기
            </button>
          </div>
        </div>

        {playlists.length ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {playlists.map((playlist) => {
              const active = playlist.id === selectedPlaylistId;

              return (
                <button
                  key={playlist.id}
                  type="button"
                  onClick={() => selectPlaylist(active ? null : playlist.id)}
                  className={cn(
                    "min-w-[10rem] shrink-0 rounded-[20px] border px-4 py-3 text-left transition",
                    active
                      ? "border-[rgba(21,93,252,0.24)] bg-[rgba(21,93,252,0.08)]"
                      : "border-[color:var(--line)] bg-white",
                  )}
                >
                  <p className="truncate font-bold text-slate-950">{playlist.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {playlist.trackIds.length}곡
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <SurfaceCard className="p-4">
            <p className="text-sm text-slate-500">
              아직 만든 플레이리스트가 없습니다. 새로 만들기로 시작해 보세요.
            </p>
          </SurfaceCard>
        )}

        <SurfaceCard className="overflow-hidden p-0">
          <div className="flex items-center justify-between gap-3 border-b border-[color:var(--line)] px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                재생목록
              </p>
              <h3 className="mt-1 text-base font-black text-slate-950">
                {selectedPlaylist?.name ?? "플레이리스트를 선택해 주세요"}
              </h3>
            </div>

            {selectedPlaylist && selectedPlaylistTracks.length ? (
              <button
                type="button"
                onClick={() => playPlaylist(selectedPlaylist.id)}
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white"
              >
                <Play className="h-4 w-4 fill-current" />
                재생
              </button>
            ) : null}
          </div>

          {selectedPlaylist ? (
            selectedPlaylistTracks.length ? (
              isTouchDevice ? (
                <div>
                  {selectedPlaylistTracks.map((chant, index) => {
                    const isCurrent = chant.id === currentTrackId;

                    return (
                      <div
                        key={chant.id}
                        className={cn(
                          "border-b border-[color:var(--line)] last:border-b-0",
                          isCurrent && "bg-[rgba(21,93,252,0.06)]",
                        )}
                      >
                        <div className="grid grid-cols-[1fr_auto] gap-3 px-4 py-4 text-left text-sm">
                          <button
                            type="button"
                            onClick={() => selectTrack(chant.id, true, true)}
                            className="min-w-0 text-left"
                          >
                            <p className="truncate font-semibold text-slate-950">
                              {index + 1}. {chant.title}
                            </p>
                            {isCurrent ? (
                              <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--brand-blue)]">
                                <Volume2 className="h-3.5 w-3.5" />
                                현재 재생 중
                              </p>
                            ) : null}
                          </button>

                          <div className="flex items-center gap-2">
                            <span className="shrink-0 text-slate-400">
                              {formatDuration(chant.duration)}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  reorderPlaylistTracks(
                                    selectedPlaylist.id,
                                    index,
                                    Math.max(index - 1, 0),
                                  )
                                }
                                disabled={index === 0}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(13,27,112,0.06)] text-slate-500 disabled:opacity-35"
                                aria-label="위로 이동"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  reorderPlaylistTracks(
                                    selectedPlaylist.id,
                                    index,
                                    Math.min(index + 1, selectedPlaylistTracks.length - 1),
                                  )
                                }
                                disabled={index === selectedPlaylistTracks.length - 1}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(13,27,112,0.06)] text-slate-500 disabled:opacity-35"
                                aria-label="아래로 이동"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  removeTrackFromPlaylist(chant.id, selectedPlaylist.id)
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(239,68,68,0.08)] text-red-500"
                                aria-label="플레이리스트에서 삭제"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <DragDropContext onDragEnd={handlePlaylistDragEnd}>
                  <Droppable droppableId={selectedPlaylist.id}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}>
                        {selectedPlaylistTracks.map((chant, index) => {
                          const isCurrent = chant.id === currentTrackId;

                          return (
                            <Draggable
                              key={chant.id}
                              draggableId={chant.id}
                              index={index}
                            >
                              {(dragProvided, snapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  className={cn(
                                    "border-b border-[color:var(--line)] last:border-b-0",
                                    snapshot.isDragging && "bg-white shadow-lg",
                                    isCurrent && !snapshot.isDragging && "bg-[rgba(21,93,252,0.06)]",
                                  )}
                                >
                                  <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-4 text-left text-sm">
                                    <button
                                      type="button"
                                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(13,27,112,0.06)] text-slate-500 touch-none"
                                      aria-label="순서 변경"
                                      {...dragProvided.dragHandleProps}
                                    >
                                      <GripVertical className="h-4 w-4" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => selectTrack(chant.id, true, true)}
                                      className="min-w-0 text-left"
                                    >
                                      <p className="truncate font-semibold text-slate-950">
                                        {index + 1}. {chant.title}
                                      </p>
                                      {isCurrent ? (
                                        <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--brand-blue)]">
                                          <Volume2 className="h-3.5 w-3.5" />
                                          현재 재생 중
                                        </p>
                                      ) : null}
                                    </button>

                                    <span className="shrink-0 text-slate-400">
                                      {formatDuration(chant.duration)}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeTrackFromPlaylist(chant.id, selectedPlaylist.id)
                                      }
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(239,68,68,0.08)] text-red-500"
                                      aria-label="플레이리스트에서 삭제"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )
            ) : (
              <div className="px-4 py-5 text-sm text-slate-500">
                아직 담긴 응원가가 없습니다.
              </div>
            )
          ) : (
            <div className="px-4 py-5 text-sm text-slate-500">
              플레이리스트를 선택하면 재생목록이 보입니다.
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard className="px-4 py-3">
          <p className="text-sm text-slate-500">
            전체 재생 대기열에는 현재 {queue.length}곡이 들어 있습니다.
          </p>
        </SurfaceCard>
      </section>
    </div>
  );
}
