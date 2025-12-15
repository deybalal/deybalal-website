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

  isShuffling: boolean;
  repeatMode: "off" | "all" | "one";
  toggleShuffle: () => void;
  setRepeatMode: (mode: "off" | "all" | "one") => void;
}

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

      play: () => set({ isPlaying: true, activeId: TAB_ID }),
      pause: () => set({ isPlaying: false }),

      setSong: (song, play) => {
        set({
          currentSong: song,
          isPlaying: play === false ? false : true,
          progress: 0,
          activeId: play === false ? get().activeId : TAB_ID,
        });
      },

      setQueue: (songs, startIndex = 0) => {
        set({
          queue: songs,
          priorityQueue: [], // Clear priority queue when setting new context? Or keep it? Usually clear or keep depends on UX. Let's clear for now to avoid confusion.
          currentIndex: startIndex,
          currentSong: songs[startIndex] || null,
          isPlaying: true,
          progress: 0,
          activeId: TAB_ID,
        });
      },

      addToQueue: (song) => {
        set((state) => ({
          priorityQueue: [...state.priorityQueue, song],
        }));
      },

      playNext: (song) => {
        set((state) => ({
          priorityQueue: [song, ...state.priorityQueue],
        }));
      },

      removeFromQueue: (index) => {
        set((state) => ({
          priorityQueue: state.priorityQueue.filter((_, i) => i !== index),
        }));
      },

      next: () => {
        const { queue, priorityQueue, currentIndex, isShuffling, repeatMode } =
          get();

        // 1. Check Priority Queue
        if (priorityQueue.length > 0) {
          const nextSong = priorityQueue[0];
          const newPriorityQueue = priorityQueue.slice(1);
          set({
            currentSong: nextSong,
            priorityQueue: newPriorityQueue,
            isPlaying: true,
            activeId: TAB_ID,
          });
          return;
        }

        // 2. Check Regular Queue
        if (queue.length === 0) return;

        let nextIndex = -1;

        if (isShuffling) {
          // Simple random shuffle
          nextIndex = Math.floor(Math.random() * queue.length);
          // Try to avoid same song if queue > 1
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
          set({
            currentIndex: nextIndex,
            currentSong: queue[nextIndex],
            isPlaying: true,
            activeId: TAB_ID,
          });
        } else {
          // End of queue and not repeating
          set({ isPlaying: false });
        }
      },

      prev: () => {
        const { queue, currentIndex } = get();

        if (currentIndex > 0) {
          set({
            currentIndex: currentIndex - 1,
            currentSong: queue[currentIndex - 1],
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
        } as PlayerState),
    }
  )
);
