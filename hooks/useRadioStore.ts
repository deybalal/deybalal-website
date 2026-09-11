import { create } from "zustand";
import { usePlayerStore } from "./usePlayerStore";

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
}

export interface RadioState {
  currentTrack: RadioTrack;
  nextTrack: {
    title: string;
    artist: string;
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
}

export const useRadioStore = create<RadioStoreState>((set) => ({
  state: null,
  error: null,
  loading: false,

  setState: (state) => set({ state }),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),

  fetchRadioState: async () => {
    const { isRadio, setSong, setIsRadio, setSeekTo } = usePlayerStore.getState();
    // Only fetch if isRadio is true
    if (!isRadio) {
      return;
    }

    try {
      const res = await fetch("/api/radio/state");
      const data = await res.json();

      if (data.success) {
        set({ state: data.data, error: null });

        // Verify isRadio is still true before affecting player
        if (!usePlayerStore.getState().isRadio) {
          return;
        }

        const currentStoredSong = usePlayerStore.getState().currentSong;
        const isCurrentlyRadio = usePlayerStore.getState().isRadio;

        if (
          !isCurrentlyRadio ||
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
}));
