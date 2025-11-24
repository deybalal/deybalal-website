import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Song } from '@/types/types';

interface PlayerState {
  isPlaying: boolean;
  currentSong: Song | null;
  queue: Song[];
  currentIndex: number;
  volume: number;
  progress: number;
  duration: number;
  
  play: () => void;
  pause: () => void;
  setSong: (song: Song) => void;
  setQueue: (songs: Song[], startIndex?: number) => void;
  next: () => void;
  prev: () => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  seekTo: number | null;
  setSeekTo: (time: number | null) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist<PlayerState>(
    (set, get) => ({
      isPlaying: false,
      currentSong: null,
      queue: [],
      currentIndex: -1,
      volume: 75,
      progress: 0,
      duration: 0,
      seekTo: null,

      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      
      setSong: (song) => {
        set({ currentSong: song, isPlaying: true });
      },

      setQueue: (songs, startIndex = 0) => {
        set({ 
          queue: songs, 
          currentIndex: startIndex, 
          currentSong: songs[startIndex] || null,
          isPlaying: true 
        });
      },

      next: () => {
        const { queue, currentIndex } = get();
        if (currentIndex < queue.length - 1) {
          set({ 
            currentIndex: currentIndex + 1, 
            currentSong: queue[currentIndex + 1],
            isPlaying: true 
          });
        }
      },

      prev: () => {
        const { queue, currentIndex, progress } = get();
        // If more than 3 seconds in, restart song
        if (progress > 3) {
            // Logic handled by component seeking, but here we just update state if needed
            // Actually, prev usually goes to previous song. 
            // We'll let the component handle the seek-to-start logic if needed, 
            // or just go to prev song here.
        }
        
        if (currentIndex > 0) {
          set({ 
            currentIndex: currentIndex - 1, 
            currentSong: queue[currentIndex - 1],
            isPlaying: true 
          });
        }
      },

      setVolume: (volume) => set({ volume }),
      setProgress: (progress) => set({ progress }),
      setDuration: (duration) => set({ duration }),
      setSeekTo: (seekTo) => set({ seekTo }),
    }),
    {
      name: 'player-storage',
      partialize: (state) => ({
        volume: state.volume,
        progress: state.progress,
        queue: state.queue,
        duration: state.duration,
        currentSong: state.currentSong,
        currentIndex: state.currentIndex,
      }) as PlayerState,
    }
  )
);
