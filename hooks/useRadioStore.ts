import { create } from "zustand";
import { usePlayerStore } from "./usePlayerStore";
import { Artist } from "@prisma/client";

export interface RadioTrack {
  id: string;
  slug: string;
  title: string;
  titleEn: string;
  artist: string;
  artistEn: string;
  coverArt: string;
  uri: string;
  duration: number;
  position: number;
  lyrics?: string | null;
  syncedLyrics?: string | null;
  artists: Artist[];
}

export interface RadioState {
  currentTrack: RadioTrack;
  nextTrack: {
    title: string;
    artist: string;
    id: string;
    coverArt: string;
    artists: Artist[];
    lyrics: string;
  } | null;
  serverTime: number;
  elapsedTime: number;
  playlistId: string;
}

interface RadioStoreState {
  state: RadioState | null;
  error: string | null;
  loading: boolean;
  setState: (state: RadioState | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  fetchRadioState: () => Promise<void>;
  fetchPreviewState: () => Promise<void>;
}

export const useRadioStore = create<RadioStoreState>((set) => ({
  state: null,
  error: null,
  loading: false,

  setState: (state) => set({ state }),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),

  fetchRadioState: async () => {
    const { isLiveRadio, setSong, setIsRadio, setSeekTo } =
      usePlayerStore.getState();
    // Only fetch if isLiveRadio is true
    if (!isLiveRadio) {
      return;
    }

    try {
      const res = await fetch("/api/radio/state");
      const data = await res.json();

      if (data.success) {
        set({ state: data.data, error: null });

        // Verify isLiveRadio is still true before affecting player
        if (!usePlayerStore.getState().isLiveRadio) {
          return;
        }

        const currentStoredSong = usePlayerStore.getState().currentSong;
        const isCurrentlyLiveRadio = usePlayerStore.getState().isLiveRadio;

        if (
          !isCurrentlyLiveRadio ||
          currentStoredSong?.id !== data.data.currentTrack.id
        ) {
          setIsRadio(true, true);
          setSong(data.data.currentTrack, true, true);

          setTimeout(() => {
            usePlayerStore
              .getState()
              .setSeekTo(data.data.currentTrack.position, "radio");
          }, 500);
        } else {
          // Drill/drift handling
          const currentProgress = usePlayerStore.getState().progress;
          const targetPos = data.data.currentTrack.position;
          if (Math.abs(currentProgress - targetPos) > 5) {
            setSeekTo(targetPos, "radio");
          }
        }
      } else {
        set({ error: data.message });
        setIsRadio(false);
      }
    } catch {
      set({ error: "خطا در برقراری ارتباط با سرور" });
    } finally {
      set({ loading: false });
    }
  },

  fetchPreviewState: async () => {
    try {
      set({ loading: true, error: null });
      const res = await fetch("/api/radio/state");
      const data = await res.json();

      if (data.success) {
        set({ state: data.data, error: null });
      } else {
        set({ error: data.message });
      }
    } catch {
      set({ error: "خطا در برقراری ارتباط با سرور" });
    } finally {
      set({ loading: false });
    }
  },
}));
