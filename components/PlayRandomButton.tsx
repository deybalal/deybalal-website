"use client";

import React, { useState } from "react";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

export default function PlayRandomButton() {
  const [isLoading, setIsLoading] = useState(false);
  const play = usePlayerStore((state) => state.play);
  const setSong = usePlayerStore((state) => state.setSong);
  const setQueue = usePlayerStore((state) => state.setQueue);

  const handlePlayRandom = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/songs/random-play");
      if (!res.ok) {
        throw new Error("Failed to fetch random song");
      }
      const song = await res.json();

      // Clear queue and set this song as playing
      setSong(song);
      setQueue([song]);
      play();
    } catch (error) {
      console.error("Error playing random song:", error);
      toast.error("خطا در پخش آهنگ تصادفی");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePlayRandom}
      disabled={isLoading}
      className="group/btn px-8 py-4 bg-white text-black rounded-full font-bold text-base md:text-lg shadow-2xl hover:shadow-white/50 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
      همین حالا گوش دادن را شروع کنید
    </button>
  );
}
