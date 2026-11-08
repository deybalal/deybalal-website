"use client";

import { usePlayerStore, TAB_ID } from "@/hooks/usePlayerStore";
import { useRadioStore } from "@/hooks/useRadioStore";
import { useEffect, useRef } from "react";
import { packRequestHash } from "@/lib/hash";
import { getAssetUrl } from "@/lib/utils";

const getPlayThreshold = (duration: number): number => {
  if (duration > 0 && duration < 30) {
    return duration * 0.8;
  }
  return 30;
};

const PlayerProvider = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSongIdRef = useRef<string | null>(null);
  const lastPlayNonceRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isIncrementingRef = useRef<boolean>(false);
  const {
    isPlaying,
    currentSong,
    volume,
    next,
    setProgress,
    setDuration,
    seekTo,
    setSeekTo,
    activeId,
    playbackDevice,
    playNonce,
    isLiveRadio,
    hasCountedPlay,
    setHasCountedPlay,
    accumulatedPlayTime,
    setAccumulatedPlayTime,
  } = usePlayerStore();

  const prevActiveIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  const incrementPlayCount = async (songId: string) => {
    try {
      const url = `/api/songs/${songId}/play`;
      const userTimeInfo = {
        localTime: new Date().toLocaleString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      const hash = await packRequestHash(url, userTimeInfo);

      await fetch(url, {
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
      lastTimeRef.current = seekTo;
      if (seekTo === 0) {
        accumulatedTimeRef.current = 0;
        setHasCountedPlay(false);
        setAccumulatedPlayTime(0);
      }
      setSeekTo(null);
    }
  }, [seekTo, setSeekTo, setHasCountedPlay, setAccumulatedPlayTime]);

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
      const currentSrc = decodeURIComponent(audio.src);
      const newSrc = decodeURIComponent(getAssetUrl(currentSong.uri));

      const isNewSong = lastSongIdRef.current !== currentSong.id;
      const isNewPlay = lastPlayNonceRef.current !== playNonce;
      const isSameSource = currentSrc === newSrc || currentSrc.endsWith(newSrc);

      if (!isSameSource || isNewSong) {
        lastSongIdRef.current = currentSong.id;
        lastPlayNonceRef.current = playNonce;

        // Reset tracking refs for the new song / initialize from saved state
        accumulatedTimeRef.current = hasCountedPlay
          ? 0
          : accumulatedPlayTime || 0;
        lastTimeRef.current = 0;
        isIncrementingRef.current = false;

        // When changing source, we must pause first if playing to prevent race conditions
        audio.pause();
        audio.src = newSrc;
        audio.load();

        if (isPlaying && activeId === TAB_ID) {
          if (typeof window !== undefined) {
            document.title = `${currentSong.title} از ${currentSong.artist} - دی بلال`;
          }
        }
      } else if (isNewPlay) {
        lastPlayNonceRef.current = playNonce;
        accumulatedTimeRef.current = 0;
        lastTimeRef.current = 0;
        isIncrementingRef.current = false;
        audio.currentTime = 0;
      }
    }

    // Always attempt to sync play/pause state
    playAudio();

    return () => {};
  }, [
    currentSong,
    isPlaying,
    activeId,
    playNonce,
    hasCountedPlay,
    accumulatedPlayTime,
  ]);

  // Sync audio time when TAKING OVER as active tab
  useEffect(() => {
    if (audioRef.current && activeId === TAB_ID) {
      // If we just became active (transitioned from null or another tab), sync our audio time to the stored progress
      if (prevActiveIdRef.current !== TAB_ID || !isInitializedRef.current) {
        const { progress } = usePlayerStore.getState();
        const audio = audioRef.current;
        const songDuration = audio.duration || currentSong?.duration || 0;
        if (progress > 0 && songDuration > 0 && progress < songDuration - 2) {
          if (Math.abs(audio.currentTime - progress) > 2) {
            audio.currentTime = progress;
            lastTimeRef.current = progress;
          }
        }
        isInitializedRef.current = true;
      }
    }
    prevActiveIdRef.current = activeId;
  }, [activeId, currentSong]);

  const handleLoadedMetadata = () => {
    if (!audioRef.current || activeId !== TAB_ID) return;
    const audio = audioRef.current;

    if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
      setDuration(audio.duration);
    }

    const { progress } = usePlayerStore.getState();
    const songDuration = audio.duration || currentSong?.duration || 0;
    if (progress > 0 && songDuration > 0 && progress < songDuration - 2) {
      if (Math.abs(audio.currentTime - progress) > 1) {
        audio.currentTime = progress;
      }
      lastTimeRef.current = progress;
    } else if (progress >= songDuration - 2 && songDuration > 0) {
      audio.currentTime = 0;
      setProgress(0);
      lastTimeRef.current = 0;
    } else {
      lastTimeRef.current = audio.currentTime;
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current || activeId !== TAB_ID) return;

    const audio = audioRef.current;
    const currentTime = audio.currentTime;
    setProgress(currentTime);

    // If audio is paused or store says not playing, never accumulate listen time or increment play count
    if (audio.paused || !isPlaying) {
      lastTimeRef.current = currentTime;
      return;
    }

    // Track active listening duration delta
    const delta = currentTime - lastTimeRef.current;
    if (delta > 0 && delta < 2) {
      accumulatedTimeRef.current += delta;
    }
    lastTimeRef.current = currentTime;

    // Check if play count threshold is met (active listen duration only)
    if (!hasCountedPlay && currentSong?.id && !isIncrementingRef.current) {
      const duration = audio.duration || currentSong.duration || 0;
      const thresholdSeconds = getPlayThreshold(duration);

      if (accumulatedTimeRef.current >= thresholdSeconds) {
        isIncrementingRef.current = true;
        setHasCountedPlay(true);
        setAccumulatedPlayTime(0);
        incrementPlayCount(currentSong.id).finally(() => {
          isIncrementingRef.current = false;
        });
      }
    }
  };

  const handleEnded = () => {
    if (activeId !== TAB_ID) return;

    const { repeatMode, currentSong, isLiveRadio } = usePlayerStore.getState();
    if (isLiveRadio) {
      useRadioStore.getState().fetchRadioState();
      return;
    }

    const audio = audioRef.current;
    const duration = audio?.duration || currentSong?.duration || 0;
    const thresholdSeconds = getPlayThreshold(duration);

    // Count play if song finishes after reaching threshold (e.g. short audio clips with threshold <= duration)
    if (
      !hasCountedPlay &&
      currentSong?.id &&
      !isIncrementingRef.current &&
      accumulatedTimeRef.current >= thresholdSeconds
    ) {
      isIncrementingRef.current = true;
      setHasCountedPlay(true);
      setAccumulatedPlayTime(0);
      incrementPlayCount(currentSong.id).finally(() => {
        isIncrementingRef.current = false;
      });
    }

    if (repeatMode === "one" && audioRef.current) {
      // Reset tracking refs for repeat one loop
      accumulatedTimeRef.current = 0;
      lastTimeRef.current = 0;
      isIncrementingRef.current = false;
      setHasCountedPlay(false);
      setAccumulatedPlayTime(0);

      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((e) => console.error("Play error:", e));
    } else {
      next(true);
    }
  };

  const handlePlay = () => {
    if (audioRef.current) {
      lastTimeRef.current = audioRef.current.currentTime;
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      lastTimeRef.current = audioRef.current.currentTime;
    }
    const { hasCountedPlay, setAccumulatedPlayTime } =
      usePlayerStore.getState();
    if (!hasCountedPlay && accumulatedTimeRef.current > 0) {
      setAccumulatedPlayTime(accumulatedTimeRef.current);
    }
  };

  const handleSeeked = () => {
    if (audioRef.current) {
      lastTimeRef.current = audioRef.current.currentTime;
    }
  };

  // Handle volume
  useEffect(() => {
    if (audioRef.current) {
      if (playbackDevice === "server") {
        audioRef.current.volume = 0;
      } else {
        audioRef.current.volume = volume / 100;
      }
    }
  }, [volume, playbackDevice]);

  // Sync state when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Only rehydrate if we are not the one currently playing to avoid race conditions with our own state
        const { activeId: currentActiveId, isPlaying: currentIsPlaying } =
          usePlayerStore.getState();
        if (currentActiveId !== TAB_ID || !currentIsPlaying) {
          usePlayerStore.persist.rehydrate();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Media Session API support (hardware media keys, lock screen controls, etc.)
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    if (currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist || "دی بلال",
        album: currentSong.album || "دی بلال",
        artwork: currentSong.coverArt
          ? [
              {
                src: currentSong.coverArt,
                sizes: "512x512",
                type: "image/jpeg",
              },
            ]
          : [],
      });
    } else {
      navigator.mediaSession.metadata = null;
    }

    navigator.mediaSession.setActionHandler("play", async () => {
      const { isPlaying, play } = usePlayerStore.getState();
      if (!isPlaying) play();
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      const { isPlaying, pause } = usePlayerStore.getState();
      if (isPlaying) pause();
    });

    navigator.mediaSession.setActionHandler("nexttrack", () => {
      if (!isLiveRadio) {
        next(true);
      }
    });

    navigator.mediaSession.setActionHandler("previoustrack", () => {
      const { prev } = usePlayerStore.getState();
      prev?.();
    });

    navigator.mediaSession.setActionHandler("stop", () => {
      const { isPlaying, pause } = usePlayerStore.getState();
      if (isPlaying) pause();
    });

    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (audioRef.current && details.seekTime !== undefined && !isLiveRadio) {
        audioRef.current.currentTime = details.seekTime;
        lastTimeRef.current = details.seekTime;
        setProgress(details.seekTime);
      }
    });
  }, [currentSong, isLiveRadio, next, setProgress]);

  // Persist listening time on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const { hasCountedPlay, setAccumulatedPlayTime } =
        usePlayerStore.getState();
      if (!hasCountedPlay && accumulatedTimeRef.current > 0) {
        setAccumulatedPlayTime(accumulatedTimeRef.current);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <audio
      ref={audioRef}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
      onPlay={handlePlay}
      onPause={handlePause}
      onSeeked={handleSeeked}
      className="hidden"
      preload="metadata"
    />
  );
};

export default PlayerProvider;
