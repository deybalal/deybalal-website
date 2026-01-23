"use client";

import React, { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Save,
  Play,
  Pause,
  Timer,
  ArrowRight,
  LoaderPinwheel,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Song {
  id: string;
  title: string;
  artist: string;
  coverArt: string | null;
  uri: string;
  lyrics: string | null;
  syncedLyrics: string | null;
}

interface SyncedLine {
  index: number;
  time: number;
  text: string;
}

export default function SyncLyricsPage({
  params,
}: {
  params: Promise<{ songId: string }>;
}) {
  const router = useRouter();
  const { songId } = use(params);

  const {
    play,
    pause,
    setSong,
    isPlaying,
    progress,
    duration,
    setSeekTo,
    setProgress,
    setDuration,
  } = usePlayerStore();

  const [song, setSongData] = useState<Song | null>(null);
  const [lyrics, setLyrics] = useState<string[]>([]);
  const [synced, setSynced] = useState<SyncedLine[]>([]);
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch song data
  useEffect(() => {
    const fetchSong = async () => {
      try {
        const res = await fetch(`/api/songs/${songId}`);
        const data = await res.json();

        if (data.success) {
          const info = data.data;
          setSongData(info);

          // Set player song
          setSong(info, false);
          setDuration(info.duration);

          if (info.syncedLyrics) {
            // Parse LRC
            const lines = info.syncedLyrics.split("\n").filter(Boolean);
            const parsedSynced = lines.map((line: string, index: number) => {
              const match = line.match(/\[(\d+):(\d+)\.(\d+)\]\s*(.*)/);
              if (!match) return { index, time: 0, text: line };
              const minutes = parseInt(match[1], 10);
              const seconds = parseInt(match[2], 10);
              const centiseconds = parseInt(match[3], 10);
              const time = minutes * 60 + seconds + centiseconds / 100;
              const text = match[4];
              return { index, time, text };
            });

            setLyrics(parsedSynced.map((l: SyncedLine) => l.text));
            setSynced(parsedSynced);
          } else if (info.lyrics) {
            setLyrics(info.lyrics.split("\n").filter(Boolean));
            setSynced([]);
          }
        } else {
          toast.error("Failed to load song");
        }
      } catch (error) {
        console.error(error);
        toast.error("Error loading song");
      } finally {
        setLoading(false);
      }
    };

    if (songId) {
      fetchSong();
    }
  }, [songId, setSong, setDuration]);

  // Handle tapping a line to sync it
  const handleTapLine = (index: number) => {
    const text = lyrics[index];
    if (!text) return;

    const current = progress;

    setSynced((prev) => {
      const existingIndex = prev.findIndex((p) => p.index === index);
      const newEntry = { index, time: current, text };

      let newSynced;
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = newEntry;
        newSynced = copy.sort((a, b) => a.time - b.time);
      } else {
        newSynced = [...prev, newEntry].sort((a, b) => a.time - b.time);
      }
      return newSynced;
    });
  };

  // Handle saving to DB
  const handleSave = async () => {
    if (!songId || !synced.length) return;

    try {
      const sorted = [...synced].sort((a, b) => a.time - b.time);

      const lrc = sorted
        .map(({ time, text }) => {
          const minutes = Math.floor(time / 60);
          const seconds = Math.floor(time % 60);
          const centiseconds = Math.floor((time % 1) * 100);
          return `[${String(minutes).padStart(2, "0")}:${String(
            seconds
          ).padStart(2, "0")}.${String(centiseconds).padStart(
            2,
            "0"
          )}] ${text}`;
        })
        .join("\n");

      const res = await fetch(`/api/lyrics/edit/synced/${songId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncedLyrics: lrc }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Synced lyrics saved!");
        router.push("/panel");
      } else {
        toast.error("Failed to save");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving lyrics");
    }
  };

  // Seek to a specific line's time
  const handleSelectLine = (time?: number) => {
    if (time === undefined) return;
    setSeekTo(time);
    const newSynced = synced.filter((c) => c.time <= time);
    setSynced(newSynced);
    setProgress(time); // Optimistic update
  };

  const handleSeek = (value: number[]) => {
    setSeekTo(value[0]);
    setProgress(value[0]);
  };

  // Auto-scroll to active line
  useEffect(() => {
    if (!scrollRef.current) return;

    // Find the currently active line index based on progress
    // This is a simple implementation, could be optimized
    const activeLineIndex = synced.reduce((prev, curr, idx) => {
      return curr.time <= progress ? idx : prev;
    }, -1);

    if (activeLineIndex !== -1) {
      const element = document.getElementById(`line-${activeLineIndex}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [progress, synced]);

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center">
        <p className="animate-spin">
          <LoaderPinwheel size={60} />
        </p>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        Song not found
      </div>
    );
  }

  return (
    <div className="fixed inset-0 md:ml-20 z-60 flex flex-col bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-black/50 backdrop-blur-md z-10 border-b border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-white hover:bg-white/10 cursor-pointer"
        >
          <ArrowLeft size={24} />
        </Button>
        <h1 className="text-lg font-bold">Sync Lyrics</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSave}
          className="text-green-400 hover:bg-green-500/10 hover:text-green-300 cursor-pointer"
        >
          <Save size={30} />
        </Button>
      </header>
      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row pb-32">
        {/* Left Side: Cover & Info (Desktop) */}
        <div className="hidden md:flex flex-col items-center justify-center w-1/3 p-8 border-r border-white/10 bg-zinc-900/50">
          <div className="relative w-64 h-64 rounded-2xl overflow-hidden shadow-2xl shadow-black border border-white/10 mb-6">
            <Image
              src={song.coverArt || "/images/cover.png"}
              alt={song.title}
              fill
              className="object-cover"
            />
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">{song.title}</h2>
          <p className="text-gray-400 text-center">{song.artist}</p>
        </div>

        {/* Right Side: Lyrics List */}
        <div
          className="flex-1 relative overflow-y-auto custom-scrollbar"
          ref={scrollRef}
        >
          {/* Mobile Cover (Small) */}
          <div className="md:hidden flex items-center p-4 border-b border-white/5 bg-zinc-900/30">
            <div className="relative w-12 h-12 rounded-md overflow-hidden mr-3">
              <Image
                src={song.coverArt || "/images/cover.png"}
                alt="Cover"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="font-bold text-sm">{song.title}</h3>
              <p className="text-xs text-gray-400">{song.artist}</p>
            </div>
          </div>

          <div className="p-4 pb-48 space-y-2">
            {lyrics.map((line, index) => {
              const syncedEntry = synced.find((e) => e.index === index);
              const isSynced = !!syncedEntry;
              const isActive =
                syncedEntry &&
                progress >= syncedEntry.time &&
                (!synced[synced.indexOf(syncedEntry) + 1] ||
                  progress < synced[synced.indexOf(syncedEntry) + 1].time);

              return (
                <div
                  key={index}
                  id={`line-${index}`}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border transform ${
                    isSynced
                      ? "bg-green-900/20 border-green-500/30"
                      : "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800"
                  } ${isActive ? "ring-2 ring-green-500 scale-[1.02]" : ""}`}
                  onClick={() => handleSelectLine(syncedEntry?.time)}
                >
                  <div className="flex justify-between items-center gap-4">
                    <p
                      className={`text-lg font-medium leading-relaxed transition-all duration-200 ${
                        isSynced ? "text-green-400" : "text-gray-300"
                      } ${isActive ? "text-white scale-105 origin-left" : ""}`}
                    >
                      {line}
                    </p>
                    {isSynced && (
                      <span className="text-xs font-mono text-green-500/70 whitespace-nowrap bg-black/30 px-2 py-1 rounded">
                        {formatTime(syncedEntry.time)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Floating Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 p-4 pb-8 md:pb-4 z-50">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          {/* Progress Bar */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="w-10">{formatTime(duration)}</span>
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={duration || 100}
              step={0.1}
              className="flex-1 h-2"
            />
            <span className="w-10 text-right">{formatTime(progress)}</span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-6 md:gap-10 relative">
            {/* Save Button (Mobile/Desktop Quick Access) */}
            <Button
              size="icon"
              className="rounded-full w-12 h-12 bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20"
              onClick={handleSave}
            >
              <Save size={20} />
            </Button>

            {/* Playback Controls */}
            <div className="flex items-center gap-4 bg-zinc-900/80 rounded-full px-6 py-2 border border-white/5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSeekTo(progress + 5)}
                className="text-gray-300 hover:text-white flex flex-col items-center justify-center size-10 p-1 cursor-pointer"
              >
                <ArrowRight size={20} />
                <span className="text-xs m-0 p-0">5s</span>
              </Button>

              <Button
                size="icon"
                className="rounded-full w-14 h-14 bg-white text-black hover:bg-gray-200 hover:scale-105 transition-all"
                onClick={isPlaying ? pause : play}
              >
                {isPlaying ? (
                  <Pause size={24} fill="currentColor" />
                ) : (
                  <Play size={24} fill="currentColor" className="ml-1" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSeekTo(progress - 5)}
                className="text-gray-300 hover:text-white flex flex-col items-center justify-center size-10 p-1 cursor-pointer"
              >
                <ArrowLeft size={20} />
                <span className="text-xs m-0 p-0">5s</span>
              </Button>
            </div>

            {/* Sync Button */}
            <Button
              size="icon"
              className="rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
              onClick={() => {
                // Find first unsynced line or just next line
                const nextIndex =
                  synced.length < lyrics.length
                    ? synced.length
                    : synced.length === lyrics.length
                    ? 0
                    : lyrics.length - 1;
                handleTapLine(nextIndex);
              }}
            >
              <Timer size={20} />
            </Button>
          </div>

          <div className="text-center text-base text-zinc-500 font-mono">
            Current Time: {progress.toFixed(2)}s | {formatTime(progress)}
          </div>
        </div>
      </div>
    </div>
  );
}
