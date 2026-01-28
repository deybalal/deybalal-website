"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Artist, User } from "@prisma/client";
import { Check, Loader2, Search, UserCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AssignArtistDialogProps {
  user: User & { isUserAnArtist?: boolean; artistId?: string | null };
  children: React.ReactNode;
}

export default function AssignArtistDialog({
  user,
  children,
}: AssignArtistDialogProps) {
  const [open, setOpen] = useState(false);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [search, setSearch] = useState("");
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(
    user.artistId || null
  );
  const [isUserAnArtist, setIsUserAnArtist] = useState(
    user.isUserAnArtist || false
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const fetchArtists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/artists");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setArtists(data.data);
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      console.error("Error fetching artists:", error);
      toast.error("خطا در دریافت لیست خواننده ها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchArtists();
    }
  }, [open, fetchArtists]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isUserAnArtist,
          artistId: selectedArtistId,
        }),
      });

      if (!res.ok) {
        throw new Error("خطایی پیش آمد!");
      }

      toast.success("الصاق کاربر به خواننده با موفقیت انجام شد!");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("خطایی پیش آمد!");
    } finally {
      setSaving(false);
    }
  };

  const filteredArtists = artists?.filter((artist) =>
    artist.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            الصاق خواننده به کاربر &apos;{user.name}&apos;
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center space-x-2">
            <Label
              htmlFor="isUserAnArtist"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              این حساب کاربری متعلق به یک خواننده است.
            </Label>
            <Switch
              id="isUserAnArtist"
              checked={isUserAnArtist}
              onCheckedChange={(checked: boolean) => setIsUserAnArtist(checked)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">انتخاب خواننده</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستوجوی خواننده..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="border rounded-md max-h-[200px] overflow-y-auto mt-2">
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredArtists.length > 0 ? (
                filteredArtists.map((artist) => (
                  <div
                    key={artist.id}
                    className={cn(
                      "flex items-center justify-between p-2 cursor-pointer hover:bg-accent transition-colors",
                      selectedArtistId === artist.id && "bg-accent"
                    )}
                    onClick={() => setSelectedArtistId(artist.id)}
                  >
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      <span className="text-sm">{artist.name}</span>
                    </div>
                    {selectedArtistId === artist.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  نتیجه ای پیدا نشد.
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            لغو
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "در حال ذخیره کردن..." : "ذخیره"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
