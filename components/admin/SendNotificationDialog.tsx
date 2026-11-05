"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";

interface SendNotificationDialogProps {
  user: User;
  children: React.ReactNode;
}

export default function SendNotificationDialog({
  user,
  children,
}: SendNotificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    link: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("اعلان با موفقیت ارسال شد");
        setOpen(false);
        setFormData({ title: "", message: "", link: "" });
      } else {
        toast.error(data.message || "خطا در ارسال اعلان");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("خطا در ارسال اعلان");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>ارسال اعلان برای {user.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="عنوان اعلان را وارد کنید"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">متن پیام</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              placeholder="متن پیام را وارد کنید"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link">لینک (اختیاری)</Label>
            <Input
              id="link"
              value={formData.link}
              onChange={(e) =>
                setFormData({ ...formData, link: e.target.value })
              }
              placeholder="لینک مربوطه را وارد کنید"
              dir="ltr"
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "در حال ارسال..." : "ارسال اعلان"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
