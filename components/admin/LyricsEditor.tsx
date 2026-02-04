"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { HelpCircle, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LyricsEditorProps {
  songId: string;
  userRole: string;
}

export default function LyricsEditor({ songId, userRole }: LyricsEditorProps) {
  const [lyrics, setLyrics] = useState("");
  const [source, setSource] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isSourceExist, setIsSourceExist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const router = useRouter();

  const isAdmin = userRole === "administrator" || userRole === "moderator";

  useEffect(() => {
    const fetchSong = async () => {
      try {
        const res = await fetch(`/api/songs/${songId}`);
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            setLyrics(result.data.lyrics || "");
            setSource(result.data.lyricsSource || "");

            if (result.data.lyricsSource) {
              setIsSourceExist(true);
            }
            setSourceUrl(result.data.lyricsSourceUrl || "");
          }
        }
      } catch (error) {
        console.error("Failed to fetch song", error);
        toast.error("خطا در دریافت متن آهنگ");
      } finally {
        setLoading(false);
      }
    };

    fetchSong();
  }, [songId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/lyrics/edit/${songId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lyrics, source, sourceUrl }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(
          isAdmin
            ? "متن آهنگ با موفقیت بروزرسانی شد!"
            : "ویرایش متن آهنگ ارسال شد. پس از تایید نمایش داده می شود."
        );
        router.push("/panel");
      } else {
        throw new Error(result.message || "خطا در ذخیره متن آهنگ");
      }
    } catch (error) {
      console.error("Error saving lyrics:", error);
      toast.error("خطا در ذخیره متن آهنگ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-3xl">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {isAdmin ? "ویرایش متن آهنگ" : "پیشنهاد تغییر متن آهنگ"}
        </h2>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">
              <HelpCircle />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-xl border-white/10">
            <DialogHeader>
              <DialogTitle>راهنمای افزودن متن</DialogTitle>
            </DialogHeader>
            <div className="mt-4 flex flex-col gap-y-3">
              <span> 1. لطفا بیت های تکراری را حذف نکنید! </span>
              <span>
                2. متن آهنگ باید دقیقا شبیه به متن شعری باشد که خواننده از روی
                آن می خواند. بدون حذفیات .
              </span>
              <span>
                3. در صورتی که متن آهنگ را از سایتی کپی کرده اید، نام سایت و
                آدرس آن را در کادر های پایین میتوانید وارد کنید.
              </span>
              <span>
                4. متن آهنگ پس از تایید توسط مدیر وبسایت نمایش داده می شود!
              </span>
              <span>
                5. نتیجه ی تایید یا رد شدن متن را می توانید با مراجعه به حساب
                کاربری ببینید.
              </span>
              <span>
                6. پس از تایید شدن آهنگ، نام شما به عنوان &apos;ارسال کننده ی
                متن&apos; در صفحه ی اختصاصی آهنگ نمایش داده می شود.
              </span>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Textarea
        value={lyrics}
        onChange={(e) => setLyrics(e.target.value)}
        placeholder="متن آهنگ را وارد کنید..."
        className="min-h-[500px] font-mono text-sm"
      />

      <Label>منبع (در صورت وجود)</Label>
      <Input
        onChange={(e) => setSource(e.target.value)}
        value={source}
        disabled={!isAdmin && isSourceExist}
        placeholder="سایتی که متن از آن کپی شده"
      />

      <Label>آدرس منبع</Label>
      <Input
        onChange={(e) => setSourceUrl(e.target.value)}
        value={sourceUrl}
        disabled={!isAdmin && isSourceExist}
        placeholder="https://bakhtiarylyrics.blogfa.com/post/50"
      />
      <div className="flex justify-center w-full mt-6">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="text-xl bg-green-600 hover:bg-green-400 text-white"
        >
          {saving ? (
            <Loader2 className="mr-2 size-8 animate-spin" />
          ) : isAdmin ? null : (
            <Send className="mr-2 size-8" />
          )}
          {isAdmin ? "ذخیره متن" : "ارسال ویرایش"}
        </Button>
      </div>
    </div>
  );
}
