import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

function DialogAlert({
  title,
  description,
  fnButton,
  fn,
}: {
  title: string;
  description: string;
  fnButton: string;
  fn: () => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 p-2 w-full cursor-pointer transition-opacity text-red-500 hover:text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="mr-0.5 h-4 w-4" /> {title}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>این اقدام غیرقابل بازگشت است!</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">{description}</div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">لغو</Button>
          </DialogClose>
          <Button
            onClick={() => fn()}
            className="bg-red-600 hover:bg-red-400 hover:text-foreground cursor-pointer"
          >
            {fnButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DialogAlert;
