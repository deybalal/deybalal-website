"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface LyricsEditorProps {
  songId: string;
}

export default function LyricsEditor({ songId }: LyricsEditorProps) {
  const [lyrics, setLyrics] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSong = async () => {
      try {
        const res = await fetch(`/api/songs/${songId}`);
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            setLyrics(result.data.lyrics || "");
          }
        }
      } catch (error) {
        console.error("Failed to fetch song", error);
        toast.error("Failed to load lyrics");
      } finally {
        setLoading(false);
      }
    };

    fetchSong();
  }, [songId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/songs/${songId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lyrics }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success("Lyrics updated successfully");
      } else {
        throw new Error(result.message || "Failed to update lyrics");
      }
    } catch (error) {
      console.error("Error saving lyrics:", error);
      toast.error("Failed to save lyrics");
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
        <h2 className="text-xl font-semibold">Edit Lyrics</h2>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Lyrics
        </Button>
      </div>
      <Textarea
        value={lyrics}
        onChange={(e) => setLyrics(e.target.value)}
        placeholder="Enter song lyrics here..."
        className="min-h-[500px] font-mono text-sm"
      />
    </div>
  );
}
