"use client";

import { usePlayerStore } from "@/hooks/usePlayerStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function RadioStopWarningDialog() {
  const {
    isRadioWarningOpen,
    confirmPendingPlayAction,
    cancelPendingPlayAction,
  } = usePlayerStore();

  return (
    <Dialog
      open={isRadioWarningOpen}
      onOpenChange={(open) => {
        if (!open) {
          cancelPendingPlayAction();
        }
      }}
    >
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            هشدار توقف رادیو
          </DialogTitle>
          <DialogDescription className="text-base pt-2 text-right">
            شما در حال گوش دادن به رادیو هستید. در صورت پخش آهنگ انتخابی، پخش رادیو
            متوقف خواهد شد.
            <br />
            <br />
            آیا مطمئن هستید که می‌خواهید این آهنگ را پخش کنید؟
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={cancelPendingPlayAction}
            className="w-full sm:w-auto"
          >
            انصراف
          </Button>
          <Button
            variant="destructive"
            onClick={confirmPendingPlayAction}
            className="w-full sm:w-auto block"
          >
            پخش آهنگ و قطع رادیو
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
