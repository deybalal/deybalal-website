"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "react-hot-toast";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { Save, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DownloadPreferenceFormProps {
  initialPreference: number;
}

export default function DownloadPreferenceForm({
  initialPreference,
}: DownloadPreferenceFormProps) {
  const router = useRouter();
  const [preference, setPreference] = useState(initialPreference.toString());
  const [isLoading, setIsLoading] = useState(false);
  const setDownloadPreference = usePlayerStore(
    (state) => state.setDownloadPreference
  );

  async function handleSave() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ downloadPreference: parseInt(preference) }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update preference");
      }

      setDownloadPreference(parseInt(preference));
      toast.success("Download preference updated");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="mb-8 border-primary/20 bg-linear-to-br from-card to-muted/30 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-primary/10 text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
          </span>
          Playback Quality
        </CardTitle>
        <CardDescription>
          Choose your preferred audio quality for streaming and downloads.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row items-end gap-4">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Select Quality
          </label>
          <Select value={preference} onValueChange={setPreference}>
            <SelectTrigger className="w-full h-12 bg-background/50 backdrop-blur-sm border-primary/10 focus:ring-primary/20">
              <SelectValue placeholder="Select quality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="128" className="cursor-pointer">
                128 kbps (Standard)
              </SelectItem>
              <SelectItem value="320" className="cursor-pointer">
                320 kbps (High Quality)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleSave}
          disabled={isLoading || preference === initialPreference.toString()}
          className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-primary/20 transition-all duration-300 group"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 me-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 me-2 group-hover:scale-110 transition-transform" />
          )}
          Save Preference
        </Button>
      </CardContent>
    </Card>
  );
}
