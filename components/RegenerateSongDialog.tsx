"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

interface RegenerateSongDialogProps {
  title?: string;
  songTitle?: string;
  description?: string;
  fnButton?: string;
  fn: () => Promise<void> | void;
  disabled?: boolean;
}

export default function RegenerateSongDialog({
  title = "ساخت مجدد",
  songTitle,
  description,
  fnButton = "ساخت مجدد",
  fn,
  disabled = false,
}: RegenerateSongDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fn();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && setOpen(v)}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled || loading}
          className="h-8 p-2 w-full cursor-pointer transition-opacity text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 justify-start flex items-center gap-1.5"
        >
          <RefreshCw className="mr-0.5 h-4 w-4" /> {title}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="pt-2 text-right">
            {description ||
              (songTitle
                ? `آیا از ساخت مجدد کاور آرت و فایل‌های MP3 آهنگ «${songTitle}» مطمئن هستید؟`
                : "آیا از ساخت مجدد کاور و فایل‌های صوتی این آهنگ مطمئن هستید؟")}
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 text-xs text-muted-foreground leading-relaxed">
          این فرآیند کاور آرت و تمامی نسخه‌های MP3 (کیفیت‌های 64، 128 و 320) را همراه با واترمارک و متادیتای جدید بازسازی کرده و اثرانگشت صوتی قبلی را حذف و اثرانگشت جدید را ذخیره می‌کند. این عملیات ممکن است چند ثانیه زمان ببرد.
        </div>
        <DialogFooter className="gap-2 sm:gap-0 mt-3">
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              لغو
            </Button>
          </DialogClose>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                در حال ساخت مجدد...
              </>
            ) : (
              fnButton
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
