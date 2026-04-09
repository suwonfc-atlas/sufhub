"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Chant } from "@/types";

export type RepeatMode = "off" | "all" | "one";

export interface ChantPlaylist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: string;
}

function getAllTrackIds(tracks: Chant[]) {
  return tracks.map((track) => track.id);
}

function getPlaybackQueue(state: {
  tracks: Chant[];
  queue: string[];
  playlists: ChantPlaylist[];
  selectedPlaylistId: string | null;
  currentTrackId: string | null;
}, currentTrackIdOverride?: string | null) {
  const currentTrackId = currentTrackIdOverride ?? state.currentTrackId;
  const selectedPlaylist = state.playlists.find(
    (playlist) => playlist.id === state.selectedPlaylistId,
  );

  if (selectedPlaylist?.trackIds.length && currentTrackId && selectedPlaylist.trackIds.includes(currentTrackId)) {
    return selectedPlaylist.trackIds;
  }

  if (selectedPlaylist?.trackIds.length && !currentTrackId) {
    return selectedPlaylist.trackIds;
  }

  if (state.queue.length && currentTrackId && state.queue.includes(currentTrackId)) {
    return state.queue;
  }

  if (state.queue.length && !currentTrackId) {
    return state.queue;
  }

  return getAllTrackIds(state.tracks);
}

interface ChantPlayerState {
  tracks: Chant[];
  queue: string[];
  playlists: ChantPlaylist[];
  selectedPlaylistId: string | null;
  currentTrackId: string | null;
  isPlaying: boolean;
  hasStartedPlayback: boolean;
  isDetailOpen: boolean;
  repeatMode: RepeatMode;
  currentTime: number;
  duration: number;
  initializeQueue: (tracks: Chant[]) => void;
  resetQueue: (tracks?: Chant[]) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  reorderPlaylistTracks: (
    playlistId: string,
    startIndex: number,
    endIndex: number,
  ) => void;
  selectTrack: (trackId: string, autoplay?: boolean, openDetail?: boolean) => void;
  playPlaylist: (playlistId: string, openDetail?: boolean) => void;
  togglePlayback: () => void;
  setPlaying: (isPlaying: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  cycleRepeatMode: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  createPlaylist: (name: string) => string | null;
  removePlaylist: (playlistId: string) => void;
  selectPlaylist: (playlistId: string | null) => void;
  addTrackToPlaylist: (trackId: string, playlistId: string) => boolean;
  addTracksToPlaylist: (trackIds: string[], playlistId: string) => boolean;
  removeTrackFromPlaylist: (trackId: string, playlistId: string) => void;
  openDetail: () => void;
  closeDetail: () => void;
  dismissPlayback: () => void;
}

function createPlaylistId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `playlist-${Date.now()}`;
}

function reorderIds(ids: string[], startIndex: number, endIndex: number) {
  const nextIds = [...ids];
  const [moved] = nextIds.splice(startIndex, 1);

  if (!moved) {
    return ids;
  }

  nextIds.splice(endIndex, 0, moved);
  return nextIds;
}

