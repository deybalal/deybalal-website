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
import { Badge, User } from "@prisma/client";
import { Check, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";

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

  const fetchData = useCallback(async () => {
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
      toast.error("خطا در دریافت نشان ها");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, fetchData]);
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
        throw new Error("خطا در ویرایش نشان ها");
      }

      toast.success("نشان با موفقیت ویرایش شد.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating badges:", error);
      toast.error("خطا در ویرایش نشان ها");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ویرایش نشان ها برای &apos;{user.name}&apos;</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto">
              {badges.length > 0 ? (
                badges.map((badge) => {
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
                      <div className="relative w-12 h-12 mb-2 flex items-center justify-center rounded-full bg-muted border border-white/10">
                        <Image
                          src="/images/verified.svg"
                          alt={badge.description || badge.name}
                          width={60}
                          height={60}
                          className="w-9 h-9 text-muted-foreground"
                        />
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-center line-clamp-1 px-1">
                        {badge.name}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center py-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Image
                      src="/images/verified.svg"
                      alt="No Badge"
                      width={60}
                      height={60}
                      className="w-9 h-9 text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">هیچ نشانی وجود ندارد.</p>
                    <p className="text-xs text-muted-foreground">
                      ابتدا باید از پنل مدیریت نشان بسازید.
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/panel/badges">ساخت نشان</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            لفو
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "در حال ذخیره کردن..." : "ذخیره تغییرات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
