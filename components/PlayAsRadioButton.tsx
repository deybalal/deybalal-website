"use client";

import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { Song } from "@/types/types";
import { Radio, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "react-hot-toast";

interface PlayAsRadioButtonProps {
  songs: Song[];
  className?: string;
  variant?: "outline" | "secondary" | "ghost" | "default";
  fetchAllSongs?: () => Promise<Song[] | null>;
}

export default function PlayAsRadioButton({
  songs,
  className,
  variant = "outline",
  fetchAllSongs,
}: PlayAsRadioButtonProps) {
  const { setContextRadioQueue, isRadio, isLiveRadio } = usePlayerStore();
  const [isLoading, setIsLoading] = useState(false);

  const handlePlayRadio = async () => {
    let songsToPlay = songs;

    if (fetchAllSongs) {
      try {
        setIsLoading(true);
        const allSongs = await fetchAllSongs();
        if (allSongs && allSongs.length > 0) {
          songsToPlay = allSongs;
        }
      } catch {
        toast.error("خطا در دریافت لیست آهنگ ها");
      } finally {
        setIsLoading(false);
      }
    }

    if (songsToPlay && songsToPlay.length > 0) {
      setContextRadioQueue(songsToPlay);
    }
  };

  const isActive = isRadio && !isLiveRadio;

  return (
    <Button
      variant={variant}
      onClick={handlePlayRadio}
      disabled={isLoading}
      className={cn(
        "gap-2 rounded-full font-bold transition-all duration-300",
        isActive ? "bg-primary/20 text-primary border-primary" : "hover:scale-105",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className={cn("w-4 h-4 animate-spin")} />
      ) : (
        <Radio className={cn("w-4 h-4", isActive && "animate-pulse")} />
      )}
      پخش به عنوان رادیو
    </Button>
  );
}
