"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface SyncedLyricsEditorProps {
  songId: string;
}

export default function SyncedLyricsEditor({
  songId,
}: SyncedLyricsEditorProps) {
  const router = useRouter();
  const [syncedLyrics, setSyncedLyrics] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSong = async () => {
      try {
        const res = await fetch(`/api/songs/${songId}`);
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            setSyncedLyrics(result.data.syncedLyrics || "");
          }
        }
      } catch (error) {
        console.error("Failed to fetch song", error);
        toast.error("Failed to load synced lyrics");
      } finally {
        setLoading(false);
      }
    };

    fetchSong();
  }, [songId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/lyrics/edit/synced/${songId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncedLyrics }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(result.message || "Synced lyrics updated successfully");
        router.push("/panel");
      } else {
        throw new Error(result.message || "Failed to update synced lyrics");
      }
    } catch (error) {
      console.error("Error saving synced lyrics:", error);
      toast.error("Failed to save synced lyrics");
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
        <h2 className="text-xl font-semibold">Edit Synced Lyrics (LRC)</h2>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Synced Lyrics
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Format: [mm:ss.xx] Lyric line
      </p>
      <Textarea
        value={syncedLyrics}
        onChange={(e) => setSyncedLyrics(e.target.value)}
        placeholder="[00:00.00] Line 1&#10;[00:05.00] Line 2"
        className="min-h-[500px] font-mono text-sm"
      />
    </div>
  );
}
