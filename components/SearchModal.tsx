"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search } from "lucide-react";
import SearchInterface from "./SearchInterface";
import { useState } from "react";

interface SearchModalProps {
  scope?: {
    type: "artist" | "album" | "playlist";
    id: string;
    name: string;
  };
  trigger?: React.ReactNode;
}

export default function SearchModal({ scope, trigger }: SearchModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium">
            <Search className="w-4 h-4" />
            <span>جستوجو در {scope?.name || "سایت"}</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-7xl h-[90vh] p-0 bg-background/95 backdrop-blur-3xl border-white/5 overflow-hidden flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>جستوجو {scope ? `در ${scope.name}` : ""}</DialogTitle>
        </DialogHeader>
        <SearchInterface
          onClose={() => setOpen(false)}
          isPage={false}
          scope={scope}
        />
      </DialogContent>
    </Dialog>
  );
}
