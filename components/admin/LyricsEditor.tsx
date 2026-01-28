"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
          {isAdmin ? "Edit Lyrics" : "Suggest Lyrics Changes"}
        </h2>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isAdmin ? null : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {isAdmin ? "ذخیره متن" : "ارسال ویرایش"}
        </Button>
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
    </div>
  );
}
