"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge, User } from "@prisma/client";
import { Check, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ManageBadgesDialogProps {
  user: User;
  children: React.ReactNode;
}

export default function ManageBadgesDialog({
  user,
  children,
}: ManageBadgesDialogProps) {
  const [open, setOpen] = useState(false);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadgeIds, setUserBadgeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [badgesRes, userBadgesRes] = await Promise.all([
        fetch("/api/badges"),
        fetch(`/api/users/${user.id}/badges`),
      ]);

      if (badgesRes.ok) {
        setBadges(await badgesRes.json());
      }
      if (userBadgesRes.ok) {
        const userBadges = await userBadgesRes.json();
        setUserBadgeIds(userBadges.map((b: { badgeId: string }) => b.badgeId));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load badges");
    } finally {
      setLoading(false);
    }
  };

  const toggleBadge = async (badgeId: string) => {
    const isAssigned = userBadgeIds.includes(badgeId);
    const newBadgeIds = isAssigned
      ? userBadgeIds.filter((id) => id !== badgeId)
      : [...userBadgeIds, badgeId];

    setUserBadgeIds(newBadgeIds);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}/badges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeIds: userBadgeIds }),
      });

      if (!res.ok) {
        throw new Error("Failed to update badges");
      }

      toast.success("Badges updated successfully");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating badges:", error);
      toast.error("Failed to update badges");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Badges for {user.name}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto">
              {badges.map((badge) => {
                const isSelected = userBadgeIds.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-lg border cursor-pointer transition-all",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-primary/50"
                    )}
                    onClick={() => toggleBadge(badge.id)}
                  >
                    <div className="relative w-12 h-12 mb-2">
                      {badge.icon ? (
                        <Image
                          src={badge.icon}
                          alt={badge.name}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted rounded-full" />
                      )}
                      {isSelected && (
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground rounded-full p-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-center">
                      {badge.name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
