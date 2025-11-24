'use client';

import { usePlayerStore } from '@/hooks/usePlayerStore';
import { useEffect, useRef } from 'react';

const PlayerProvider = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { 
    isPlaying, 
    currentSong, 
    volume, 
    play, 
    pause, 
    next, 
    setProgress, 
    setDuration,
    seekTo,
    setSeekTo
  } = usePlayerStore();

  useEffect(() => {
    if (audioRef.current && seekTo !== null) {
      audioRef.current.currentTime = seekTo;
      setSeekTo(null);
    }
  }, [seekTo, setSeekTo]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Play error:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && currentSong) {
      // In a real app, you'd use the actual URI. 
      // For this demo, we'll use a placeholder or the mock URI if valid.
      // Since we don't have real audio files, we can't really "play" anything 
      // unless we have a public URL. 
      // Let's assume the 'uri' in Song is a valid URL.
      // If it's empty in mock data, this might fail or do nothing.
      // We'll add a check.
      if (currentSong.uri) {
          audioRef.current.src = currentSong.uri;
          if (isPlaying) {
              audioRef.current.play().catch(e => console.error("Play error:", e));
          }
      }
    }
  }, [currentSong]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    const { repeatMode } = usePlayerStore.getState();
    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Play error:", e));
    } else {
      next();
    }
  };

  return (
    <audio
      ref={audioRef}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
      className="hidden"
    />
  );
};

export default PlayerProvider;
