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
  
  isShuffling: boolean;
  repeatMode: 'off' | 'all' | 'one';
  toggleShuffle: () => void;
  setRepeatMode: (mode: 'off' | 'all' | 'one') => void;
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
      isShuffling: false,
      repeatMode: 'off',

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
        const { queue, currentIndex, isShuffling, repeatMode } = get();
        
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
          } else if (repeatMode === 'all') {
            nextIndex = 0;
          }
        }

        if (nextIndex !== -1) {
          set({ 
            currentIndex: nextIndex, 
            currentSong: queue[nextIndex],
            isPlaying: true 
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
            isPlaying: true 
          });
        }
      },

      setVolume: (volume) => set({ volume }),
      setProgress: (progress) => set({ progress }),
      setDuration: (duration) => set({ duration }),
      setSeekTo: (seekTo) => set({ seekTo }),
      
      toggleShuffle: () => set((state) => ({ isShuffling: !state.isShuffling })),
      setRepeatMode: (mode) => set({ repeatMode: mode }),
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
        isShuffling: state.isShuffling,
        repeatMode: state.repeatMode,
      }) as PlayerState,
    }
  )
);
