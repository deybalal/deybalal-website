"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, Copy, Check, RefreshCw, Bot, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/hooks/usePlayerStore";

interface TelegramLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectUrl?: string;
}

export function TelegramLoginModal({
  open,
  onOpenChange,
  redirectUrl = "/panel",
}: TelegramLoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [botUrl, setBotUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"IDLE" | "PENDING" | "APPROVED" | "EXPIRED" | "ERROR">("IDLE");
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds
  const router = useRouter();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const setDownloadPreference = usePlayerStore(
    (state) => state.setDownloadPreference
  );

  const clearTimers = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const createTelegramSession = useCallback(async () => {
    clearTimers();
    setLoading(true);
    setStatus("IDLE");
    setToken(null);
    setBotUrl(null);
    setTimeLeft(300);

    try {
      const res = await fetch("/api/auth/telegram/create", {
        method: "POST",
      });
      const data = await res.json();

      if (data.success && data.token && data.botUrl) {
        setToken(data.token);
        setBotUrl(data.botUrl);
        setStatus("PENDING");
      } else {
        setStatus("ERROR");
        toast.error(data.message || "خطا در برقراری ارتباط با سرور تلگرام");
      }
    } catch (err) {
      console.error("Failed to create telegram auth session:", err);
      setStatus("ERROR");
      toast.error("خطا در ایجاد درخواست ورود");
    } finally {
      setLoading(false);
    }
  }, [clearTimers]);

  // Start polling when token is available and status is PENDING
  useEffect(() => {
    if (!open || !token || status !== "PENDING") {
      return;
    }

    // Countdown timer
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimers();
          setStatus("EXPIRED");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Status polling loop
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/telegram/status?token=${token}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (data.status === "APPROVED") {
          clearTimers();
          setStatus("APPROVED");
          toast.success(`خوش آمدید ${data.user?.name || ""}! ورود با موفقیت انجام شد.`);

          if (data.downloadPreference) {
            setDownloadPreference(data.downloadPreference);
          }

          setTimeout(() => {
            onOpenChange(false);
            router.push(redirectUrl);
            router.refresh();
          }, 800);
        } else if (data.status === "EXPIRED") {
          clearTimers();
          setStatus("EXPIRED");
        } else if (data.status === "ERROR") {
          clearTimers();
          setStatus("ERROR");
        }
      } catch (err) {
        console.error("Error polling telegram auth status:", err);
      }
    }, 2000);

    return () => {
      clearTimers();
    };
  }, [open, token, status, clearTimers, onOpenChange, redirectUrl, router, setDownloadPreference]);

  // Handle open / close changes
  useEffect(() => {
    if (open) {
      createTelegramSession();
    } else {
      clearTimers();
      setStatus("IDLE");
    }
  }, [open, createTelegramSession, clearTimers]);

  const copyBotLink = async () => {
    if (!botUrl) return;
    try {
      await navigator.clipboard.writeText(botUrl);
      setCopied(true);
      toast.success("لینک ربات کپی شد!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("خطا در کپی لینک");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-right dir-rtl">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#229ED9]/15 text-[#229ED9]">
            <Bot className="h-7 w-7" />
          </div>
          <DialogTitle className="text-xl font-bold text-center">
            ورود با ربات تلگرام دی‌بلال
          </DialogTitle>
          <DialogDescription className="text-center text-sm mt-1">
            با باز کردن ربات در تلگرام و ارسال دستور شروع، به صورت خودکار و امن وارد سایت شوید.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-10 w-10 animate-spin text-[#229ED9]" />
              <p className="text-sm text-muted-foreground">در حال آماده‌سازی ارتباط با تلگرام...</p>
            </div>
          )}

          {!loading && status === "PENDING" && botUrl && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>در انتظار تایید شما در تلگرام...</span>
                <span className="font-mono text-[11px] opacity-75">({formatTime(timeLeft)})</span>
              </div>

              <Button
                asChild
                className="w-full bg-[#229ED9] hover:bg-[#1E88E5] text-white font-medium shadow-md gap-2 py-6 text-base"
              >
                <a href={botUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-5 w-5" />
                  <span>باز کردن ربات در تلگرام</span>
                </a>
              </Button>

              <div className="w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 p-2.5 text-xs">
                <span className="truncate text-muted-foreground font-mono select-all text-[11px]">
                  {botUrl}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={copyBotLink}
                  className="h-7 px-2 text-xs shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500 ml-1" />
                      کپی شد
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 ml-1" />
                      کپی لینک
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>اطلاعات ورود به صورت رمزنگاری‌شده و کاملاً امن منتقل می‌شود.</span>
              </div>
            </div>
          )}

          {!loading && status === "APPROVED" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500 animate-bounce">
                <Check className="h-6 w-6" />
              </div>
              <h4 className="text-base font-semibold text-foreground">ورود با موفقیت تأیید شد!</h4>
              <p className="text-xs text-muted-foreground">در حال انتقال به حساب کاربری...</p>
            </div>
          )}

          {!loading && (status === "EXPIRED" || status === "ERROR") && (
            <div className="w-full flex flex-col items-center gap-3 py-4 text-center">
              <p className="text-sm text-destructive font-medium">
                {status === "EXPIRED"
                  ? "مهلت زمان ورود به پایان رسید."
                  : "خطا در اتصال به ربات تلگرام."}
              </p>
              <Button
                variant="outline"
                onClick={createTelegramSession}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>تلاش مجدد</span>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
