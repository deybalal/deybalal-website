"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChangePasswordModal({
  open,
  onOpenChange,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswords(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("لطفاً رمز عبور فعلی خود را وارد کنید.");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      toast.error("رمز عبور جدید باید حداقل ۸ کاراکتر باشد.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("رمز عبور جدید و تکرار آن یکسان نیستند.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "رمز عبور با موفقیت تغییر یافت.");
        handleOpenChange(false);
      } else {
        toast.error(data.message || "خطا در تغییر رمز عبور.");
      }
    } catch (error) {
      console.error("Error submitting password change:", error);
      toast.error("خطای شبکه هنگام ارتباط با سرور.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="glass border-white/10 bg-background/95 backdrop-blur-2xl max-w-md w-full sm:rounded-2xl p-6 shadow-2xl">
        <DialogHeader className="space-y-2 text-right">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                تغییر رمز عبور
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                رمز عبور فعلی و رمز عبور جدید خود را وارد نمایید.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="current-password" className="text-sm font-medium">
              رمز عبور فعلی
            </Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
                className="bg-card/50 border-white/10 pl-10"
              />
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-sm font-medium">
              رمز عبور جدید (حداقل ۸ کاراکتر)
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
                className="bg-card/50 border-white/10 pl-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPasswords ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-medium">
              تکرار رمز عبور جدید
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
                className="bg-card/50 border-white/10 pl-10"
              />
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <div className="flex items-center gap-2 text-xs text-red-400 mt-1">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>رمز عبور جدید و تکرار آن تطابق ندارند.</span>
            </div>
          )}

          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={
                Boolean(
                  loading ||
                    (newPassword &&
                      confirmPassword &&
                      newPassword !== confirmPassword)
                )
              }
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  در حال ثبت...
                </>
              ) : (
                "ثبت رمز عبور جدید"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
