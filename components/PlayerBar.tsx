"use client";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { useEffect, useState, useCallback } from "react";
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
  Radio,
  Speaker,
  Smartphone,
  Cast,
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
    currentQuality,
    setSong,
    setQueue,
    hasHydrated,
    isRadio,
    isLiveRadio,
    playbackDevice,
    setPlaybackDevice,
    serverVolume,
    setServerVolume,
  } = usePlayerStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(100);

  const navItems = [
    { name: "صفحه اصلی", href: "/", icon: Home },
    { name: "رادیو", href: "/radio", icon: Radio },
    { name: "جستوجو", href: "/search", icon: Search },
    { name: "حساب کاربری", href: "/panel", icon: User },
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

  const devicesList = [
    { label: "دستگاه فعلی", value: "current", icon: Smartphone },
    { label: "سرور", value: "server", icon: Speaker },
    { label: "هردو", value: "both", icon: Cast },
  ];
  const activeDevice =
    devicesList.find((d) => d.value === playbackDevice) || devicesList[0];
  const DeviceIcon = activeDevice.icon;

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const toggleRepeat = useCallback(() => {
    if (repeatMode === "off") setRepeatMode("all");
    else if (repeatMode === "all") setRepeatMode("one");
    else setRepeatMode("off");
  }, [repeatMode, setRepeatMode]);

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

      const code = e.code;
      const shiftKey = e.shiftKey;

      if (code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (code === "ArrowUp") {
        e.preventDefault();
        setVolume(Math.min(volume + 1, 100));
      } else if (code === "ArrowDown") {
        e.preventDefault();
        setVolume(Math.max(volume - 1, 0));
      } else if (code === "ArrowRight") {
        e.preventDefault();
        if (shiftKey) {
          if (!isRadio) next();
        } else {
          if (!isRadio) {
            setSeekTo(progress + 5);
            setProgress(progress + 5);
          }
        }
      } else if (code === "ArrowLeft") {
        e.preventDefault();
        if (shiftKey) {
          if (!isRadio) prev();
        } else {
          if (!isRadio) {
            setSeekTo(progress - 5);
            setProgress(progress - 5);
          }
        }
      } else if (code === "KeyM") {
        e.preventDefault();
        if (volume > 0) {
          setPreviousVolume(volume);
          setVolume(0);
        } else {
          setVolume(previousVolume > 0 ? previousVolume : 100);
        }
      } else if (code === "KeyS") {
        e.preventDefault();
        toggleShuffle();
      } else if (code === "KeyR") {
        e.preventDefault();
        toggleRepeat();
      } else if (code === "KeyL") {
        e.preventDefault();
        toggleRepeat();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    volume,
    previousVolume,
    isPlaying,
    progress,
    togglePlay,
    setVolume,
    setSeekTo,
    setProgress,
    next,
    prev,
    toggleShuffle,
    toggleRepeat,
    isRadio,
  ]);

  useEffect(() => {
    const prefetchRandomSong = async () => {
      if (!hasHydrated) return;

      if (!currentSong) {
        try {
          const res = await fetch("/api/songs/random-play");
          if (res.ok) {
            const song = await res.json();
            setSong(song, false);
            setQueue([song], 0, false);
          }
        } catch (error) {
          console.error("Failed to prefetch random song:", error);
        }
      }
    };

    prefetchRandomSong();
  }, [currentSong, setSong, setQueue, hasHydrated]);

  if (!currentSong) return null; // Or return a disabled state

  const changeVolumeWithMouseWheel = async (
    action: "decrease" | "increase"
  ) => {
    const currentVolume = volume;
    const newVolume =
      action === "decrease"
        ? Math.max(0, currentVolume - 1)
        : Math.min(currentVolume + 1, 100);
    setVolume(newVolume);
  };

  const changeProgressWithMouseWheel = async (
    action: "decrease" | "increase"
  ) => {
    const currentProgress = progress;
    const newProgress =
      action === "decrease"
        ? Math.max(0, currentProgress - 5)
        : Math.min(currentProgress + 5, duration);
    setSeekTo(newProgress);
    setProgress(newProgress);
  };

  return (
    <div className="fixed flex justify-between items-center bottom-0 start-0 w-full h-20 md:h-24 glass z-50 px-4 md:px-8 bg-black/40 backdrop-blur-lg border-t border-white/10 transition-all duration-300">
      <div className="flex flex-col items-center w-full">
        <div className="flex w-full flex-nowrap items-center justify-between gap-1 md:justify-around md:gap-0">
          {/* Song Info */}
          <Link
            href={`/song/${currentSong.id}`}
            className="flex items-center shrink-0 md:flex-1 min-w-0 md:w-1/4 md:max-w-none pr-1 md:pr-0"
          >
            <div className="w-10 h-10 md:w-14 md:h-14 bg-gray-800 rounded-md neon-box ml-2 md:ml-4 shrink-0 relative overflow-hidden">
              <Image
                src={currentSong.coverArt || "/images/cover.png"}
                alt="Cover"
                width={60}
                height={60}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="overflow-hidden flex-1 hidden md:flex flex-col">
              <MarqueeText
                text={currentSong.title || "بدون عنوان"}
                className="text-foreground font-medium text-sm md:text-base"
              />
              <MarqueeText
                text={currentSong.artist || "خواننده ناشناس"}
                className="text-muted-foreground text-xs md:text-sm"
              />
            </div>
          </Link>

          {/* Controls */}
          <div className="shrink-0">
            <NotificationCenter />
          </div>
          <div className="flex items-center justify-end flex-none ml-2 md:ml-0 md:flex-col md:items-center md:w-1/2 md:max-w-2xl xl:max-w-3xl md:px-4 md:static md:translate-x-0">
            <div className="flex items-center gap-2 md:gap-6 mb-1 md:mb-2">
              <Button
                variant="ghost"
                size="icon"
                className={`hidden md:inline-flex hover:bg-transparent cursor-pointer ${
                  repeatMode !== "off"
                    ? "text-foreground"
                    : "text-gray-400 hover:text-foreground"
                }`}
                onClick={toggleRepeat}
                disabled={isLiveRadio}
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
                className={`${
                  isRadio
                    ? "opacity-20 cursor-not-allowed"
                    : "text-foreground hover:text-gray-400 hover:bg-transparent cursor-pointer"
                }`}
                onClick={() => next()}
                disabled={isRadio}
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
                className={`${
                  isRadio
                    ? "opacity-20 cursor-not-allowed"
                    : "text-foreground hover:text-gray-400 hover:bg-transparent cursor-pointer"
                }`}
                onClick={() => prev()}
                disabled={isRadio}
              >
                <SkipBack size={20} className="md:w-6 md:h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`hidden md:inline-flex hover:bg-transparent cursor-pointer ${
                  isShuffling
                    ? "text-foreground"
                    : "text-gray-400 hover:text-foreground"
                }`}
                onClick={toggleShuffle}
                disabled={isLiveRadio}
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
                onWheel={(v) =>
                  changeProgressWithMouseWheel(
                    v.deltaY > 0 ? "decrease" : "increase"
                  )
                }
                max={duration || currentSong.duration || 100}
                step={1}
                className={`w-full h-1.5 ${
                  isRadio ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                }`}
                disabled={isRadio}
              />
              <span>{formatTime(progress)}</span>
            </div>
          </div>

          {/* Mobile Progress Bar */}
          <div className="absolute -top-1 start-0 w-full md:hidden">
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={duration || currentSong?.duration || 100}
              step={1}
              className={`w-full h-1 rounded-none ${
                isRadio
                  ? "cursor-not-allowed opacity-50 pointer-events-none"
                  : "cursor-pointer"
              }`}
              disabled={isRadio}
            />
          </div>

          {/* Volume & Quality & Device */}
          <div className="hidden md:flex items-center justify-end w-1/4 gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-bold text-gray-400 hover:text-white gap-1 px-2 h-8 cursor-pointer"
                >
                  <DeviceIcon size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-background/95 backdrop-blur-xl border-white/10"
              >
                {devicesList.map((d) => (
                  <DropdownMenuItem
                    key={d.value}
                    onClick={() =>
                      setPlaybackDevice(
                        d.value as "current" | "server" | "both"
                      )
                    }
                    className={`cursor-pointer ${
                      playbackDevice === d.value
                        ? "text-primary font-bold"
                        : "text-muted-foreground"
                    }`}
                  >
                    <d.icon size={14} className="mr-2" />
                    {d.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-bold text-gray-400 hover:text-white gap-1 px-2 h-8 cursor-pointer"
                >
                  <Settings size={14} />
                  {currentQuality && currentQuality !== downloadPreference
                    ? `${currentQuality}k (${downloadPreference}k)`
                    : `${downloadPreference}k`}
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

            <div className="flex items-center gap-2 relative group">
              <Volume2 size={20} className="text-gray-400" />
              <Slider
                value={[volume]}
                onValueChange={(v) => setVolume(v[0])}
                onWheel={(v) =>
                  changeVolumeWithMouseWheel(
                    v.deltaY > 0 ? "decrease" : "increase"
                  )
                }
                max={100}
                step={1}
                className="w-24 cursor-pointer"
              />
              {(playbackDevice === "server" || playbackDevice === "both") && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center bg-background/95 backdrop-blur-xl border border-white/10 p-2 rounded-lg shadow-xl pb-4">
                  <span className="text-xs text-muted-foreground mb-3 whitespace-nowrap">
                    ولوم سرور
                  </span>
                  <Slider
                    orientation="vertical"
                    value={[serverVolume]}
                    onValueChange={(v) => setServerVolume(v[0])}
                    max={100}
                    step={1}
                    className="h-24 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0">
            <QueueDrawer />
          </div>
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
                    <div className="flex items-center justify-center gap-2 mb-4">
                      {qualities.map((q) => (
                        <Button
                          key={q.value}
                          variant={
                            downloadPreference === q.value
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => handleQualityChange(q.value)}
                          className="text-[12px] h-7 px-2 cursor-pointer"
                        >
                          {q.label.split(" ")[0]}
                        </Button>
                      ))}
                    </div>

                    <p className="text-[12px] uppercase tracking-wider text-muted-foreground mb-3 text-center">
                      دستگاه پخش
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      {devicesList.map((d) => (
                        <Button
                          key={d.value}
                          variant={
                            playbackDevice === d.value ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            setPlaybackDevice(
                              d.value as "current" | "server" | "both"
                            )
                          }
                          className="text-[12px] h-7 px-2 cursor-pointer flex gap-1 items-center"
                        >
                          <d.icon size={12} />
                          {d.label}
                        </Button>
                      ))}
                    </div>

                    {(playbackDevice === "server" ||
                      playbackDevice === "both") && (
                      <div className="mt-4 flex flex-col items-center">
                        <p className="text-[12px] uppercase tracking-wider text-muted-foreground mb-3 text-center">
                          ولوم سرور
                        </p>
                        <div className="w-full px-4 flex items-center gap-3">
                          <Volume2 size={16} className="text-gray-400" />
                          <Slider
                            value={[serverVolume]}
                            onValueChange={(v) => setServerVolume(v[0])}
                            max={100}
                            step={1}
                            className="flex-1 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                    <p className="text-[12px] uppercase tracking-wider text-muted-foreground mb-3 mt-4 text-center">
                      حالت پخش
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant={repeatMode !== "off" ? "default" : "outline"}
                        size="sm"
                        onClick={toggleRepeat}
                        disabled={isLiveRadio}
                        className="text-[12px] h-7 px-3 cursor-pointer flex gap-1 items-center"
                      >
                        {repeatMode === "one" ? (
                          <Repeat1 size={12} />
                        ) : (
                          <Repeat size={12} />
                        )}
                        {repeatMode === "off"
                          ? "تکرار خاموش"
                          : repeatMode === "all"
                          ? "تکرار همه"
                          : "تکرار یکی"}
                      </Button>
                      <Button
                        variant={isShuffling ? "default" : "outline"}
                        size="sm"
                        onClick={toggleShuffle}
                        disabled={isLiveRadio}
                        className="text-[12px] h-7 px-3 cursor-pointer flex gap-1 items-center"
                      >
                        <Shuffle size={12} />
                        پخش تصادفی
                      </Button>
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
        <div className="flex md:hidden justify-center items-center w-full gap-2 px-2 md:px-0 max-w-full">
          <span className="text-[12px] md:text-xs font-medium text-muted-foreground w-10 tabular-nums shrink-0 text-left">
            {formatTime(duration || currentSong.duration)}
          </span>

          <div className="flex w-full items-center gap-x-1.5 justify-center min-w-0 flex-1 md:flex-none">
            <MarqueeText
              text={currentSong.title || "بدون عنوان"}
              className="text-foreground font-medium text-sm w-1/2 max-w-min"
            />
            <span className="text-foreground/50 text-[12px]">از</span>
            <MarqueeText
              text={currentSong.artist || "خواننده ناشناس"}
              className="text-foreground/80 text-xs w-1/2 max-w-min"
            />
          </div>
          <span className="text-[12px] md:text-xs font-medium text-muted-foreground w-10 tabular-nums shrink-0 text-right">
            {formatTime(progress)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlayerBar;
