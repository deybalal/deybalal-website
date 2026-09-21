"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  renderStoryCard,
  StoryTheme,
  exportCanvasToBlob,
  downloadCanvasImage,
} from "@/lib/storyCanvas";
import { toast } from "react-hot-toast";
import {
  Download,
  Copy,
  Share2,
  Sparkles,
  QrCode,
  Music,
  SlidersHorizontal,
  FileText,
  Palette,
  Check,
  Link,
  Instagram,
  Loader2,
  Type,
  RotateCcw,
  Film,
  Send,
  Clock,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { formatTime } from "@/lib/utils";
import { parseLRC } from "@/tools/parseLyrics";

export interface SongShareData {
  id: string;
  title: string;
  artist: string;
  coverArt?: string | null;
  album?: string | null;
  duration?: number;
  lyrics?: string | null;
  syncedLyrics?: string | null;
  index?: number;
}

interface ShareStoryModalProps {
  song: SongShareData;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ShareStoryModal({
  song,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: ShareStoryModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const [theme, setTheme] = useState<StoryTheme>("ambient");
  const [showQr, setShowQr] = useState(true);
  const [showProgress, setShowProgress] = useState(true);
  const [lyricsSnippet, setLyricsSnippet] = useState<string>("");
  const [lyricsFontSize, setLyricsFontSize] = useState<number>(32);
  const [lyricsLineCount, setLyricsLineCount] = useState<number>(4);
  const currentSong = usePlayerStore((state) => state.currentSong);
  const playerDuration = usePlayerStore((state) => state.duration);

  const totalDuration = Math.max(
    30,
    Math.round(song.duration || playerDuration || 210)
  );
  const isPlayingThisSong = currentSong?.id === song.id;

  const [storyProgress, setStoryProgress] = useState<number>(0);
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Video Clip States
  const [activeTab, setActiveTab] = useState<"image" | "video">("image");
  const [clipStart, setClipStart] = useState<number>(0);
  const [clipEnd, setClipEnd] = useState<number>(() =>
    Math.min(totalDuration, 15)
  );
  const [lyricsMode, setLyricsMode] = useState<"synced" | "simple">(() =>
    song.syncedLyrics ? "synced" : "simple"
  );
  const [isCopiedTelegram, setIsCopiedTelegram] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Parse synced lyrics if available
  const parsedLyrics = useMemo(() => {
    if (!song.syncedLyrics) return [];
    try {
      return parseLRC(song.syncedLyrics);
    } catch {
      return [];
    }
  }, [song.syncedLyrics]);

  // Helper to extract N lines from synced lyrics relative to a timestamp in seconds
  const getSyncedLyricsSnippet = useCallback(
    (progressSec: number, count: number) => {
      if (parsedLyrics.length === 0) return null;
      let activeIdx = parsedLyrics.findIndex((line, i) => {
        const nextTime = parsedLyrics[i + 1]?.time ?? Infinity;
        return progressSec >= line.time && progressSec < nextTime;
      });
      if (activeIdx === -1) {
        activeIdx =
          progressSec < parsedLyrics[0].time ? 0 : parsedLyrics.length - 1;
      }
      const lineCount = count >= 99 ? parsedLyrics.length : count;
      const resultLines: string[] = [];
      for (let i = activeIdx; i < parsedLyrics.length; i++) {
        const text = parsedLyrics[i].text.trim();
        if (text) {
          resultLines.push(text);
          if (resultLines.length >= lineCount) break;
        }
      }
      return resultLines.join("\n");
    },
    [parsedLyrics]
  );

  // Helper to extract N lines from plain lyrics
  const extractLyricsLines = useCallback(
    (lyrics: string | null | undefined, count: number) => {
      if (!lyrics) return "";
      const lines = lyrics
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      return count >= lines.length
        ? lines.join("\n")
        : lines.slice(0, count).join("\n");
    },
    []
  );

  // Sync lyrics snippet based on timestamp and count
  const syncLyricsWithProgress = useCallback(
    (timeSec: number, count: number) => {
      if (song.syncedLyrics && parsedLyrics.length > 0) {
        const syncedSnippet = getSyncedLyricsSnippet(timeSec, count);
        if (syncedSnippet) {
          setLyricsSnippet(syncedSnippet);
          return;
        }
      }
      if (song.lyrics) {
        setLyricsSnippet(extractLyricsLines(song.lyrics, count));
      }
    },
    [
      song.syncedLyrics,
      song.lyrics,
      parsedLyrics,
      getSyncedLyricsSnippet,
      extractLyricsLines,
    ]
  );

  // Snapshot story progress & sync lyrics ONLY when modal is opened (avoids re-rendering every second while song plays)
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setIsManuallyEdited(false);
      const state = usePlayerStore.getState();
      const isCurrentActiveSong = state.currentSong?.id === song.id;
      let initialProgress = 60;
      if (isCurrentActiveSong && state.progress > 0) {
        initialProgress = Math.floor(state.progress);
      } else if (song.duration) {
        initialProgress = Math.floor(song.duration * 0.35);
      }
      setStoryProgress(initialProgress);
      setClipStart(initialProgress);
      const safeEnd = Math.min(totalDuration, initialProgress + 15);
      setClipEnd(
        safeEnd > initialProgress
          ? safeEnd
          : Math.min(totalDuration, initialProgress + 30)
      );
      setLyricsMode(song.syncedLyrics ? "synced" : "simple");
      syncLyricsWithProgress(initialProgress, lyricsLineCount);
    }
    prevOpenRef.current = isOpen;
  }, [
    isOpen,
    song.id,
    song.duration,
    song.syncedLyrics,
    totalDuration,
    lyricsLineCount,
    syncLyricsWithProgress,
  ]);

  const handleLineCountChange = (count: number) => {
    setLyricsLineCount(count);
    setIsManuallyEdited(false);
    syncLyricsWithProgress(storyProgress, count);
  };

  // Derived song URLs
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_DEPLOYED_URL || "https://deybalal.ir";
  const songUrl = `${baseUrl}/song/${song.id}`;
  const shortUrl = song.index ? `${baseUrl}/s/${song.index}` : songUrl;

  // Render to canvas
  const redrawCanvas = useCallback(async () => {
    if (!canvasRef.current || !isOpen) return;
    setIsRendering(true);
    try {
      await renderStoryCard(canvasRef.current, {
        theme,
        showQr,
        showProgress,
        currentProgress: storyProgress,
        lyricsSnippet: lyricsSnippet || undefined,
        lyricsFontSize,
        song: {
          id: song.id,
          title: song.title || "آهنگ لری",
          artist: song.artist || "دی بلال",
          coverArt: song.coverArt,
          album: song.album,
          duration: totalDuration,
          url: songUrl,
          shortUrl: shortUrl,
        },
      });
    } catch (err) {
      console.error("Failed to render story canvas", err);
    } finally {
      setIsRendering(false);
    }
  }, [
    isOpen,
    theme,
    showQr,
    showProgress,
    storyProgress,
    lyricsSnippet,
    lyricsFontSize,
    song,
    totalDuration,
    songUrl,
    shortUrl,
  ]);

  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow dialog DOM layout
      const timer = setTimeout(() => {
        redrawCanvas();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, redrawCanvas]);

  // Direct Web Share with file (Instagram Story / Telegram Story / WhatsApp Status)
  const handleNativeShare = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await exportCanvasToBlob(canvasRef.current);
      if (!blob) {
        toast.error("خطا در ایجاد تصویر استوری");
        return;
      }

      const file = new File([blob], `deybalal-${song.id}-story.png`, {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: song.title,
          text: `گوش دادن به ترانه «${song.title}» در دی بلال:`,
          url: shortUrl || songUrl,
        });
        toast.success("با موفقیت به اشتراک گذاشته شد!");
      } else if (navigator.share) {
        await navigator.share({
          title: song.title,
          text: `گوش دادن به ترانه «${song.title}» در دی بلال: ${
            shortUrl || songUrl
          }`,
          url: shortUrl || songUrl,
        });
        toast.success("لینک به اشتراک گذاشته شد");
      } else {
        // Fallback: copy image or download
        handleDownload();
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        toast.error("خطا در اشتراک‌گذاری. تصویر دانلود شد.");
        handleDownload();
      }
    }
  };

  // Direct Download Image
  const handleDownload = () => {
    if (!canvasRef.current) return;
    const cleanTitle = (song.title || "story").replace(/[/\\?%*:|"<>]/g, "-");
    downloadCanvasImage(canvasRef.current, `deybalal-${cleanTitle}.png`);
    toast.success("تصویر با کیفیت عالی دانلود شد!");
  };

  // Copy Image to Clipboard (supports pasting directly into Instagram Stories sticker)
  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await exportCanvasToBlob(canvasRef.current);
      if (!blob) {
        toast.error("خطا در کپی تصویر");
        return;
      }

      if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
        toast.success(
          "تصویر کپی شد! می‌توانید در استوری اینستاگرام مستقیماً Paste کنید"
        );
      } else {
        handleDownload();
      }
    } catch (err) {
      console.error("Clipboard copy failed", err);
      toast.error("کپی خودکار در این مرورگر مجاز نیست، در حال دانلود...");
      handleDownload();
    }
  };

  // Copy link for Instagram Link Sticker
  const handleCopyLink = () => {
    const linkToCopy = shortUrl || songUrl;
    navigator.clipboard.writeText(linkToCopy);
    toast.success("لینک آهنگ کپی شد! (جهت استفاده در استیکر Link استوری)");
  };

  // Telegram Story Video Clip deep link
  const botUsername =
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "deybalalirbot";
  const telegramClipUrl = `https://t.me/${botUsername}?start=clip_${song.id}_${clipStart}_${clipEnd}_${lyricsMode}`;

  const handleOpenTelegram = () => {
    window.open(telegramClipUrl, "_blank");
    toast.success("در حال باز کردن ربات تلگرام دی‌بلال...");
  };

  const handleCopyTelegramLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(telegramClipUrl);
        setIsCopiedTelegram(true);
        setTimeout(() => setIsCopiedTelegram(false), 2500);
        toast.success("لینک ربات تلگرام کپی شد!");
      }
    } catch {
      toast.error("خطا در کپی لینک");
    }
  };

  const themeOptions: {
    id: StoryTheme;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: "ambient", label: "پیش فرض", icon: <Sparkles className="w-4 h-4" /> },
    {
      id: "dark",
      label: "پس‌زمینه تیره",
      icon: <Palette className="w-4 h-4" />,
    },
    {
      id: "vibrant",
      label: "پس‌زمینه رنگی",
      icon: <SlidersHorizontal className="w-4 h-4" />,
    },
    ...(song.lyrics || song.syncedLyrics
      ? [
          {
            id: "lyrics" as StoryTheme,
            label: "متن ترانه",
            icon: <FileText className="w-4 h-4" />,
          },
        ]
      : []),
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-6xl sm:max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-gray-950/95 border-white/10 text-white backdrop-blur-2xl rounded-3xl rtl">
        <DialogHeader className="pb-3 border-b border-white/10 text-right">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <span className="p-2 rounded-xl bg-linear-to-tr from-amber-500 via-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20">
              <Instagram className="w-5 h-5" />
            </span>
            اشتراک‌گذاری در استوری
          </DialogTitle>
          <p className="text-xs sm:text-sm text-gray-400">
            طراحی کارت عمودی (۹:۱۶) با کیفیت فوق‌العاده بالا برای استوری
            اینستاگرام، تلگرام و وضعیت واتساپ
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mt-2">
          {/* Left / Center Preview: 9:16 Canvas Mockup */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[280px] sm:max-w-[310px] aspect-9/16 rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-black/60 group">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-cover transition-transform duration-300"
              />

              {isRendering && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center gap-2 text-sm text-white">
                  <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
                  در حال ساخت تصویر...
                </div>
              )}

              {/* Aspect Ratio Badge */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-gray-300 border border-white/10 pointer-events-none">
                1080 × 1920 (9:16)
              </div>
            </div>

            <p className="text-[11px] text-gray-400 mt-2 text-center">
              پیش‌نمایش زنده استوری
            </p>
          </div>

          {/* Right Controls & Options */}
          <div className="md:col-span-7 flex flex-col gap-5 text-right">
            {/* Mode Switcher Tabs: Image Card vs Video Clip */}
            <div className="flex rounded-2xl bg-white/5 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("image")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "image"
                    ? "bg-linear-to-r from-amber-500 via-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Palette className="w-4 h-4" />
                استوری عکس
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("video")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "video"
                    ? "bg-linear-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Film className="w-4 h-4 text-amber-300" />
                استوری ویدیو
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  جدید
                </span>
              </button>
            </div>

            {activeTab === "image" ? (
              <>
                {/* Theme Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2 text-gray-200">
                    <Palette className="w-4 h-4 text-pink-400" />
                    سبک طراحی استوری
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {themeOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTheme(opt.id)}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                          theme === opt.id
                            ? "bg-linear-to-r from-pink-500/20 to-purple-500/20 border-pink-500/60 text-white shadow-md shadow-pink-500/10"
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lyrics Options (Only if lyrics theme is selected) */}
                {theme === "lyrics" && (
                  <div className="space-y-4 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    {/* Line Count Selector */}
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-semibold flex items-center justify-between text-gray-200">
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-pink-400" />
                          تعداد خطوط متن ترانه
                        </span>
                        <span className="text-[11px] text-pink-400 font-mono">
                          {lyricsLineCount >= 99
                            ? "همه خطوط"
                            : `${lyricsLineCount} خط`}
                        </span>
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {[
                          { count: 2, label: "۲ خط" },
                          { count: 4, label: "۴ خط" },
                          { count: 6, label: "۶ خط" },
                          { count: 8, label: "۸ خط" },
                          { count: 10, label: "۱۰ خط" },
                          { count: 99, label: "همه" },
                        ].map((item) => (
                          <button
                            key={item.count}
                            type="button"
                            onClick={() => handleLineCountChange(item.count)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                              lyricsLineCount === item.count
                                ? "bg-pink-500/20 border-pink-500/60 text-white shadow-xs"
                                : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Size Slider & Presets */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-gray-200">
                        <span className="flex items-center gap-1.5">
                          <Type className="w-4 h-4 text-pink-400" />
                          اندازه فونت متن ترانه
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-xs font-mono text-pink-400">
                          {lyricsFontSize} پیکسل
                        </span>
                      </div>

                      {/* Preset Pills */}
                      <div className="grid grid-cols-4 gap-1.5 [direction:ltr]">
                        {[
                          { size: 24, label: "ریز" },
                          { size: 32, label: "متوسط" },
                          { size: 40, label: "بزرگ" },
                          { size: 48, label: "خیلی بزرگ" },
                        ].map((p) => (
                          <button
                            key={p.size}
                            type="button"
                            onClick={() => setLyricsFontSize(p.size)}
                            className={`py-1 px-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all cursor-pointer border ${
                              lyricsFontSize === p.size
                                ? "bg-pink-500/20 border-pink-500/60 text-white"
                                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>

                      {/* Slider */}
                      <div className="pt-1 px-1">
                        <Slider
                          min={20}
                          max={50}
                          step={2}
                          value={[lyricsFontSize]}
                          onValueChange={([val]) => setLyricsFontSize(val)}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Direct Textarea Editor */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-400">
                          ویرایش مستقیم متن استوری:
                        </label>
                        {song.syncedLyrics && parsedLyrics.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsManuallyEdited(false);
                              syncLyricsWithProgress(
                                storyProgress,
                                lyricsLineCount
                              );
                              toast.success("متن با زمان انتخابی همگام شد");
                            }}
                            className={`text-[11px] flex items-center gap-1 cursor-pointer transition-colors ${
                              isManuallyEdited
                                ? "text-amber-400 hover:text-amber-300 font-medium"
                                : "text-pink-400/80 hover:text-pink-300"
                            }`}
                            title="همگام‌سازی مجدد متن با ثانیه انتخابی آهنگ"
                          >
                            <RotateCcw className="w-3 h-3" />
                            {isManuallyEdited
                              ? "بازنشانی به متن همگام"
                              : "همگام با زمان آهنگ"}
                          </button>
                        )}
                      </div>
                      <textarea
                        value={lyricsSnippet}
                        onChange={(e) => {
                          setLyricsSnippet(e.target.value);
                          setIsManuallyEdited(true);
                        }}
                        rows={4}
                        className="w-full text-xs sm:text-sm bg-black/40 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-pink-500 transition-colors placeholder:text-gray-500 resize-none leading-relaxed"
                        placeholder="متن ترانه برای نمایش در استوری..."
                      />
                      {song.syncedLyrics &&
                        parsedLyrics.length > 0 &&
                        !isManuallyEdited && (
                          <div className="flex items-center justify-between text-[10px] text-gray-400 px-1">
                            <span className="flex items-center gap-1 text-pink-400">
                              <Sparkles className="w-3 h-3" />
                              متن هماهنگ با ثانیه {formatTime(storyProgress)}
                            </span>
                            <span>با جابجایی نوار زمان، متن تغییر می‌کند</span>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Customization Switches */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2 text-gray-200">
                    <SlidersHorizontal className="w-4 h-4 text-pink-400" />
                    شخصی‌سازی جزئیات
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setShowQr(!showQr)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer ${
                        showQr
                          ? "bg-white/10 border-pink-500/50 text-white"
                          : "bg-white/5 border-white/10 text-gray-400"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-pink-400" />
                        بارکد QR اسکن آهنگ
                      </span>
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          showQr
                            ? "bg-pink-500 border-pink-500 text-white"
                            : "border-gray-500"
                        }`}
                      >
                        {showQr && <Check className="w-3 h-3" />}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowProgress(!showProgress)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer ${
                        showProgress
                          ? "bg-white/10 border-pink-500/50 text-white"
                          : "bg-white/5 border-white/10 text-gray-400"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-pink-400" />
                        نوار پلیر و زمان آهنگ
                      </span>
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          showProgress
                            ? "bg-pink-500 border-pink-500 text-white"
                            : "border-gray-500"
                        }`}
                      >
                        {showProgress && <Check className="w-3 h-3" />}
                      </span>
                    </button>

                    {/* Progress Scrubber (when player bar is enabled) */}
                    {showProgress && (
                      <div className="col-span-1 sm:col-span-2 p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-300">
                          <span>موقعیت نوار زمان در استوری:</span>
                          <span className="font-mono text-pink-400 font-bold ltr">
                            {formatTime(storyProgress)} /{" "}
                            {formatTime(totalDuration)}
                          </span>
                        </div>
                        <Slider
                          min={0}
                          max={totalDuration}
                          step={1}
                          value={[storyProgress]}
                          onValueChange={([val]) => {
                            setStoryProgress(val);
                            if (
                              !isManuallyEdited &&
                              song.syncedLyrics &&
                              parsedLyrics.length > 0
                            ) {
                              syncLyricsWithProgress(val, lyricsLineCount);
                            }
                          }}
                          className="cursor-pointer"
                        />
                        {isPlayingThisSong && (
                          <button
                            type="button"
                            onClick={() => {
                              const currentPlaybackSec = Math.floor(
                                usePlayerStore.getState().progress
                              );
                              setStoryProgress(currentPlaybackSec);
                              if (
                                !isManuallyEdited &&
                                song.syncedLyrics &&
                                parsedLyrics.length > 0
                              ) {
                                syncLyricsWithProgress(
                                  currentPlaybackSec,
                                  lyricsLineCount
                                );
                              }
                              toast.success(
                                `زمان با ثانیه فعلی پلیر (${formatTime(
                                  currentPlaybackSec
                                )}) همگام شد`
                              );
                            }}
                            className="text-[11px] text-pink-400 hover:text-pink-300 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            ⏱️ همگام‌سازی با زمان فعلی پلیر
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <Button
                    onClick={handleNativeShare}
                    className="w-full h-12 rounded-xl bg-linear-to-r from-amber-500 via-pink-500 to-purple-600 hover:opacity-95 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-pink-500/25 cursor-pointer"
                  >
                    <Share2 className="w-5 h-5" />
                    اشتراک‌گذاری مستقیم در استوری
                  </Button>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      onClick={handleDownload}
                      className="h-11 rounded-xl bg-white/5 hover:bg-white/10 border-white/15 text-white text-xs sm:text-sm gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-green-400" />
                      دانلود تصویر
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleCopyImage}
                      className="h-11 rounded-xl bg-white/5 hover:bg-white/10 border-white/15 text-white text-xs sm:text-sm gap-2 cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4 text-green-400" />
                          کپی شد!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-blue-400" />
                          کپی تصویر
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleCopyLink}
                      className="h-11 rounded-xl bg-white/5 hover:bg-white/10 border-white/15 text-white text-xs sm:text-sm gap-2 cursor-pointer"
                    >
                      <Link className="w-4 h-4 text-amber-400" />
                      کپی لینک
                    </Button>
                  </div>
                </div>

                {/* Helpful Instagram Story Tips */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-300 text-xs leading-relaxed">
                  <p className="font-semibold text-white mb-1 flex items-center gap-1.5">
                    💡 راهنمای استوری اینستاگرام:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-400 text-[11px] sm:text-xs">
                    <li>
                      می‌توانید دکمه «کپی تصویر» را بزنید و در بخش استوری
                      اینستاگرام دکمه Paste را لمس کنید تا به عنوان استیکر اضافه
                      شود.
                    </li>
                    <li>
                      با «کپی لینک»، می‌توانید استیکر Link اینستاگرام را به
                      استوری خود اضافه کنید تا دوستانتان مستقیم به آهنگ دسترسی
                      داشته باشند.
                    </li>
                  </ul>
                </div>

                {/* Quick Switcher to Video Clip */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("video")}
                    className="w-full py-2.5 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 hover:text-purple-200 text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Film className="w-3.5 h-3.5" />
                    می‌خواهید ویدیو کلیپ بسازید؟ بخش «ویدیو کلیپ استوری» را
                    ببینید
                  </button>
                </div>
              </>
            ) : (
              /* Video Tab Content */
              <div className="flex flex-col gap-4">
                {/* Info Header */}
                <div className="p-3.5 rounded-2xl bg-linear-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-500/20 text-xs text-gray-300 leading-relaxed">
                  <div className="flex items-center gap-2 text-white font-semibold mb-1">
                    <Film className="w-4 h-4 text-pink-400" />
                    ساخت ویدیوی استوری با ربات تلگرام
                  </div>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    بازه زمانی دلخواه از ترانه را انتخاب کنید؛ ربات تلگرام
                    دی‌بلال ویدیو رو میسازه و برای شما ارسال میکنه.
                  </p>
                </div>

                {/* Time Range Selector */}
                <div className="space-y-3.5 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-sm font-semibold flex items-center gap-2 text-gray-200">
                      <Clock className="w-4 h-4 text-amber-400" />
                      تنظیم بازه زمانی ویدیو
                    </label>
                    <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      {formatTime(clipStart)} تا {formatTime(clipEnd)} (مدت:{" "}
                      {Math.max(0, clipEnd - clipStart)} ثانیه)
                    </span>
                  </div>

                  {/* Duration Presets */}
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    <span className="text-xs text-gray-400">زمان ویدیو:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setClipEnd(Math.min(totalDuration, clipStart + 15))
                      }
                      className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                        clipEnd - clipStart === 15
                          ? "bg-pink-500 text-white font-semibold shadow-xs shadow-pink-500/30"
                          : "bg-white/10 text-gray-300 hover:bg-white/15"
                      }`}
                    >
                      ۱۵ ثانیه (استوری)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setClipEnd(Math.min(totalDuration, clipStart + 30))
                      }
                      className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                        clipEnd - clipStart === 30
                          ? "bg-pink-500 text-white font-semibold shadow-xs shadow-pink-500/30"
                          : "bg-white/10 text-gray-300 hover:bg-white/15"
                      }`}
                    >
                      ۳۰ ثانیه
                    </button>
                    {isPlayingThisSong && (
                      <button
                        type="button"
                        onClick={() => {
                          const cur = Math.floor(
                            usePlayerStore.getState().progress || 0
                          );
                          setClipStart(cur);
                          setClipEnd(Math.min(totalDuration, cur + 15));
                          toast.success(
                            `شروع کلیپ با ثانیه فعلی (${formatTime(
                              cur
                            )}) همگام شد`
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 transition-colors cursor-pointer flex items-center gap-1.5 mr-auto"
                      >
                        <RotateCcw className="w-3 h-3" />
                        همگام با زمان پلیر
                      </button>
                    )}
                  </div>

                  {/* Start Time Slider */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs text-gray-300">
                      <span>ثانیه شروع آهنگ:</span>
                      <span className="font-mono text-pink-400 font-bold">
                        {formatTime(clipStart)}
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={Math.max(0, totalDuration - 5)}
                      step={1}
                      value={[clipStart]}
                      onValueChange={([val]) => {
                        setClipStart(val);
                        if (val >= clipEnd) {
                          setClipEnd(Math.min(totalDuration, val + 15));
                        }
                      }}
                      className="cursor-pointer"
                    />
                  </div>

                  {/* End Time Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-gray-300">
                      <span>ثانیه پایان آهنگ:</span>
                      <span className="font-mono text-purple-400 font-bold">
                        {formatTime(clipEnd)}
                      </span>
                    </div>
                    <Slider
                      min={Math.min(totalDuration, clipStart + 5)}
                      max={totalDuration}
                      step={1}
                      value={[clipEnd]}
                      onValueChange={([val]) => {
                        if (val > clipStart) {
                          setClipEnd(val);
                        }
                      }}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                {/* Lyrics Mode Selection */}
                <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <label className="text-sm font-semibold flex items-center gap-2 text-gray-200">
                    <FileText className="w-4 h-4 text-pink-400" />
                    نوع زیرنویس ویدیو
                  </label>

                  {song.syncedLyrics ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setLyricsMode("synced")}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-1 ${
                          lyricsMode === "synced"
                            ? "bg-linear-to-r from-pink-500/20 to-purple-500/20 border-pink-500/60 shadow-md shadow-pink-500/10 text-white"
                            : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-white">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            متن همگام‌سازی شده
                          </span>
                          {lyricsMode === "synced" && (
                            <Check className="w-4 h-4 text-pink-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 leading-normal">
                          زیرنویس کلمه به کلمه متحرک، دقیقاً هماهنگ با صدای
                          خواننده در این ثانیه‌ها
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLyricsMode("simple")}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-1 ${
                          lyricsMode === "simple"
                            ? "bg-linear-to-r from-pink-500/20 to-purple-500/20 border-pink-500/60 shadow-md shadow-pink-500/10 text-white"
                            : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-white">
                            <Type className="w-3.5 h-3.5 text-blue-400" />
                            متن ساده ترانه
                          </span>
                          {lyricsMode === "simple" && (
                            <Check className="w-4 h-4 text-pink-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 leading-normal">
                          نمایش خطوط متن ترانه در طول بازه انتخابی ویدیو
                        </p>
                      </button>
                    </div>
                  ) : song.lyrics ? (
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 flex items-center gap-2">
                      <Type className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>
                        این ترانه فاقد متن زمان‌بندی شده است؛ زیرنویس به صورت{" "}
                        <b>متن ساده ترانه</b> در ویدیو قرار خواهد گرفت.
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 flex items-center gap-2">
                      <Music className="w-4 h-4 text-gray-500 shrink-0" />
                      <span>
                        این ترانه فاقد متن است؛ ویدیو به همراه موزیک و کاور
                        تولید خواهد شد.
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  <Button
                    onClick={handleOpenTelegram}
                    className="w-full h-12 rounded-xl bg-linear-to-r from-pink-500 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-purple-500/25 cursor-pointer"
                  >
                    <Send className="w-5 h-5 text-white" />
                    ساخت و دریافت ویدیو کلیپ در تلگرام
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleCopyTelegramLink}
                    className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 border-white/15 text-white text-xs sm:text-sm gap-2 cursor-pointer"
                  >
                    {isCopiedTelegram ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        لینک ربات تلگرام کپی شد!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-amber-400" />
                        کپی لینک مستقیم ربات تلگرام
                      </>
                    )}
                  </Button>
                </div>

                {/* Helpful Telegram Tips */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-300 text-xs leading-relaxed">
                  <p className="font-semibold text-white mb-1 flex items-center gap-1.5">
                    💡 مراحل بعد از باز شدن تلگرام:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-400 text-[11px] sm:text-xs">
                    <li>
                      در تلگرام دکمه <b>Start</b> را لمس کنید تا مشخصات کلیپ
                      شناسایی شود.
                    </li>
                    <li>
                      می‌توانید بین <b>استوری سریع (با کاور رسمی آهنگ)</b> یا{" "}
                      <b>ارسال عکس‌های دلخواه</b> خودتان انتخاب کنید.
                    </li>
                    <li>
                      ربات ویدیو را رندر کرده و فایل نهایی را مستقیماً برای شما
                      ارسال می‌کند.
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
