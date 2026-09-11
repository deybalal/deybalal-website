import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Song } from "@/types/types";
import { toast } from "react-hot-toast";

export const TAB_ID =
  typeof window !== "undefined"
    ? Math.random().toString(36).substring(7)
    : "server";

interface PlayerState {
  isPlaying: boolean;
  currentSong: Song | null;
  queue: Song[];
  priorityQueue: Song[]; // User-added queue
  currentIndex: number;
  volume: number;
  progress: number;
  duration: number;
  activeId: string | null;
  downloadPreference: number;
  currentQuality: number | null;
  playbackDevice: "current" | "server" | "both";
  hasHydrated: boolean;
  serverVolume: number;
  playNonce: number;

  play: () => void;
  pause: () => void;
  setSong: (song: Song, play?: boolean, isRadio?: boolean) => void;
  setQueue: (songs: Song[], startIndex?: number, play?: boolean) => void;
  addToQueue: (song: Song) => void;
  playNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  removeFromMainQueue: (index: number) => void;
  reorderPriorityQueue: (oldIndex: number, newIndex: number) => void;
  moveSongInQueue: (fromIndex: number, toIndex: number) => void;
  clearPriorityQueue: () => void;
  next: (force?: boolean) => void;
  prev: (force?: boolean) => void;
  setVolume: (volume: number) => void;
  setServerVolume: (serverVolume: number) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  seekTo: number | null;
  setSeekTo: (time: number | null, initiator?: string) => void;
  setActiveId: (id: string) => void;
  setDownloadPreference: (pref: number) => void;
  setPlaybackDevice: (device: "current" | "server" | "both") => void;
  setHasHydrated: (state: boolean) => void;
  hasCountedPlay: boolean;
  accumulatedPlayTime: number;
  setHasCountedPlay: (hasCounted: boolean) => void;
  setAccumulatedPlayTime: (time: number) => void;

  isShuffling: boolean;
  repeatMode: "off" | "all" | "one";
  toggleShuffle: () => void;
  setRepeatMode: (mode: "off" | "all" | "one") => void;
  isRadio: boolean;
  isLiveRadio: boolean;
  setIsRadio: (isRadio: boolean, isLive?: boolean) => void;
  setContextRadioQueue: (songs: Song[], startIndex?: number) => void;
  isRadioWarningOpen: boolean;
  pendingPlayAction: (() => void) | null;
  openRadioWarning: (action: () => void) => void;
  confirmPendingPlayAction: () => void;
  cancelPendingPlayAction: () => void;
}

const getBestUri = (
  song: Song,
  preference: number
): { uri: string; quality: number } => {
  if (!song.links || Object.keys(song.links).length === 0) {
    return { uri: song.uri, quality: 128 }; // Default to 128 if unknown
  }

  const links = song.links;
  const prefStr = String(preference);

  // Try exact match (JS object keys are coerced to strings, but being explicit is safer)
  if (links[prefStr]) {
    return { uri: links[prefStr].url, quality: preference };
  }

  // Fallback to closest available quality
  const availableQualities = Object.keys(links)
    .map(Number)
    .filter((n) => !isNaN(n))
    .sort((a, b) => b - a); // Higher quality first

  if (availableQualities.length > 0) {
    // Find highest quality that is <= preference
    const bestMatch =
      availableQualities.find((q) => q <= preference) ||
      availableQualities[availableQualities.length - 1]; // Fallback to lowest if all are > preference

    const matchUri = links[String(bestMatch)]?.url;
    if (matchUri) {
      return { uri: matchUri, quality: bestMatch };
    }
  }

  return { uri: song.uri, quality: 128 };
};

