"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { useRadioStore } from "@/hooks/useRadioStore";

export default function RadioSyncProvider() {
  const isLiveRadio = usePlayerStore((state) => state.isLiveRadio);
  const { fetchRadioState, state: radioState, setLoading } = useRadioStore();

  const syncInterval = useRef<NodeJS.Timeout | null>(null);
  const transitionTimeout = useRef<NodeJS.Timeout | null>(null);

  // Interval sync (every 30 seconds) only when isLiveRadio is true
  useEffect(() => {
    if (!isLiveRadio) {
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
  }, [isLiveRadio, fetchRadioState, setLoading]);

  // Transition timer for next track
  useEffect(() => {
    if (!isLiveRadio || !radioState?.currentTrack) {
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
        if (usePlayerStore.getState().isLiveRadio) {
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
  }, [isLiveRadio, radioState?.currentTrack, fetchRadioState]);

  return null;
}
