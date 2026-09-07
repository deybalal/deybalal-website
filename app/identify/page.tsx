"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useSyncExternalStore,
} from "react";
import {
  Mic,
  Square,
  Music,
  Upload,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  FileAudio,
  Info,
  Radio,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { Song } from "@/types/types";

interface IdentifiedSong {
  id: string;
  slug?: string;
  title: string;
  titleEn?: string;
  artist: string;
  artistEn?: string;
  coverArt?: string;
  links: Record<string | number, { url: string; size: string; bytes: number }>;
  uri?: string;
  duration?: number;
}

interface Candidate {
  song?: IdentifiedSong;
  confidence: number;
  matchedPeaks: number;
}

interface IdentifyResponse {
  success: boolean;
  match: boolean;
  confidence?: number;
  song?: IdentifiedSong | null;
  stats?: {
    matchedPeaks: number;
    totalMatches: number;
    alignmentRatio: number;
  } | null;
  candidates?: Candidate[];
  message?: string;
  error?: string;
}

const RECORDING_DURATION = 7; // seconds

const subscribeMediaDevices = (callback: () => void) => {
  if (
    typeof navigator !== "undefined" &&
    navigator.mediaDevices &&
    "addEventListener" in navigator.mediaDevices
  ) {
    navigator.mediaDevices.addEventListener("devicechange", callback);
    return () =>
      navigator.mediaDevices.removeEventListener("devicechange", callback);
  }
  return () => {};
};

const checkMicAvailable = () =>
  !!(
    typeof navigator !== "undefined" &&
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );

export default function IdentifyPage() {
  const [activeTab, setActiveTab] = useState<"upload" | "record">("upload");
  const [status, setStatus] = useState<
    "idle" | "listening" | "processing" | "success" | "no_match" | "error"
  >("idle");
  const [countdown, setCountdown] = useState(RECORDING_DURATION);
  const [result, setResult] = useState<IdentifyResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const isMicAvailable = useSyncExternalStore(
    subscribeMediaDevices,
    checkMicAvailable,
    () => true
  );
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Global player store
  const {
    volume,
    setSong,
    currentSong,
    isPlaying: isGlobalPlaying,
    play: playGlobal,
    pause: pauseGlobal,
  } = usePlayerStore();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const voiceRecorderInputRef = useRef<HTMLInputElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Synchronize 30s OGG preview audio volume with persisted PlayerStore volume
  useEffect(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.volume = Math.max(
        0,
        Math.min(1, (volume ?? 100) / 100)
      );
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  const sendAudioForIdentification = async (audioBlobOrFile: Blob | File) => {
    setStatus("processing");
    try {
      const formData = new FormData();
      const fileName =
        audioBlobOrFile instanceof File
          ? audioBlobOrFile.name
          : "recorded_sample.webm";

      formData.append("file", audioBlobOrFile, fileName);

      const res = await fetch("/api/identify", {
        method: "POST",
        body: formData,
      });

      const data: IdentifyResponse = await res.json();

      if (!res.ok || !data.success) {
        setStatus("error");
        setErrorMessage(
          data.message || data.error || "شناسایی آهنگ با خطا مواجه شد."
        );
        return;
      }

      // If song or candidate found, display it!
      if (data.song) {
        setResult(data);
        setStatus("success");
      } else if (
        data.candidates &&
        data.candidates.length > 0 &&
        data.candidates[0].song
      ) {
        data.song = data.candidates[0].song;
        data.confidence = data.candidates[0].confidence;
        setResult(data);
        setStatus("success");
      } else {
        setResult(data);
        setStatus("no_match");
      }
    } catch (err) {
      console.error("Error sending audio:", err);
      setStatus("error");
      setErrorMessage("خطا در برقراری ارتباط با سرور. لطفا مجددا تلاش کنید.");
    }
  };

  const startListening = async () => {
    try {
      setErrorMessage("");
      setResult(null);
      audioChunksRef.current = [];

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setErrorMessage(
          "مرورگر روی این آدرس (HTTP) اجازه دسترسی به میکروفون را نمی‌دهد. لطفا از بخش «آپلود فایل صوتی» استفاده کنید."
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/ogg")
        ? "audio/ogg"
        : "audio/wav";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());

        const completeBlob = new Blob(audioChunksRef.current, {
          type: mimeType,
        });
        if (completeBlob.size > 0) {
          sendAudioForIdentification(completeBlob);
        } else {
          setStatus("error");
          setErrorMessage("هیچ صوتی دریافت نشد.");
        }
      };

      mediaRecorder.start(250);
      setStatus("listening");
      setCountdown(RECORDING_DURATION);

      let timeLeft = RECORDING_DURATION;
      timerRef.current = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);
        if (timeLeft <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          stopListening();
        }
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      setStatus("error");
      setErrorMessage(
        "دسترسی به میکروفون رد شد یا در این شبکه پشتیبانی نمی‌شود. لطفا از تب «آپلود فایل صوتی» استفاده فرمایید."
      );
    }
  };

  const stopListening = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;
    setSelectedFile(file);
    setErrorMessage("");
    setResult(null);
    sendAudioForIdentification(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  /**
   * Play the 30-second preview OGG file:
   * Location: /assets/ogg/${songId}.ogg
   * - Does NOT display in PlayerBar
   * - Uses persisted volume from usePlayerStore
   */
  const toggleOggPreview = (songId: string) => {
    if (!songId) return;

    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio();
      previewAudioRef.current.onended = () => setIsPlayingPreview(false);
      previewAudioRef.current.onerror = () => {
        setIsPlayingPreview(false);
      };
    }

    const oggUrl = `/assets/ogg/${songId}.ogg`;

    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      // Pause global player to prevent audio clash
      if (isGlobalPlaying) {
        pauseGlobal();
      }

      previewAudioRef.current.volume = Math.max(
        0,
        Math.min(1, (volume ?? 100) / 100)
      );

      const targetSrc = window.location.origin + oggUrl;
      if (previewAudioRef.current.src !== targetSrc) {
        previewAudioRef.current.src = oggUrl;
      }

      previewAudioRef.current
        .play()
        .then(() => {
          setIsPlayingPreview(true);
        })
        .catch((err) => {
          console.error("Preview playback error:", err);
          setIsPlayingPreview(false);
        });
    }
  };

  /**
   * Play the full song via the global PlayerBar
   */
  const handlePlayFullSong = (song: IdentifiedSong) => {
    // If 30-sec OGG preview is currently playing, pause it
    if (previewAudioRef.current && isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    }

    if (currentSong?.id === song.id) {
      if (isGlobalPlaying) {
        pauseGlobal();
      } else {
        playGlobal();
      }
    } else {
      const fullSong: Song = {
        id: song.id,
        title: song.title,
        titleEn: song.titleEn,
        uri: song.uri || `/assets/mp3/${song.id}.mp3`,
        filename: song.uri?.split("/").pop() || `${song.id}.mp3`,
        links: song.links,
        index: 0,
        duration: song.duration || 0,
        coverArt: song.coverArt || null,
        artist: song.artist,
        album: null,
        albumId: null,
        playCount: 0,
        artists: [],
      };
      setSong(fullSong, true);
    }
  };

  const resetAll = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    }
    setSelectedFile(null);
    setStatus("idle");
    setResult(null);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (voiceRecorderInputRef.current) voiceRecorderInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-4 pb-32 sm:pb-16">
      <div className="w-full max-w-md sm:max-w-xl mx-auto text-center space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>شناسایی هوشمند آهنگ لری</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {status === "listening"
              ? "در حال گوش دادن..."
              : status === "processing"
              ? "در حال پردازش اثر صوتی..."
              : status === "success"
              ? "آهنگ شناسایی شد!"
              : "شناسایی آهنگ"}
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm max-w-sm sm:max-w-md mx-auto leading-relaxed">
            {status === "listening"
              ? "میکروفون خود را به سمت بلندگو نگه دارید."
              : status === "processing"
              ? "استخراج الگوهای فرکانسی و تطبیق با پایگاه داده..."
              : status === "success"
              ? "نتیجه تطبیق با بالاترین دقت پیدا شد."
              : "یک فایل صوتی (MP3، WAV، OGG) آپلود کنید یا دکمه ضبط را لمس نمایید."}
          </p>
        </div>

        {/* Mode Switcher Tabs (Only when idle) */}
        {status === "idle" && (
          <div className="grid grid-cols-2 p-1 bg-muted/80 backdrop-blur rounded-2xl border border-border/60 max-w-xs sm:max-w-sm mx-auto shadow-inner">
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === "upload"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>آپلود فایل صوتی</span>
            </button>
            <button
              onClick={() => setActiveTab("record")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === "record"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>ضبط با میکروفون</span>
            </button>
          </div>
        )}

        {/* Tab 1: Upload Audio File (WAV / OGG / MP3 / M4A) */}
        {status === "idle" && activeTab === "upload" && (
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-6 sm:p-10 text-center transition-all duration-200 cursor-pointer bg-card/60 hover:bg-card hover:border-primary/60 group shadow-sm ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border/80"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileChange(e.target.files?.[0])}
                accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/webm,audio/x-m4a,audio/*,.mp3,.wav,.ogg,.m4a,.webm"
                className="hidden"
              />

              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3.5 group-hover:scale-110 transition-transform">
                <FileAudio className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>

              <h3 className="text-sm sm:text-base font-bold mb-1">
                انتخاب یا آپلود فایل صوتی
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                برای انتخاب فایل لمس کنید یا فایل را اینجا بکشید
              </p>

              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] sm:text-[11px] font-mono font-medium text-muted-foreground">
                  MP3
                </span>
                <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] sm:text-[11px] font-mono font-medium text-muted-foreground">
                  WAV
                </span>
                <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] sm:text-[11px] font-mono font-medium text-muted-foreground">
                  OGG
                </span>
                <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] sm:text-[11px] font-mono font-medium text-muted-foreground">
                  M4A / WebM
                </span>
              </div>
            </div>

            {/* Mobile Native Voice Recorder Option */}
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2.5 text-right">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs">در گوشی تلفن همراه هستید؟</span>
              </div>
              <div className="w-full sm:w-auto">
                <input
                  type="file"
                  ref={voiceRecorderInputRef}
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                  accept="audio/*"
                  capture
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => voiceRecorderInputRef.current?.click()}
                  className="w-full sm:w-auto gap-2 cursor-pointer text-xs h-9 rounded-xl font-medium"
                >
                  <Radio className="w-3.5 h-3.5 text-red-500" />
                  <span>ضبط صدای زنده گوشی</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live Microphone Recording */}
        {status === "idle" && activeTab === "record" && (
          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            {!isMicAvailable && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs text-right max-w-sm">
                <strong>توجه:</strong> اتصال از طریق شبکه محلی (HTTP) در
                مرورگرهای موبایل دسترسی مستقیم به میکروفون را مسدود می‌کند.
                لطفاً از تب <strong>«آپلود فایل صوتی»</strong> استفاده فرمایید.
              </div>
            )}

            <div className="relative group flex items-center justify-center py-4">
              <button
                onClick={startListening}
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-linear-to-tr from-primary to-blue-600 text-primary-foreground shadow-2xl flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all duration-300 ring-8 ring-primary/20 hover:ring-primary/40 cursor-pointer"
              >
                <Mic className="w-10 h-10 sm:w-12 sm:h-12" />
                <span className="text-[11px] sm:text-xs font-bold tracking-wider">
                  لمس برای شنیدن
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Listening Animation State */}
        {status === "listening" && (
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-primary/20 animate-ping" />
              <div className="absolute w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-primary/30 animate-pulse" />

              <button
                onClick={stopListening}
                className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-red-600 text-white shadow-2xl flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer z-10"
              >
                <Square className="w-8 h-8 sm:w-10 sm:h-10 fill-white" />
                <span className="text-xs font-bold font-mono">
                  {countdown} ثانیه مانده
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Processing State */}
        {status === "processing" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-primary/20 border-t-primary animate-spin flex items-center justify-center">
              <Music className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-bounce" />
            </div>
            {selectedFile && (
              <p className="text-xs text-muted-foreground font-mono truncate max-w-[240px] sm:max-w-xs">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
              </p>
            )}
            <p className="text-xs sm:text-sm font-medium animate-pulse text-primary">
              در حال استخراج اثر صوتی و جستجو در پایگاه داده...
            </p>
          </div>
        )}

        {/* Result Display: Success Match (Mobile-Optimized) */}
        {status === "success" && result?.song && (
          <div className="bg-card/90 backdrop-blur border rounded-3xl p-4 sm:p-6 shadow-xl space-y-5 text-right transition-all animate-in fade-in zoom-in-95 duration-300">
            {/* Header / Accuracy Badge */}
            <div className="flex items-center justify-between border-b pb-3.5">
              <div
                className={`flex items-center gap-1.5 font-bold text-xs sm:text-sm ${
                  (result.confidence || 0) >= 50
                    ? "text-emerald-500"
                    : "text-amber-500"
                }`}
              >
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>
                  {(result.confidence || 0) >= 50
                    ? "تشخیص موفق"
                    : "نزدیک‌ترین نتیجه تشخیص"}
                </span>
              </div>
              <div
                className={`px-3 py-1 border font-bold text-xs sm:text-sm rounded-full ${
                  (result.confidence || 0) >= 50
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                }`}
              >
                {result.confidence}% دقت تشخیص
              </div>
            </div>

            {/* Song Cover & Details */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              {/* Cover Art */}
              <Link
                href={`/song/${result.song.id}`}
                className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-lg bg-muted shrink-0 flex items-center justify-center group"
              >
                {result.song.coverArt ? (
                  <Image
                    src={result.song.coverArt}
                    alt={result.song.title}
                    fill
                    sizes="(max-width: 640px) 112px, 128px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <Music className="w-10 h-10 text-muted-foreground" />
                )}
              </Link>

              {/* Details */}
              <div className="space-y-1.5 grow text-center sm:text-right w-full">
                <Link
                  href={`/song/${result.song.id}`}
                  className="hover:underline block"
                >
                  <h2 className="text-xl sm:text-2xl font-bold truncate">
                    {result.song.title}
                  </h2>
                </Link>
                {result.song.titleEn && (
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {result.song.titleEn}
                  </p>
                )}
                <p className="text-base sm:text-lg font-medium text-primary truncate">
                  {result.song.artist}
                </p>
                {result.song.artistEn && (
                  <p className="text-xs text-muted-foreground truncate">
                    {result.song.artistEn}
                  </p>
                )}

                {result.stats && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] text-muted-foreground pt-1">
                    <span className="bg-muted px-2 py-0.5 rounded-md">
                      اثر انگشت‌ها:{" "}
                      <strong className="text-foreground">
                        {result.stats.matchedPeaks}
                      </strong>
                    </span>
                    <span className="bg-muted px-2 py-0.5 rounded-md">
                      انطباق‌ها:{" "}
                      <strong className="text-foreground">
                        {result.stats.totalMatches}
                      </strong>
                    </span>
                  </div>
                )}

                {/* Dual Play Buttons (Rock-solid 2-Column Mobile Grid) */}
                <div className="grid grid-cols-2 gap-2.5 w-full pt-3">
                  {/* Button 1: 30-Second OGG Preview */}
                  <Button
                    variant={isPlayingPreview ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleOggPreview(result.song?.id || "")}
                    className={`w-11/12 h-11 rounded-xl gap-1.5 font-medium cursor-pointer transition-all text-xs px-2 shadow-sm ${
                      isPlayingPreview
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "border-primary/40 hover:bg-primary/10"
                    }`}
                  >
                    {isPlayingPreview ? (
                      <>
                        <Pause className="w-4 h-4 shrink-0" />
                        <span className="truncate">توقف پیش‌نمایش</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 shrink-0 text-primary" />
                        <span className="truncate">پیش‌نمایش (۳۰s)</span>
                      </>
                    )}
                  </Button>

                  {/* Button 2: Play Full Song (Global PlayerBar) */}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handlePlayFullSong(result.song!)}
                    className="w-11/12 h-11 rounded-xl gap-1.5 font-medium cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-md text-xs px-2"
                  >
                    {isGlobalPlaying && currentSong?.id === result.song.id ? (
                      <>
                        <Pause className="w-4 h-4 shrink-0 fill-current" />
                        <span className="truncate">توقف پخش</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 shrink-0 fill-current" />
                        <span className="truncate">پخش کامل</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Other Candidates if any */}
            {result.candidates && result.candidates.length > 1 && (
              <div className="space-y-2.5 pt-3.5 border-t">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  سایر احتمالات:
                </h3>
                <div className="space-y-2">
                  {result.candidates.slice(1).map((cand, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-muted/40 hover:bg-muted text-xs sm:text-sm transition-colors gap-2"
                    >
                      <Link
                        href={`/song/${cand.song?.id}`}
                        className="hover:underline grow truncate min-w-0"
                      >
                        <div className="font-semibold truncate">
                          {cand.song?.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {cand.song?.artist}
                        </div>
                      </Link>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {cand.song && (
                          <>
                            <button
                              onClick={() =>
                                toggleOggPreview(cand.song?.id || "")
                              }
                              className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handlePlayFullSong(cand.song!)}
                              className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </>
                        )}
                        <div className="text-[10px] font-bold text-muted-foreground px-1.5 py-0.5 rounded-md bg-background border">
                          {cand.confidence}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Identify Another Song Button */}
            <div className="pt-2">
              <Button
                onClick={resetAll}
                className="w-full h-11 rounded-2xl cursor-pointer text-xs sm:text-sm"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 ms-2" />
                شناسایی آهنگ دیگر
              </Button>
            </div>
          </div>
        )}

        {/* No Match Result */}
        {status === "no_match" && (
          <div className="bg-card border rounded-3xl p-6 shadow-xl space-y-4 text-center transition-all animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold">آهنگی پیدا نشد!</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              این اثر در پایگاه داده ثبت نشده است یا کیفیت فایل ارسالی برای
              تطبیق کافی نبود.
            </p>
            <Button
              onClick={resetAll}
              className="mt-2 h-10 px-6 rounded-xl cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 ms-2" />
              تلاش مجدد
            </Button>
          </div>
        )}

        {/* Error Result */}
        {status === "error" && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-3xl p-6 shadow-xl space-y-4 text-center transition-all animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-destructive/20 text-destructive mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-destructive">
              خطا در شناسایی
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {errorMessage}
            </p>
            <Button
              onClick={resetAll}
              variant="outline"
              className="mt-2 h-10 px-6 rounded-xl cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 ms-2" />
              شروع دوباره
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
