"use client";

import { usePlayerStore, TAB_ID } from "@/hooks/usePlayerStore";
import { useEffect, useRef } from "react";

const PlayerProvider = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    isPlaying,
    currentSong,
    volume,
    next,
    setProgress,
    // setDuration,
    seekTo,
    setSeekTo,
    activeId,
  } = usePlayerStore();

  const incrementPlayCount = (songId: string) => {
    fetch(`/api/songs/${songId}/play`, { method: "POST" }).catch((e) =>
      console.error("Failed to increment play count:", e)
    );
  };

  // Handle seeking
  useEffect(() => {
    if (audioRef.current && seekTo !== null) {
      audioRef.current.currentTime = seekTo;
      setSeekTo(null);
    }
  }, [seekTo, setSeekTo]);

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && activeId === TAB_ID) {
        audioRef.current.play().catch((e) => console.error("Play error:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, activeId]);

  // Handle volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Handle song source changes
  useEffect(() => {
    if (audioRef.current && currentSong?.uri) {
      // Only update src if it's different to avoid resetting progress
      // We check against the current src (which might be a full URL)
      const currentSrc = audioRef.current.src;
      const newSrc = currentSong.uri;

      // Simple check: if the src ends with the uri (handling relative/absolute)
      // or if they are exactly equal.
      const isSameSource = currentSrc === newSrc || currentSrc.endsWith(newSrc);

      if (!isSameSource) {
        audioRef.current.src = newSrc;
        // If we are the active tab and supposed to be playing, play the new track
        if (isPlaying && activeId === TAB_ID) {
          audioRef.current.play().catch((e) => console.error("Play error:", e));

          // Increment play count
          incrementPlayCount(currentSong.id);
        }
      }
    }
  }, [currentSong, activeId, isPlaying]);

  // Sync audio time when becoming active
  useEffect(() => {
    if (audioRef.current && activeId === TAB_ID) {
      // If we just became active, sync our audio time to the stored progress
      // to ensure we pick up where the other tab left off.
      const { progress } = usePlayerStore.getState();
      // Only sync if difference is significant (> 2 seconds) to avoid glitches
      if (Math.abs(audioRef.current.currentTime - progress) > 2) {
        audioRef.current.currentTime = progress;
      }
    }
  }, [activeId]);

  const handleTimeUpdate = () => {
    if (audioRef.current && activeId === TAB_ID) {
      setProgress(audioRef.current.currentTime);
    }
  };

  // const handleLoadedMetadata = () => {
  //   console.log("audioRef.current ", audioRef.current);
  //   console.log("activeId ", activeId);
  //   console.log("TAB_ID ", TAB_ID);

  //   if (audioRef.current && activeId === TAB_ID) {
  //     setDuration(audioRef.current.duration);
  //   }
  // };

  const handleEnded = () => {
    if (activeId !== TAB_ID) return;

    const { repeatMode, currentSong } = usePlayerStore.getState();
    if (repeatMode === "one" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((e) => console.error("Play error:", e));
      if (currentSong && currentSong.id) {
        incrementPlayCount(currentSong.id);
      }
    } else {
      next();
    }
  };

  // Sync state when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        usePlayerStore.persist.rehydrate();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <audio
      ref={audioRef}
      onTimeUpdate={handleTimeUpdate}
      // onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
      className="hidden"
    />
  );
};

export default PlayerProvider;
