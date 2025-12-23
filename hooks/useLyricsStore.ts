import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LyricsMode = "hidden" | "un-synced" | "synced";

interface LyricsState {
  lyricsMode: LyricsMode;
  setLyricsMode: (mode: LyricsMode) => void;
}

export const useLyricsStore = create<LyricsState>()(
  persist(
    (set) => ({
      lyricsMode: "synced", // Default mode
      setLyricsMode: (mode) => set({ lyricsMode: mode }),
    }),
    {
      name: "lyrics-storage",
    }
  )
);
