"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { useRadioStore } from "@/hooks/useRadioStore";

export default function RadioSyncProvider() {
  const isRadio = usePlayerStore((state) => state.isRadio);
  const { fetchRadioState, state: radioState, setLoading } = useRadioStore();

  const syncInterval = useRef<NodeJS.Timeout | null>(null);
  const transitionTimeout = useRef<NodeJS.Timeout | null>(null);

  // Interval sync (every 30 seconds) only when isRadio is true
  useEffect(() => {
    if (!isRadio) {
      if (syncInterval.current) {
        clearInterval(syncInterval.current);
        syncInterval.current = null;
      }
      if (transitionTimeout.current) {
        clearTimeout(transitionTimeout.current);
        transitionTimeout.current = null;
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchRadioState();

    syncInterval.current = setInterval(() => {
      fetchRadioState();
    }, 30000);

    return () => {
      if (syncInterval.current) {
        clearInterval(syncInterval.current);
        syncInterval.current = null;
      }
      if (transitionTimeout.current) {
        clearTimeout(transitionTimeout.current);
        transitionTimeout.current = null;
      }
    };
  }, [isRadio, fetchRadioState, setLoading]);

  // Transition timer for next track
  useEffect(() => {
    if (!isRadio || !radioState?.currentTrack) {
      if (transitionTimeout.current) {
        clearTimeout(transitionTimeout.current);
        transitionTimeout.current = null;
      }
      return;
    }

    if (transitionTimeout.current) {
      clearTimeout(transitionTimeout.current);
      transitionTimeout.current = null;
    }

    const { duration, position } = radioState.currentTrack;
    const remainingTime = (duration - position) * 1000;

    if (remainingTime > 0) {
      transitionTimeout.current = setTimeout(() => {
        if (usePlayerStore.getState().isRadio) {
          fetchRadioState();
        }
      }, remainingTime + 500);
    }

    return () => {
      if (transitionTimeout.current) {
        clearTimeout(transitionTimeout.current);
        transitionTimeout.current = null;
      }
    };
  }, [isRadio, radioState?.currentTrack, fetchRadioState]);

  return null;
}
