"use client";

import SongForm from "@/components/admin/SongForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Send, ArrowRight } from "lucide-react";

export default function NewSongPage() {
  return (
    <div className="flex flex-col items-center justify-center size-full mb-24 relative">
      {/* Non-minimizable Modal for Telegram Bot notification */}
      <Dialog open={true}>
        <DialogContent
          showCloseButton={false}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="sm:max-w-md text-center p-6 border border-border bg-card shadow-2xl backdrop-blur-md"
        >
          <DialogHeader className="flex flex-col items-center gap-3">
            <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1">
              <Send className="size-8" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              ارسال آهنگ از طریق ربات تلگرام
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed mt-2 text-center">
              امکان ارسال و آپلود آهنگ‌های جدید از طریق وب‌سایت غیرفعال شده است. لطفاً برای ثبت و ارسال آهنگ‌های خود از ربات رسمی تلگرام استفاده نمایید:
              <br />
              <span className="inline-block mt-3 px-3 py-1.5 rounded-md bg-secondary text-primary font-mono font-bold text-base select-all dir-ltr">
                @deybalalirbot
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:justify-center">
            <a
              href="https://t.me/deybalalirbot"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                variant="default"
                className="w-full gap-2 cursor-pointer h-11 px-5"
              >
                <Send className="size-4" />
                ورود به ربات تلگرام
              </Button>
            </a>
            <Link href="/panel" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                className="w-full gap-2 cursor-pointer h-11 px-5"
              >
                <ArrowRight className="size-4" />
                برگشت به حساب کاربری
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Underlying Page Structure and Styles */}
      <div className="flex flex-col items-center justify-center w-full h-full">
        <h1 className="text-3xl font-bold text-foreground neon-text mb-5">
          ارسال آهنگ جدید
        </h1>
        <div className="bg-card p-6 rounded-lg border border-border w-full md:w-xl xl:w-3xl">
          <SongForm mode="create" />
        </div>
        <Link href="/panel">
          <Button
            variant="secondary"
            className="h-12 px-6 mt-6 cursor-pointer"
            type="button"
          >
            برگشت به حساب
          </Button>
        </Link>
      </div>
    </div>
  );
}
