"use client";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { useEffect, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Repeat,
  Repeat1,
  Shuffle,
  Home,
  Disc,
  Mic2,
  ListMusic,
  Heart,
  User,
  Search,
  Menu,
  Settings,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DynamicDarkModeToggle from "@/components/DynamicDarkModeToggle";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import MarqueeText from "./MarqueeText";
import QueueDrawer from "./QueueDrawer";
import { NotificationCenter } from "./NotificationCenter";

const PlayerBar = () => {
  const {
    isPlaying,
    currentSong,
    volume,
    progress,
    duration,
    play,
    pause,
    next,
    prev,
    setVolume,
    setProgress,
    setSeekTo,
    isShuffling,
    repeatMode,
    toggleShuffle,
    setRepeatMode,
    downloadPreference,
    setDownloadPreference,
  } = usePlayerStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "صفحه اصلی", href: "/", icon: Home },
    { name: "جستوجو", href: "/search", icon: Search },
    { name: "حساب", href: "/panel", icon: User },
    { name: "آلبوم ها", href: "/album", icon: Disc },
    { name: "خواننده ها", href: "/artist", icon: Mic2 },
    { name: "پلی لیست ها", href: "/playlists", icon: ListMusic },
    { name: "موردعلاقه ها", href: "/favorites", icon: Heart },
    { name: "پروفایل", href: "/profile", icon: User },
  ];

  const qualities = [
    { label: "64 kbps", value: 64 },
    { label: "128 kbps", value: 128 },
    { label: "320 kbps", value: 320 },
  ];

  const togglePlay = () => {
    if (isPlaying) pause();
    else play();
  };

  const toggleRepeat = () => {
    if (repeatMode === "off") setRepeatMode("all");
    else if (repeatMode === "all") setRepeatMode("one");
    else setRepeatMode("off");
  };

  const handleSeek = (value: number[]) => {
    setSeekTo(value[0]);
    setProgress(value[0]); // Optimistic update
  };

  const handleQualityChange = async (quality: number) => {
    setDownloadPreference(quality);
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ downloadPreference: quality }),
      });
    } catch (error) {
      console.error("Failed to sync download preference:", error);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (isPlaying) pause();
        else play();
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        setVolume(Math.min(volume + 2, 100));
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        setVolume(Math.max(volume - 2, 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [volume, isPlaying, pause, play, setVolume]);

  if (!currentSong) return null; // Or return a disabled state

  return (
    <div className="fixed bottom-0 start-0 w-full h-20 md:h-24 glass z-50 px-4 md:px-8 flex items-center justify-between bg-black/40 backdrop-blur-md border-t border-white/10 transition-all duration-300">
      {/* Song Info */}
      <Link
        href={`/song/${currentSong.id}`}
        className="flex items-center flex-1 min-w-0 md:w-1/4 md:max-w-none pr-2 md:pr-0"
      >
        <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-800 rounded-md neon-box ml-3 md:ml-4 shrink-0 relative overflow-hidden">
          <Image
            src={currentSong.coverArt || "/images/cover.png"}
            alt="Cover"
            width={60}
            height={60}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="overflow-hidden flex-1">
          <MarqueeText
            text={currentSong.title || "No Title"}
            className="text-foreground font-medium text-sm md:text-base"
          />
          <MarqueeText
            text={currentSong.artist || "Unknown Artist"}
            className="text-muted-foreground text-xs md:text-sm"
          />
        </div>
      </Link>

      {/* Controls */}
      <NotificationCenter />
      <div className="flex items-center justify-end flex-none ml-2 md:ml-0 md:flex-col md:items-center md:w-1/2 md:max-w-2xl xl:max-w-3xl md:px-4 md:static md:translate-x-0">
        <div className="flex items-center gap-4 md:gap-6 mb-1 md:mb-2">
          <Button
            variant="ghost"
            size="icon"
            className={`hidden md:inline-flex hover:bg-transparent cursor-pointer ${
              repeatMode !== "off"
                ? "text-foreground"
                : "text-gray-400 hover:text-foreground"
            }`}
            onClick={toggleRepeat}
          >
            {repeatMode === "one" ? (
              <Repeat1 size={20} />
            ) : (
              <Repeat size={20} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground hover:text-gray-400 hover:bg-transparent cursor-pointer"
            onClick={next}
          >
            <SkipForward size={20} className="md:w-6 md:h-6" />
          </Button>
          <div className="relative group">
            {isPlaying && (
              <div className="absolute inset-0 rounded-full bg-indigo-500/50 animate-ping" />
            )}
            <Button
              size="icon"
              className="relative z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/40 hover:scale-110 hover:shadow-indigo-500/60 ring-2 ring-white/10 transition-all duration-300 flex items-center justify-center cursor-pointer"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="size-4 md:size-6 fill-white" />
              ) : (
                <Play className="size-4 md:size-6 fill-white" />
              )}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground hover:text-gray-400 hover:bg-transparent cursor-pointer"
            onClick={prev}
          >
            <SkipBack size={20} className="md:w-6 md:h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`hidden md:inline-flex  hover:bg-transparent cursor-pointer ${
              isShuffling
                ? "text-foreground"
                : "text-gray-400 hover:text-foreground"
            }`}
            onClick={toggleShuffle}
          >
            <Shuffle size={20} />
          </Button>
        </div>
        {/* Progress Bar */}
        <div className="w-64 md:w-full items-center gap-2 md:gap-3 text-[10px] md:text-xs text-gray-400 hidden md:flex">
          <span>{formatTime(duration || currentSong.duration)}</span>
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={duration || currentSong.duration || 100}
            step={1}
            className="w-full cursor-pointer h-1.5"
          />
          <span>{formatTime(progress)}</span>
        </div>
      </div>

      {/* Mobile Progress Bar */}
      <div className="absolute top-0 start-0 w-full md:hidden">
        <Slider
          value={[progress]}
          onValueChange={handleSeek}
          max={duration || 100}
          step={1}
          className="w-full cursor-pointer h-1 rounded-none"
        />
      </div>

      {/* Volume & Quality */}
      <div className="hidden md:flex items-center justify-end w-1/4 gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-gray-400 hover:text-white gap-1 px-2 h-8 cursor-pointer"
            >
              <Settings size={14} />
              {downloadPreference}k
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-background/95 backdrop-blur-xl border-white/10"
          >
            {qualities.map((q) => (
              <DropdownMenuItem
                key={q.value}
                onClick={() => handleQualityChange(q.value)}
                className={`cursor-pointer ${
                  downloadPreference === q.value
                    ? "text-primary font-bold"
                    : "text-muted-foreground"
                }`}
              >
                {q.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">
          <Volume2 size={20} className="text-gray-400" />
          <Slider
            value={[volume]}
            onValueChange={(v) => setVolume(v[0])}
            max={100}
            step={1}
            className="w-24 cursor-pointer"
          />
        </div>
      </div>
      <QueueDrawer />
      {/* Mobile Menu Trigger */}
      <div className="md:hidden flex items-center justify-end flex-none">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white cursor-pointer"
            >
              <Menu size={24} />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-64 bg-background/95 backdrop-blur-xl border-s border-white/10 p-0"
          >
            <SheetHeader className="p-6 border-b border-white/5">
              <SheetTitle className="text-center text-xl font-bold text-foreground">
                دی بلال
              </SheetTitle>
              <SheetDescription className="text-center text-xs text-muted-foreground">
                آهنگ لری
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col py-4">
              <div className="px-6 pb-4 border-b border-white/5">
                <p className="text-[12px] uppercase tracking-wider text-muted-foreground mb-3 text-center">
                  کیفیت پخش آنلاین
                </p>
                <div className="flex items-center justify-center gap-2">
                  {qualities.map((q) => (
                    <Button
                      key={q.value}
                      variant={
                        downloadPreference === q.value ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleQualityChange(q.value)}
                      className="text-[12px] h-7 px-2 cursor-pointer"
                    >
                      {q.label.split(" ")[0]}
                    </Button>
                  ))}
                </div>
              </div>
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-start px-6 py-4 text-gray-400 hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <item.icon className="w-5 h-5 me-4" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
              <div className="flex py-3 transition-colors duration-200 relative justify-end items-end rtl flex-row-reverse gap-4">
                <DynamicDarkModeToggle />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default PlayerBar;
