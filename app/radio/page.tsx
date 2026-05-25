"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { useLyricsStore } from "@/hooks/useLyricsStore";
import { formatTime } from "@/lib/utils";
import Image from "next/image";
import {
  Music,
  Radio as RadioIcon,
  AlertCircle,
  Loader2,
  Mic2,
  FileText,
  EyeOff,
  Heart,
  ListPlus,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Lyrics from "@/components/Lyrics";
import { LyricsMode } from "@/hooks/useLyricsStore";
import { toast } from "react-hot-toast";
import AddToPlaylistDialog from "@/components/AddToPlaylistDialog";
import MarqueeText from "@/components/MarqueeText";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RadioState {
  currentTrack: {
    id: string;
    slug: string;
    title: string;
    titleEn: string;
    artist: string;
    artistEn: string;
    coverArt: string;
    uri: string;
    duration: number;
    position: number;
    lyrics?: string | null;
    syncedLyrics?: string | null;
  };
  nextTrack: {
    title: string;
    artist: string;
  } | null;
  serverTime: number;
  elapsedTime: number;
  playlistId: string;
}

export default function RadioPage() {
  const [state, setState] = useState<RadioState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLyricsOverlay, setShowLyricsOverlay] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const router = useRouter();

  const { setSong, setIsRadio, isPlaying, setSeekTo, pause, play, isRadio } =
    usePlayerStore();
  const { lyricsMode, setLyricsMode } = useLyricsStore();
  const syncInterval = useRef<NodeJS.Timeout | null>(null);
  const transitionTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/radio/state");
      const data = await res.json();

      if (data.success) {
        setState(data.data);
        setError(null);
        if (!isRadio) {
          return;
        }
        const currentStoredSong = usePlayerStore.getState().currentSong;
        const isCurrentlyRadio = usePlayerStore.getState().isRadio;

        if (
          !isCurrentlyRadio ||
          currentStoredSong?.id !== data.data.currentTrack.id
        ) {
          setIsRadio(true, true);
          setSong(data.data.currentTrack, true, true);

          if (
            (data.data.currentTrack.syncedLyrics ||
              data.data.currentTrack.lyrics) &&
            lyricsMode !== "hidden"
          ) {
            setShowLyricsOverlay(true);
          }

          // Wait for player to init
          setTimeout(() => {
            usePlayerStore
              .getState()
              .setSeekTo(data.data.currentTrack.position, "radio");
          }, 500);
        } else {
          // Drill handling
          const currentProgress = usePlayerStore.getState().progress;
          const targetPos = data.data.currentTrack.position;
          if (Math.abs(currentProgress - targetPos) > 5) {
            setSeekTo(targetPos, "radio");
          }
        }

        // Set up transition timer
        if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
        const remainingTime =
          (data.data.currentTrack.duration - data.data.currentTrack.position) *
          1000;
        if (remainingTime > 0) {
          transitionTimeout.current = setTimeout(() => {
            fetchState();
          }, remainingTime + 500); // Add a small buffer
        }
      } else {
        setError(data.message);
        setIsRadio(false);
      }
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }, [isRadio, setIsRadio, setSong, lyricsMode, setSeekTo]);

  useEffect(() => {
    fetchState();
    syncInterval.current = setInterval(fetchState, 30000);

    return () => {
      if (syncInterval.current) clearInterval(syncInterval.current);
      if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
    };
  }, [fetchState]);

  // Intercept navigation
  useEffect(() => {
    if (!isRadio) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      // Check if it's a valid internal link
      if (anchor && anchor.href && !anchor.target) {
        const href = anchor.getAttribute("href");
        if (
          href &&
          !href.startsWith("http") &&
          !href.includes("/radio") &&
          !href.includes("/radio/history/today")
        ) {
          e.preventDefault();
          e.stopPropagation();
          setPendingPath(href);
          setShowWarningDialog(true);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, [isRadio]);

  // Check if song is in favorites
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const res = await fetch("/api/favorites/isfavorite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ songId: state?.currentTrack.id }),
        });
        const data = await res.json();
        if (data.success && data.isFavorite) {
          setIsFavorite(true);
        } else {
          setIsFavorite(false);
        }
      } catch (error) {
        console.error("Failed to check favorite status", error);
      }
    };

    checkFavoriteStatus();
  }, [state?.currentTrack.id]);

  // Update page title
  useEffect(() => {
    if (typeof window !== undefined) {
      document.title = `${state?.currentTrack.title} از ${state?.currentTrack.artist} - رادیو لری دی بلال`;
    }
  }, [
    state?.currentTrack.artist,
    state?.currentTrack.id,
    state?.currentTrack.title,
  ]);

  const toggleFavorite = async () => {
    if (isTogglingFavorite) return;

    setIsTogglingFavorite(true);
    try {
      const endpoint = isFavorite
        ? "/api/favorites/remove-song"
        : "/api/favorites/add-song";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: state?.currentTrack.id }),
      });

      const result = await res.json();

      if (result.success) {
        setIsFavorite(!isFavorite);
        toast.success(
          isFavorite ? "از علاقه مندی ها حذف شد" : "به علاقه مندی ها اضافه شد"
        );
      } else {
        toast.error(result.message || "خطا در بروزرسانی علاقه مندی ها");
      }
    } catch (error) {
      console.error("Failed to toggle favorite", error);
      toast.error("خطا در بروزرسانی علاقه مندی ها");
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">در حال بارگذاری رادیو...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full text-center px-4">
        <div className="bg-destructive/10 p-6 rounded-full mb-6">
          <AlertCircle className="w-16 h-16 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">رادیو فعلاً در دسترس نیست</h1>
        <p className="text-muted-foreground max-w-md mx-auto">{error}</p>
        <Button
          onClick={() => fetchState()}
          className="mt-8 px-8 bg-primary hover:bg-primary/90"
        >
          تلاش مجدد
        </Button>
      </div>
    );
  }

  const hasSynced = !!state?.currentTrack.syncedLyrics;
  const hasPlain = !!state?.currentTrack.lyrics;
  const anyLyrics = hasSynced || hasPlain;

  // Decide what to show based on lyricsMode
  // Enhanced Lyrics Logic
  const displayLrc =
    lyricsMode === "synced" ? state?.currentTrack.syncedLyrics : null;
  const displayPlain =
    lyricsMode === "un-synced"
      ? state?.currentTrack.lyrics || state?.currentTrack.syncedLyrics
      : lyricsMode === "synced" && !state?.currentTrack.syncedLyrics
      ? state?.currentTrack.lyrics
      : null;

  return (
    <div className="max-w-5xl w-full h-max mx-auto py-8 px-0.5 md:px-4 pb-32">
      <div className="flex items-center gap-4 mb-10 transition-all duration-500 animate-in fade-in slide-in-from-top-4">
        <div className="bg-primary/20 p-4 rounded-2xl shadow-xl shadow-primary/10">
          <RadioIcon className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1 bg-linear-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            رادیو دی بلال
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-muted-foreground font-medium">
                پخش زنده و زمان‌بندی شده
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
          <Card className="overflow-hidden py-0 border-none glass-card bg-muted backdrop-blur-2xl shadow-2xl ring-1 ring-foreground/10 group">
            <CardContent className="p-0">
              <div
                className="relative aspect-square w-full overflow-hidden cursor-pointer rounded-lg"
                onClick={() =>
                  anyLyrics && setShowLyricsOverlay(!showLyricsOverlay)
                }
              >
                <Image
                  src={state?.currentTrack.coverArt || "/images/cover.png"}
                  alt={state?.currentTrack.title || "Cover"}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105 rounded-lg"
                />
                {/* <div className="absolute inset-0 bg-linear-to-t from-foreground via-foreground/10 to-transparent" /> */}

                {/* Lyrics Overlay */}
                {anyLyrics && showLyricsOverlay && (
                  <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-2xl px-6 py-10 overflow-hidden animate-in fade-in zoom-in-95 duration-500 rounded-lg">
                    {/* Floating Switcher Pill */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center bg-foreground/5 backdrop-blur-3xl border border-foreground/10 rounded-full p-1 px-2 shadow-2xl ring-1 ring-white/10">
                      {[
                        { id: "synced", icon: Mic2, label: "زمان‌بندی" },
                        { id: "un-synced", icon: FileText, label: "ساده" },
                        { id: "hidden", icon: EyeOff, label: "مخفی" },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (mode.id === "hidden") {
                              setShowLyricsOverlay(false);
                            }
                            setLyricsMode(mode.id as LyricsMode);
                            toast.success(`نمایش متن: ${mode.label}`);
                          }}
                          className={cn(
                            "flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300",
                            lyricsMode === mode.id
                              ? "bg-secondary text-foreground shadow-lg scale-105"
                              : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                          )}
                        >
                          <mode.icon className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{mode.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="h-full pt-10">
                      <Lyrics
                        lrc={displayLrc}
                        plainLyrics={displayPlain}
                        songId={state?.currentTrack.id}
                      />
                    </div>
                  </div>
                )}

                {/* Live Badge */}
                <div className="absolute top-3 right-3 z-20">
                  <div className="inline-flex items-center px-2 py-0 rounded-full bg-green-600/90 text-white text-[13px] font-bold uppercase tracking-widest shadow-lg backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-white ml-1 animate-pulse shadow-[0_0_8px_white]" />
                    زنده
                  </div>
                </div>

                {/* Lyrics Button Indicator */}
                {anyLyrics && !showLyricsOverlay && (
                  <div className="absolute top-6 left-6 z-20">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-full bg-white/10 backdrop-blur-md text-white border border-white/10 hover:bg-white/20 transition-all hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLyricsOverlay(true);
                      }}
                    >
                      <Mic2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="text-center items-center justify-center flex z-20 my-2 rounded-lg mx-1 py-2">
                <Button
                  variant="outline"
                  className="border-accent z-20 mr-1"
                  onClick={toggleFavorite}
                  disabled={isTogglingFavorite}
                >
                  <Heart
                    size={24}
                    className={
                      isFavorite ? "fill-red-500 text-red-500" : "text-red-500"
                    }
                  />
                </Button>
                <div className="flex flex-col w-full max-w-10/12">
                  <h2 className="text-3xl font-black text-foreground mb-2 leading-tight drop-shadow-md overflow-hidden">
                    <MarqueeText
                      text={state?.currentTrack.title || "بدون عنوان"}
                      className="overflow-hidden line-clamp-none"
                    />
                  </h2>
                  <div className="text-foreground/80 text-lg font-medium drop-shadow-md">
                    <MarqueeText
                      text={state?.currentTrack.artist || "ناشناس"}
                      className="overflow-hidden line-clamp-none"
                    />
                  </div>
                </div>
                <div className="flex ml-1">
                  <AddToPlaylistDialog
                    songId={state?.currentTrack.id || ""}
                    trigger={
                      <Button
                        variant="outline"
                        className="border-accent text-accent-foreground hover:bg-accent hover:text-white/80 cursor-pointer size-9 md:size-10 p-0"
                      >
                        <ListPlus size={24} />
                      </Button>
                    }
                  />
                </div>
              </div>

              <div className="p-8 bg-linear-to-b from-foreground/5 to-transparent">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground/60 uppercase tracking-widest mb-6">
                  <span className="flex items-center gap-2">
                    در حال پخش
                    <div className="flex items-center gap-0.5 h-3">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-0.5 bg-primary animate-bounce"
                          style={{
                            animationDelay: `${i * 0.1}s`,
                            height: "100%",
                          }}
                        />
                      ))}
                    </div>
                  </span>
                  <span>
                    زمان کل: {formatTime(state?.currentTrack.duration || 0)}
                  </span>
                </div>

                <div className="flex items-end justify-between gap-1 h-14 w-full">
                  {[...Array(32)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-linear-to-t from-primary/80 to-primary/20 rounded-t-full transition-all duration-300"
                      style={{
                        height: isPlaying
                          ? `${10 + Math.random() * 90}%`
                          : "4px",
                        opacity: isPlaying ? 0.4 + Math.random() * 0.6 : 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-left-8 duration-700 delay-200">
          {/*User turns Off or On the Radio */}
          <Card className="glass-card bg-foreground/5 border-foreground/10 shadow-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-foreground/5 border border-foreground/5">
                {/* Left: Status */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-foreground/5 rounded-lg flex items-center justify-center shadow-lg ring-1 ring-foreground/10">
                    <RadioIcon
                      className={cn(
                        "w-7 h-7",
                        isRadio
                          ? "text-green-500 animate-pulse"
                          : "text-red-500 opacity-70"
                      )}
                    />
                  </div>

                  <div>
                    <p className="font-bold text-foreground text-base">
                      {isRadio ? "رادیو روشن است" : "رادیو خاموش است"}
                    </p>
                  </div>
                </div>

                {/* Right: Action */}
                {isRadio ? (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsRadio(false);
                      pause();
                    }}
                  >
                    خاموش
                  </Button>
                ) : (
                  <Dialog open={!isRadio}>
                    <DialogTrigger asChild>
                      <Button className="min-w-[70px]">روشن</Button>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>روشن کردن رادیو</DialogTitle>
                        <DialogDescription>
                          با فعال شدن رادیو، پخش زنده همگام با سرور آغاز می‌شود.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="flex flex-col gap-4 pt-4">
                        <Button
                          className="w-full bg-green-500 hover:bg-green-300 text-white"
                          onClick={() => {
                            setIsRadio(true, true);
                            fetchState();
                            play();
                          }}
                        >
                          روشن کردن رادیو
                        </Button>

                        <Button variant="outline" className="w-full">
                          <Link href="/">برگشت به دی بلال</Link>
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="pt-0 glass-card bg-foreground/5 border-foreground/10 shadow-xl overflow-hidden">
            <div className="bg-foreground/5 p-4 border-b border-foreground/10">
              <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                <Music className="w-4 h-4" />
                بعدی در لیست
              </h3>
            </div>
            <CardContent className="p-6">
              {state?.nextTrack ? (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-foreground/5 border border-foreground/5 hover:bg-foreground/10 transition-colors group">
                  <div className="w-14 h-14 bg-foreground/5 rounded-lg relative overflow-hidden shrink-0 shadow-lg ring-1 ring-foreground/10">
                    <Music className="w-7 h-7 absolute inset-0 m-auto text-foreground group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate text-base mb-0.5 transition-colors group-hover:text-primary">
                      {state.nextTrack?.title}
                    </p>
                    <p className="text-sm text-muted-foreground truncate font-medium">
                      {state.nextTrack?.artist}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center opacity-40">
                  <Music className="w-12 h-12 mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground italic text-sm font-medium">
                    لیست پخش به پایان می‌رسد.
                  </p>
                </div>
              )}
              {state?.playlistId && (
                <Link
                  href="/radio/history/today"
                  className="flex items-center gap-1.5 px-3 mt-4 py-2 rounded-2xl bg-primary/10 text-primary text-[13px] font-bold hover:bg-primary/20 transition-colors border border-primary/20"
                >
                  <List className="w-3.5 h-3.5" />
                  لیست پخش امروز
                </Link>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card bg-foreground/5 border-foreground/10 shadow-xl">
            <CardContent className="p-8">
              <h3 className="text-lg font-bold mb-4 text-foreground">
                درباره رادیو دی بلال
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                رادیو دی بلال یک تجربه شنیداری مشترک است. تمام کاربران در سراسر
                دنیا دقیقاً در یک لحظه آهنگ یکسانی را می‌شنوند. این رادیو بر
                اساس زمان جهانی (UTC) تنظیم شده و امکان عقب و جلو بردن آهنگ در
                آن وجود ندارد تا تجربه جمعی حفظ شود.
              </p>

              <div className="mt-8 space-y-5">
                <div className="flex justify-between items-center bg-foreground/5 p-3 rounded-lg border border-forebg-foreground/5 shadow-inner">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    وضعیت اتصال
                  </span>
                  <span className="text-green-500 flex items-center gap-2 font-black text-[11px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgb(34,197,94)]" />
                    متصل (زنده)
                  </span>
                </div>
                <div className="flex justify-between items-center bg-foreground/5 p-3 rounded-lg border border-forebg-foreground/5 shadow-inner">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    زمان سرور
                  </span>
                  <span className="tabular-nums font-black text-forebg-foreground bg-black/40 px-2 py-0.5 rounded text-[12px] border border-forebg-foreground/10">
                    {state &&
                      new Date(state.serverTime).toLocaleTimeString("fa-IR", {
                        hour12: false,
                      })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              هشدار خروج از رادیو
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              شما در حال گوش دادن به رادیو زنده هستید. در صورت ترک این صفحه، پخش
              آهنگ‌های بعدی مختل خواهد شد و تجربه رادیو قطع می‌شود.
              <br />
              <br />
              آیا مطمئن هستید که می‌خواهید صفحه را ترک کنید؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowWarningDialog(false)}
              className="w-full sm:w-auto"
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowWarningDialog(false);
                setIsRadio(false);
                if (pendingPath) {
                  router.push(pendingPath);
                }
              }}
              className="w-full sm:w-auto block"
            >
              خروج و قطع رادیو
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
