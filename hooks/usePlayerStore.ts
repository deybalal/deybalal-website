import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Song } from "@/types/types";

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

  play: () => void;
  pause: () => void;
  setSong: (song: Song, play?: boolean) => void;
  setQueue: (songs: Song[], startIndex?: number) => void;
  addToQueue: (song: Song) => void;
  playNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  next: () => void;
  prev: () => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  seekTo: number | null;
  setSeekTo: (time: number | null) => void;
  setActiveId: (id: string) => void;
  setDownloadPreference: (pref: number) => void;

  isShuffling: boolean;
  repeatMode: "off" | "all" | "one";
  toggleShuffle: () => void;
  setRepeatMode: (mode: "off" | "all" | "one") => void;
}

const getBestUri = (song: Song, preference: number): string => {
  if (!song.links) return song.uri;
  // Try to find exact match
  if (song.links[preference]) return song.links[preference].url;
  // Fallback to any available link
  const availableQualities = Object.keys(song.links)
    .map(Number)
    .sort((a, b) => b - a); // Higher quality first
  if (availableQualities.length > 0) {
    // Try to find the closest quality without exceeding preference if possible,
    // or just the highest available if preference is high.
    const bestMatch =
      availableQualities.find((q) => q <= preference) || availableQualities[0];
    return song.links[bestMatch].url;
  }
  return song.uri;
};

export const usePlayerStore = create<PlayerState>()(
  persist<PlayerState>(
    (set, get) => ({
      isPlaying: false,
      currentSong: null,
      queue: [],
      priorityQueue: [],
      currentIndex: -1,
      volume: 75,
      progress: 0,
      duration: 0,
      seekTo: null,
      isShuffling: false,
      repeatMode: "off",
      activeId: null,
      downloadPreference: 128,

      play: () => set({ isPlaying: true, activeId: TAB_ID }),
      pause: () => set({ isPlaying: false }),

      setSong: (song, play) => {
        const uri = getBestUri(song, get().downloadPreference);
        set({
          currentSong: { ...song, uri },
          isPlaying: play === false ? false : true,
          progress: 0,
          activeId: play === false ? get().activeId : TAB_ID,
        });
      },

      setQueue: (songs, startIndex = 0) => {
        const pref = get().downloadPreference;
        const songsWithUri = songs.map((s) => ({
          ...s,
          uri: getBestUri(s, pref),
        }));
        set({
          queue: songsWithUri,
          priorityQueue: [],
          currentIndex: startIndex,
          currentSong: songsWithUri[startIndex] || null,
          isPlaying: true,
          progress: 0,
          activeId: TAB_ID,
        });
      },

      addToQueue: (song) => {
        const uri = getBestUri(song, get().downloadPreference);
        set((state) => ({
          priorityQueue: [...state.priorityQueue, { ...song, uri }],
        }));
      },

      playNext: (song) => {
        const uri = getBestUri(song, get().downloadPreference);
        set((state) => ({
          priorityQueue: [{ ...song, uri }, ...state.priorityQueue],
        }));
      },

      removeFromQueue: (index) => {
        set((state) => ({
          priorityQueue: state.priorityQueue.filter((_, i) => i !== index),
        }));
      },

      next: () => {
        const {
          queue,
          priorityQueue,
          currentIndex,
          isShuffling,
          repeatMode,
          downloadPreference,
        } = get();

        if (priorityQueue.length > 0) {
          const nextSong = priorityQueue[0];
          const newPriorityQueue = priorityQueue.slice(1);
          set({
            currentSong: {
              ...nextSong,
              uri: getBestUri(nextSong, downloadPreference),
            },
            priorityQueue: newPriorityQueue,
            isPlaying: true,
            activeId: TAB_ID,
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
          set({
            currentIndex: nextIndex,
            currentSong: {
              ...nextSong,
              uri: getBestUri(nextSong, downloadPreference),
            },
            isPlaying: true,
            activeId: TAB_ID,
          });
        } else {
          set({ isPlaying: false });
        }
      },

      prev: () => {
        const { queue, currentIndex, downloadPreference } = get();

        if (currentIndex > 0) {
          const prevSong = queue[currentIndex - 1];
          set({
            currentIndex: currentIndex - 1,
            currentSong: {
              ...prevSong,
              uri: getBestUri(prevSong, downloadPreference),
            },
            isPlaying: true,
            activeId: TAB_ID,
          });
        }
      },

      setVolume: (volume) => set({ volume }),
      setProgress: (progress) => set({ progress }),
      setDuration: (duration) => set({ duration }),
      setSeekTo: (seekTo) => set({ seekTo }),
      setActiveId: (id) => set({ activeId: id }),
      setDownloadPreference: (downloadPreference) => {
        const { currentSong } = get();
        if (currentSong) {
          const newUri = getBestUri(currentSong, downloadPreference);
          set({
            downloadPreference,
            currentSong: { ...currentSong, uri: newUri },
          });
        } else {
          set({ downloadPreference });
        }
      },

      toggleShuffle: () =>
        set((state) => ({ isShuffling: !state.isShuffling })),
      setRepeatMode: (mode) => set({ repeatMode: mode }),
    }),
    {
      name: "player-storage",
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
          activeId: state.activeId,
          downloadPreference: state.downloadPreference,
        } as PlayerState),
    }
  )
);