export const useChantPlayerStore = create<ChantPlayerState>()(
  persist(
    (set, get) => ({
      tracks: [],
      queue: [],
      playlists: [],
      selectedPlaylistId: null,
      currentTrackId: null,
      isPlaying: false,
      hasStartedPlayback: false,
      isDetailOpen: false,
      repeatMode: "off",
      currentTime: 0,
      duration: 0,

      initializeQueue: (tracks) => {
        const trackIds = tracks.map((track) => track.id);
        const sanitizedPlaylists = get().playlists.map((playlist) => ({
          ...playlist,
          trackIds: playlist.trackIds.filter((id) => trackIds.includes(id)),
        }));
        const selectedPlaylist = sanitizedPlaylists.find(
          (playlist) => playlist.id === get().selectedPlaylistId,
        );
        const validQueue = get().queue.filter((id) => trackIds.includes(id));
        const missingIds = trackIds.filter((id) => !validQueue.includes(id));
        const nextQueue = selectedPlaylist
          ? selectedPlaylist.trackIds
          : validQueue.length > 0
            ? [...validQueue, ...missingIds]
            : trackIds;
        const currentTrackId = nextQueue.includes(get().currentTrackId ?? "")
          ? get().currentTrackId
          : nextQueue[0] ?? null;

        set({
          tracks,
          playlists: sanitizedPlaylists,
          queue: nextQueue,
          currentTrackId,
          selectedPlaylistId: selectedPlaylist?.id ?? null,
        });
      },

      resetQueue: (tracks) => {
        const sourceTracks = tracks ?? get().tracks;
        const queue = sourceTracks.map((track) => track.id);

        set({
          tracks: sourceTracks,
          queue,
          selectedPlaylistId: null,
          currentTrackId: queue[0] ?? null,
          currentTime: 0,
          duration: 0,
          hasStartedPlayback: false,
          isDetailOpen: false,
        });
      },

      reorderQueue: (startIndex, endIndex) => {
        set({ queue: reorderIds(get().queue, startIndex, endIndex) });
      },

      reorderPlaylistTracks: (playlistId, startIndex, endIndex) => {
        const playlist = get().playlists.find((item) => item.id === playlistId);

        if (!playlist) {
          return;
        }

        const nextTrackIds = reorderIds(playlist.trackIds, startIndex, endIndex);
        const playlists = get().playlists.map((item) =>
          item.id === playlistId ? { ...item, trackIds: nextTrackIds } : item,
        );

        set({
          playlists,
          queue:
            get().selectedPlaylistId === playlistId ? nextTrackIds : get().queue,
        });
      },

      selectTrack: (trackId, autoplay = false, openDetail = false) => {
        set((state) => {
          const allTrackIds = getAllTrackIds(state.tracks);
          const playbackQueue = getPlaybackQueue(state, trackId);
          const nextQueue = playbackQueue.includes(trackId) ? playbackQueue : allTrackIds;

          return {
            queue: nextQueue,
          currentTrackId: trackId,
          currentTime: 0,
          duration: 0,
          isPlaying: autoplay || state.isPlaying,
          hasStartedPlayback: autoplay || state.hasStartedPlayback,
          isDetailOpen: openDetail ? true : state.isDetailOpen,
          };
        });
      },

      playPlaylist: (playlistId, openDetail = false) => {
        const playlist = get().playlists.find((item) => item.id === playlistId);

        if (!playlist || !playlist.trackIds.length) {
          return;
        }

        set({
          selectedPlaylistId: playlist.id,
          queue: playlist.trackIds,
          currentTrackId: playlist.trackIds[0],
          currentTime: 0,
          duration: 0,
          isPlaying: true,
          hasStartedPlayback: true,
          isDetailOpen: openDetail,
        });
      },

      togglePlayback: () => {
        const state = get();
        const playbackQueue = getPlaybackQueue(state);
        const nextPlaying = !state.isPlaying;

        set({
          queue: playbackQueue,
          currentTrackId: state.currentTrackId ?? playbackQueue[0] ?? null,
          isPlaying: nextPlaying,
          hasStartedPlayback: nextPlaying || state.hasStartedPlayback,
        });
      },

      setPlaying: (isPlaying) =>
        set((state) => ({
          isPlaying,
          hasStartedPlayback: isPlaying || state.hasStartedPlayback,
        })),

      setRepeatMode: (repeatMode) => set({ repeatMode }),

      cycleRepeatMode: () => {
        const repeatMode = get().repeatMode;
        const nextMode: RepeatMode =
          repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";

        set({ repeatMode: nextMode });
      },

      setCurrentTime: (currentTime) => set({ currentTime }),
      setDuration: (duration) => set({ duration }),

      playNext: () => {
        const state = get();
        const playbackQueue = getPlaybackQueue(state);
        const currentIndex = playbackQueue.findIndex((id) => id === state.currentTrackId);

        if (!playbackQueue.length) {
          return;
        }

        if (state.repeatMode === "one") {
          set({ currentTime: 0, isPlaying: true });
          return;
        }

        if (currentIndex === -1) {
          set({
            queue: playbackQueue,
            currentTrackId: playbackQueue[0],
            currentTime: 0,
            duration: 0,
            isPlaying: true,
            hasStartedPlayback: true,
          });
          return;
        }

        const nextIndex = currentIndex + 1;

        if (nextIndex < playbackQueue.length) {
          set({
            queue: playbackQueue,
            currentTrackId: playbackQueue[nextIndex],
            currentTime: 0,
            duration: 0,
            isPlaying: true,
            hasStartedPlayback: true,
          });
          return;
        }

        if (state.repeatMode === "all") {
          set({
            queue: playbackQueue,
            currentTrackId: playbackQueue[0],
            currentTime: 0,
            duration: 0,
            isPlaying: true,
            hasStartedPlayback: true,
          });
          return;
        }

        set({
          isPlaying: false,
          currentTime: 0,
        });
      },

      playPrevious: () => {
        const state = get();
        const playbackQueue = getPlaybackQueue(state);
        const currentIndex = playbackQueue.findIndex((id) => id === state.currentTrackId);

        if (!playbackQueue.length) {
          return;
        }

        if (currentIndex === -1) {
          set({
            queue: playbackQueue,
            currentTrackId: playbackQueue[playbackQueue.length - 1],
            currentTime: 0,
            duration: 0,
            isPlaying: true,
            hasStartedPlayback: true,
          });
          return;
        }

        const previousIndex = currentIndex - 1;

        if (previousIndex >= 0) {
          set({
            queue: playbackQueue,
            currentTrackId: playbackQueue[previousIndex],
            currentTime: 0,
            duration: 0,
            isPlaying: true,
            hasStartedPlayback: true,
          });
          return;
        }

        if (state.repeatMode === "all") {
          set({
            queue: playbackQueue,
            currentTrackId: playbackQueue[playbackQueue.length - 1],
            currentTime: 0,
            duration: 0,
            isPlaying: true,
            hasStartedPlayback: true,
          });
        }
      },

      createPlaylist: (name) => {
        const nextName = name.trim();

        if (!nextName) {
          return null;
        }

        const existing = get().playlists.find(
          (playlist) => playlist.name.toLowerCase() === nextName.toLowerCase(),
        );

        if (existing) {
          return existing.id;
        }

        const playlistId = createPlaylistId();

        set({
          playlists: [
            ...get().playlists,
            {
              id: playlistId,
              name: nextName,
              trackIds: [],
              createdAt: new Date().toISOString(),
            },
          ],
        });

        return playlistId;
      },

      removePlaylist: (playlistId) => {
        const playlists = get().playlists.filter((item) => item.id !== playlistId);
        const allTrackIds = get().tracks.map((track) => track.id);
        const currentTrackId = allTrackIds.includes(get().currentTrackId ?? "")
          ? get().currentTrackId
          : allTrackIds[0] ?? null;

        set({
          playlists,
          selectedPlaylistId:
            get().selectedPlaylistId === playlistId ? null : get().selectedPlaylistId,
          queue: get().selectedPlaylistId === playlistId ? allTrackIds : get().queue,
          currentTrackId,
          currentTime: 0,
          duration: 0,
        });
      },

      selectPlaylist: (playlistId) => {
        if (!playlistId) {
          const queue = get().tracks.map((track) => track.id);

          set({
            selectedPlaylistId: null,
            queue,
            currentTrackId: queue.includes(get().currentTrackId ?? "")
              ? get().currentTrackId
              : queue[0] ?? null,
            currentTime: 0,
            duration: 0,
          });
          return;
        }

        const playlist = get().playlists.find((item) => item.id === playlistId);

        if (!playlist) {
          return;
        }

        set((state) => ({
          selectedPlaylistId: playlist.id,
          queue: playlist.trackIds,
          currentTrackId: playlist.trackIds.includes(state.currentTrackId ?? "")
            ? state.currentTrackId
            : playlist.trackIds[0] ?? null,
          currentTime: 0,
          duration: 0,
          isPlaying: playlist.trackIds.length ? state.isPlaying : false,
        }));
      },

      addTrackToPlaylist: (trackId, playlistId) => {
        const playlist = get().playlists.find((item) => item.id === playlistId);

        if (!playlist || playlist.trackIds.includes(trackId)) {
          return false;
        }

        const nextTrackIds = [...playlist.trackIds, trackId];
        const playlists = get().playlists.map((item) =>
          item.id === playlistId ? { ...item, trackIds: nextTrackIds } : item,
        );

        set((state) => ({
          playlists,
          queue: state.selectedPlaylistId === playlistId ? nextTrackIds : state.queue,
          currentTrackId:
            state.selectedPlaylistId === playlistId &&
            !nextTrackIds.includes(state.currentTrackId ?? "")
              ? nextTrackIds[0] ?? null
              : state.currentTrackId,
        }));

        return true;
      },

      addTracksToPlaylist: (trackIds, playlistId) => {
        const playlist = get().playlists.find((item) => item.id === playlistId);

        if (!playlist) {
          return false;
        }

        const nextTrackIds = [
          ...playlist.trackIds,
          ...trackIds.filter((trackId) => !playlist.trackIds.includes(trackId)),
        ];

        if (nextTrackIds.length === playlist.trackIds.length) {
          return false;
        }

        const playlists = get().playlists.map((item) =>
          item.id === playlistId ? { ...item, trackIds: nextTrackIds } : item,
        );

        set((state) => ({
          playlists,
          queue: state.selectedPlaylistId === playlistId ? nextTrackIds : state.queue,
          currentTrackId:
            state.selectedPlaylistId === playlistId &&
            !nextTrackIds.includes(state.currentTrackId ?? "")
              ? nextTrackIds[0] ?? null
              : state.currentTrackId,
        }));

        return true;
      },

      removeTrackFromPlaylist: (trackId, playlistId) => {
        const playlist = get().playlists.find((item) => item.id === playlistId);

        if (!playlist) {
          return;
        }

        const nextTrackIds = playlist.trackIds.filter((id) => id !== trackId);
        const playlists = get().playlists.map((item) =>
          item.id === playlistId ? { ...item, trackIds: nextTrackIds } : item,
        );

        set((state) => {
          const isSelectedPlaylist = state.selectedPlaylistId === playlistId;
          const currentTrackRemoved =
            isSelectedPlaylist && state.currentTrackId === trackId;

          return {
            playlists,
            queue: isSelectedPlaylist ? nextTrackIds : state.queue,
            currentTrackId: currentTrackRemoved
              ? nextTrackIds[0] ?? null
              : state.currentTrackId,
            isPlaying:
              currentTrackRemoved && nextTrackIds.length === 0 ? false : state.isPlaying,
            hasStartedPlayback:
              currentTrackRemoved && nextTrackIds.length === 0
                ? false
                : state.hasStartedPlayback,
          };
        });
      },

      openDetail: () => set({ isDetailOpen: true }),
      closeDetail: () => set({ isDetailOpen: false }),
      dismissPlayback: () =>
        set({
          isPlaying: false,
          hasStartedPlayback: false,
          isDetailOpen: false,
        }),
    }),
    {
      name: "suwon-fc-chant-player",
      partialize: (state) => ({
        playlists: state.playlists,
        queue: state.queue,
        selectedPlaylistId: state.selectedPlaylistId,
        currentTrackId: state.currentTrackId,
        repeatMode: state.repeatMode,
      }),
    },
  ),
);
