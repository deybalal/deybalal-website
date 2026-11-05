"use client";

import { usePlayerStore, TAB_ID } from "@/hooks/usePlayerStore";
import { useEffect, useRef } from "react";
import { packRequestHash } from "@/lib/hash";

const PlayerProvider = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSongIdRef = useRef<string | null>(null);
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

  const incrementPlayCount = async (songId: string) => {
    try {
      const url = `/api/songs/${songId}/play`;
      const userTimeInfo = {
        localTime: new Date().toLocaleString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      const hash = await packRequestHash(url, userTimeInfo);

      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hash,
        }),
      }).catch((e) => console.error("Failed to increment play count:", e));
    } catch (error) {
      console.error("Failed to generate hash for play count:", error);
    }
  };

  // Handle seeking
  useEffect(() => {
    if (audioRef.current && seekTo !== null) {
      audioRef.current.currentTime = seekTo;
      setSeekTo(null);
    }
  }, [seekTo, setSeekTo]);

  // Consolidated Audio Logic: Handles Source changes and Play/Pause
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    const playAudio = async () => {
      try {
        if (isPlaying && activeId === TAB_ID) {
          // If the audio is already playing, calling play() is fine and doesn't cause harm.
          await audio.play().catch((e) => console.error("Play error:", e));
        } else {
          audio.pause();
        }
      } catch (e: unknown) {
        // Ignore AbortError: usually caused by a new load request or manual pause
        if (e instanceof Error && e.name !== "AbortError") {
          console.error("Play error:", e);
        }
      }
    };

    if (currentSong?.uri) {
      const currentSrc = audio.src;
      const newSrc = currentSong.uri;
      const isNewSong = lastSongIdRef.current !== currentSong.id;
      const isSameSource = currentSrc === newSrc || currentSrc.endsWith(newSrc);

      if (!isSameSource || isNewSong) {
        console.log(
          `[Player] Swapping source to ${newSrc} (IsNewSong: ${isNewSong})`
        );
        lastSongIdRef.current = currentSong.id;

        // When changing source, we must pause first if playing to prevent race conditions
        audio.pause();
        audio.src = newSrc;
        audio.load();

        if (isPlaying && activeId === TAB_ID) {
          incrementPlayCount(currentSong.id);
        }
      }
    }

    // Always attempt to sync play/pause state
    playAudio();

    return () => {};
  }, [currentSong, isPlaying, activeId]);

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

    const { repeatMode, currentSong, isRadio } = usePlayerStore.getState();
    if (isRadio) return;

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

  // Handle volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

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
      preload="metadata"
    />
  );
};

export default PlayerProvider;