const sendToServerProxy = (
  payload: Record<string, unknown> | { type: string; [key: string]: unknown }
) => {
  fetch("/api/server-player", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch((e) => console.error("Server API Proxy Error:", e));
};

export const usePlayerStore = create<PlayerState>()(
  persist<PlayerState>(
    (set, get) => ({
      isPlaying: false,
      currentSong: null,
      queue: [],
      priorityQueue: [],
      currentIndex: -1,
      volume: 100,
      serverVolume: 100,
      progress: 0,
      duration: 0,
      seekTo: null,
      isShuffling: false,
      repeatMode: "off",
      activeId: null,
      downloadPreference: 128,
      currentQuality: null,
      playbackDevice: "current",
      hasHydrated: false,
      hasCountedPlay: false,
      accumulatedPlayTime: 0,
      isRadio: false,
      isLiveRadio: false,
      isRadioWarningOpen: false,
      pendingPlayAction: null,
      playNonce: 0,

      setHasCountedPlay: (hasCountedPlay) => set({ hasCountedPlay }),
      setAccumulatedPlayTime: (accumulatedPlayTime) => set({ accumulatedPlayTime }),

      openRadioWarning: (action) =>
        set({ isRadioWarningOpen: true, pendingPlayAction: action }),
      confirmPendingPlayAction: () => {
        const action = get().pendingPlayAction;
        set({
          isRadio: false,
          isLiveRadio: false,
          isRadioWarningOpen: false,
          pendingPlayAction: null,
        });
        if (action) {
          action();
        }
      },
      cancelPendingPlayAction: () =>
        set({ isRadioWarningOpen: false, pendingPlayAction: null }),

      setIsRadio: (isRadio, isLive = false) =>
        set({ isRadio, isLiveRadio: isRadio ? isLive : false }),
      setContextRadioQueue: (songs, startIndex = 0) => {
        if (get().isRadio && get().isLiveRadio) {
          get().openRadioWarning(() => {
            get().setContextRadioQueue(songs, startIndex);
          });
          return;
        }

        const pref = get().downloadPreference;
        const isShuffling = get().isShuffling;
        
        const songsWithUri = songs.map((s) => {
          const { uri } = getBestUri(s, pref);
          return { ...s, uri };
        });

        let actualStartIndex = startIndex;
        if (isShuffling && songs.length > 0 && startIndex === 0) {
          actualStartIndex = Math.floor(Math.random() * songs.length);
        }

        const currentSongData = songsWithUri[actualStartIndex] || null;

        set({
          queue: songsWithUri,
          priorityQueue: [],
          currentIndex: actualStartIndex,
          currentSong: currentSongData,
          isPlaying: true,
          progress: 0,
          duration: currentSongData?.duration || 0,
          activeId: TAB_ID,
          isRadio: true,
          isLiveRadio: false,
          playNonce: get().playNonce + 1,
          hasCountedPlay: false,
          accumulatedPlayTime: 0,
        });
      },
      setPlaybackDevice: (device) => set({ playbackDevice: device }),

      play: () => {
        const { playbackDevice } = get();
        if (playbackDevice === "server" || playbackDevice === "both") {
          sendToServerProxy({ type: "action", action: "play" });
        }
        set({ isPlaying: true, activeId: TAB_ID });
      },
      pause: () => {
        const { playbackDevice } = get();
        if (playbackDevice === "server" || playbackDevice === "both") {
          sendToServerProxy({ type: "action", action: "pause" });
        }
        set({ isPlaying: false });
      },

      setSong: (song, play, isRadioTrack) => {
        if (get().isRadio && !isRadioTrack && play !== false) {
          get().openRadioWarning(() => {
            get().setSong(song, play, false);
          });
          return;
        }

        const { playbackDevice, downloadPreference, serverVolume } = get();
        const { uri, quality } = getBestUri(song, downloadPreference);

        if (quality !== downloadPreference && play !== false) {
          toast.error(
            `کیفیت ${downloadPreference}k یافت نشد، در حال پخش با کیفیت ${quality}k`
          );
        }

        if (playbackDevice === "server" || playbackDevice === "both") {
          try {
            fetch("/api/server-player", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "play",
                filename: song.filename,
                volume: serverVolume,
              }),
            });
          } catch (error) {
            toast.error((error as Error).message);
          }

          if (!play) {
            sendToServerProxy({ type: "action", action: "pause" });
          }
        }

        set({
          currentSong: { ...song, uri },
          currentQuality: quality,
          isPlaying: play === false ? false : true,
          progress: 0,
          duration: song.duration || 0,
          activeId: play === false ? get().activeId : TAB_ID,
          isRadio: isRadioTrack ?? false,
          playNonce: get().playNonce + 1,
          hasCountedPlay: false,
          accumulatedPlayTime: 0,
        });
      },

      setQueue: (songs, startIndex = 0, play = true) => {
        if (get().isRadio && play !== false) {
          get().openRadioWarning(() => {
            get().setQueue(songs, startIndex, play);
          });
          return;
        }

        const pref = get().downloadPreference;
        const songsWithUri = songs.map((s) => {
          const { uri } = getBestUri(s, pref);
          return { ...s, uri };
        });
        const currentSongData = songsWithUri[startIndex] || null;
        let currentQuality = null;

        if (currentSongData) {
          const { quality } = getBestUri(songs[startIndex], pref);
          currentQuality = quality;
          if (quality !== pref) {
            toast.error(
              `کیفیت ${pref}k یافت نشد، در حال پخش با کیفیت ${quality}k`
            );
          }
        }

        set({
          queue: songsWithUri,
          priorityQueue: [],
          currentIndex: startIndex,
          currentSong: currentSongData,
          currentQuality,
          isPlaying: play,
          progress: 0,
          duration: currentSongData?.duration || 0,
          activeId: play ? TAB_ID : get().activeId,
          isRadio: false,
          isLiveRadio: false,
          playNonce: get().playNonce + 1,
          hasCountedPlay: false,
          accumulatedPlayTime: 0,
        });
      },

      addToQueue: (song) => {
        const { uri } = getBestUri(song, get().downloadPreference);
        set((state) => ({
          priorityQueue: [...state.priorityQueue, { ...song, uri }],
        }));
      },

      playNext: (song) => {
        const { uri } = getBestUri(song, get().downloadPreference);
        set((state) => ({
          priorityQueue: [{ ...song, uri }, ...state.priorityQueue],
        }));
      },

      removeFromQueue: (index) => {
        set((state) => ({
          priorityQueue: state.priorityQueue.filter((_, i) => i !== index),
        }));
      },

      removeFromMainQueue: (index) => {
        set((state) => {
          const newQueue = state.queue.filter((_, i) => i !== index);
          let newIndex = state.currentIndex;
          if (index < state.currentIndex) {
            newIndex--;
          } else if (index === state.currentIndex) {
            // If we remove the playing song, we might want to skip to next
            // but for now let's just adjust index or set to -1 if empty
            if (newQueue.length === 0) {
              return {
                queue: [],
                currentIndex: -1,
                currentSong: null,
                isPlaying: false,
              };
            }
          }
          return { queue: newQueue, currentIndex: newIndex };
        });
      },

      reorderPriorityQueue: (oldIndex, newIndex) => {
        set((state) => {
          const newQueue = [...state.priorityQueue];
          const [removed] = newQueue.splice(oldIndex, 1);
          newQueue.splice(newIndex, 0, removed);
          return { priorityQueue: newQueue };
        });
      },

      moveSongInQueue: (fromIndex, toIndex) => {
        set((state) => {
          const newQueue = [...state.queue];
          const [removed] = newQueue.splice(fromIndex, 1);
          newQueue.splice(toIndex, 0, removed);

          let newCurrentIndex = state.currentIndex;
          if (fromIndex === state.currentIndex) {
            newCurrentIndex = toIndex;
          } else if (
            fromIndex < state.currentIndex &&
            toIndex >= state.currentIndex
          ) {
            newCurrentIndex--;
          } else if (
            fromIndex > state.currentIndex &&
            toIndex <= state.currentIndex
          ) {
            newCurrentIndex++;
          }

          return { queue: newQueue, currentIndex: newCurrentIndex };
        });
      },

      clearPriorityQueue: () => {
        set({ priorityQueue: [] });
      },

      next: (force = false) => {
        const {
          queue,
          priorityQueue,
          currentIndex,
          isShuffling,
          repeatMode,
          downloadPreference,
          isRadio,
        } = get();

        if (isRadio && !force) return;

        if (priorityQueue.length > 0) {
          const nextSong = priorityQueue[0];
          const newPriorityQueue = priorityQueue.slice(1);
          const { uri, quality } = getBestUri(nextSong, downloadPreference);

          if (quality !== downloadPreference) {
            toast.error(
              `کیفیت ${downloadPreference}k یافت نشد، در حال پخش با کیفیت ${quality}k`
            );
          }

          set({
            currentSong: {
              ...nextSong,
              uri,
            },
            currentQuality: quality,
            priorityQueue: newPriorityQueue,
            isPlaying: true,
            progress: 0,
            duration: nextSong.duration || 0,
            activeId: TAB_ID,
            playNonce: get().playNonce + 1,
            hasCountedPlay: false,
            accumulatedPlayTime: 0,
          });
          return;
        }

        if (queue.length === 0) return;

        let nextIndex = -1;

        if (isShuffling) {
          nextIndex = Math.floor(Math.random() * queue.length);
          if (queue.length > 1 && nextIndex === currentIndex) {
            nextIndex = (nextIndex + 1) % queue.length;
          }
        } else {
          if (currentIndex < queue.length - 1) {
            nextIndex = currentIndex + 1;
          } else if (repeatMode === "all") {
            nextIndex = 0;
          }
        }

        if (nextIndex !== -1) {
          const nextSong = queue[nextIndex];
          const { uri, quality } = getBestUri(nextSong, downloadPreference);

          if (quality !== downloadPreference) {
            toast.error(
              `کیفیت ${downloadPreference}k یافت نشد، در حال پخش با کیفیت ${quality}k`
            );
          }

          set({
            currentIndex: nextIndex,
            currentSong: {
              ...nextSong,
              uri,
            },
            currentQuality: quality,
            isPlaying: true,
            progress: 0,
            duration: nextSong.duration || 0,
            activeId: TAB_ID,
            playNonce: get().playNonce + 1,
            hasCountedPlay: false,
            accumulatedPlayTime: 0,
          });
        } else {
          set({ isPlaying: false, progress: 0 });
        }
      },

      prev: (force = false) => {
        const { queue, currentIndex, downloadPreference, progress, isRadio } =
          get();

        if (isRadio && !force) return;

        if (progress > 5 || currentIndex === 0) {
          set({
            seekTo: 0,
            hasCountedPlay: false,
            accumulatedPlayTime: 0,
            playNonce: get().playNonce + 1,
          });
          return;
        }

        if (currentIndex > 0) {
          const prevSong = queue[currentIndex - 1];
          const { uri, quality } = getBestUri(prevSong, downloadPreference);

          if (quality !== downloadPreference) {
            toast.error(
              `کیفیت ${downloadPreference}k یافت نشد، در حال پخش با کیفیت ${quality}k`
            );
          }

          set({
            currentIndex: currentIndex - 1,
            currentSong: {
              ...prevSong,
              uri,
            },
            currentQuality: quality,
            isPlaying: true,
            progress: 0,
            duration: prevSong.duration || 0,
            activeId: TAB_ID,
            playNonce: get().playNonce + 1,
            hasCountedPlay: false,
            accumulatedPlayTime: 0,
          });
        }
      },

      setVolume: (volume) => {
        set({ volume });
      },
      setServerVolume: (serverVolume) => {
        const { playbackDevice } = get();
        if (playbackDevice === "server" || playbackDevice === "both") {
          sendToServerProxy({ type: "volume", volume: serverVolume });
        }
        set({ serverVolume });
      },
      setProgress: (progress) => set({ progress }),
      setDuration: (duration) => set({ duration }),
      setSeekTo: (seekTo, initiator) => {
        const { isRadio, playbackDevice } = get();
        if (isRadio && initiator !== "radio") {
          return;
        }
        if (
          seekTo !== null &&
          (playbackDevice === "server" || playbackDevice === "both")
        ) {
          sendToServerProxy({ type: "position", position: seekTo });
        }
        if (seekTo === 0) {
          set({
            seekTo,
            hasCountedPlay: false,
            accumulatedPlayTime: 0,
            playNonce: get().playNonce + 1,
          });
        } else {
          set({ seekTo });
        }
      },
      setActiveId: (id) => set({ activeId: id }),
      setDownloadPreference: (downloadPreference) => {
        const { currentSong } = get();
        if (currentSong) {
          const { uri, quality } = getBestUri(currentSong, downloadPreference);

          if (quality !== downloadPreference) {
            toast.error(
              `کیفیت ${downloadPreference}k یافت نشد، در حال پخش با کیفیت ${quality}k`
            );
          }

          set({
            downloadPreference,
            currentSong: { ...currentSong, uri },
            currentQuality: quality,
          });
        } else {
          set({ downloadPreference });
        }
      },

      toggleShuffle: () =>
        set((state) => ({ isShuffling: !state.isShuffling })),
      setRepeatMode: (mode) => set({ repeatMode: mode }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "player-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          // If progress was saved at or near the end of the song, reset to 0
          const songDuration = state.duration || state.currentSong?.duration || 0;
          if (songDuration > 0 && state.progress >= songDuration - 2) {
            state.progress = 0;
          }
          // Reset activeId to current tab on rehydration so audio events aren't ignored
          state.activeId = TAB_ID;
          state.isRadio = false;
          state.isLiveRadio = false;
          state.setHasHydrated(true);
        }
      },
      partialize: (state) =>
        ({
          volume: state.volume,
          progress: state.progress,
          queue: state.queue,
          priorityQueue: state.priorityQueue,
          duration: state.duration,
          currentSong: state.currentSong,
          currentIndex: state.currentIndex,
          isShuffling: state.isShuffling,
          repeatMode: state.repeatMode,
          // NOTE: activeId is intentionally omitted so each tab/session can claim audio control
          downloadPreference: state.downloadPreference,
          currentQuality: state.currentQuality,
          playbackDevice: state.playbackDevice,
          serverVolume: state.serverVolume,
          hasCountedPlay: state.hasCountedPlay,
          accumulatedPlayTime: state.hasCountedPlay ? 0 : state.accumulatedPlayTime,
        } as PlayerState),
    }
  )
);
