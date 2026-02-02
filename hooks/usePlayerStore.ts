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

  play: () => void;
  pause: () => void;
  setSong: (song: Song, play?: boolean) => void;
  setQueue: (songs: Song[], startIndex?: number, play?: boolean) => void;
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

const getBestUri = (
  song: Song,
  preference: number
): { uri: string; quality: number } => {
  if (!song.links) return { uri: song.uri, quality: preference }; // Assume default quality if no links
  // Try to find exact match
  if (song.links[preference])
    return { uri: song.links[preference].url, quality: preference };
  // Fallback to any available link
  const availableQualities = Object.keys(song.links)
    .map(Number)
    .sort((a, b) => b - a); // Higher quality first
  if (availableQualities.length > 0) {
    // Try to find the closest quality without exceeding preference if possible,
    // or just the highest available if preference is high.
    const bestMatch =
      availableQualities.find((q) => q <= preference) || availableQualities[0];
    return { uri: song.links[bestMatch].url, quality: bestMatch };
  }
  return { uri: song.uri, quality: preference };
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
      progress: 0,
      duration: 0,
      seekTo: null,
      isShuffling: false,
      repeatMode: "off",
      activeId: null,
      downloadPreference: 128,
      currentQuality: null,

      play: () => set({ isPlaying: true, activeId: TAB_ID }),
      pause: () => set({ isPlaying: false }),

      setSong: (song, play) => {
        const pref = get().downloadPreference;
        const { uri, quality } = getBestUri(song, pref);

        if (quality !== pref && play !== false) {
          toast.error(
            `کیفیت ${pref}k یافت نشد، در حال پخش با کیفیت ${quality}k`
          );
        }
        console.log("Song ", song);

        console.log(uri);

        set({
          currentSong: { ...song, uri },
          isPlaying: play === false ? false : true,
          progress: 0,
          duration: song.duration || 0,
          activeId: play === false ? get().activeId : TAB_ID,
        });
      },

      setQueue: (songs, startIndex = 0, play = true) => {
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
          });
        } else {
          set({ isPlaying: false });
        }
      },

      prev: () => {
        const { queue, currentIndex, downloadPreference, progress } = get();

        if (progress > 5) {
          set({
            seekTo: 0,
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
          currentQuality: state.currentQuality,
        } as PlayerState),
    }
  )
);
