"use client";

import { Button } from "@/components/ui/button";
import { Twitter, Send, Link, MessageCircle } from "lucide-react";
import { toast } from "react-hot-toast";

interface ShareButtonsProps {
  title: string;
  url: string;
  type: "song" | "album" | "playlist";
}

export function ShareButtons({ title, url, type }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(`Check out this ${type}: ${title}`);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    toast.success("لینک کپی شد!");
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        className="cursor-pointer rounded-full hover:bg-blue-500/10 hover:text-blue-400 border-white/10 h-9 w-9"
        onClick={() => window.open(shareLinks.telegram, "_blank")}
        title="به اشتراک گذاری در تلگرام"
      >
        <Send className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="cursor-pointer rounded-full hover:bg-blue-500/10 hover:text-blue-400 border-white/10 h-9 w-9"
        onClick={() => window.open(shareLinks.twitter, "_blank")}
        title="به اشتراک گذاری در توییتر"
      >
        <Twitter className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="cursor-pointer rounded-full hover:bg-green-500/10 hover:text-green-400 border-white/10 h-9 w-9"
        onClick={() => window.open(shareLinks.whatsapp, "_blank")}
        title="به اشتراک گذاری در واتساپ"
      >
        <MessageCircle className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="cursor-pointer rounded-full hover:bg-white/10 border-white/10 h-9 w-9"
        onClick={copyToClipboard}
        title="کپی کردن لینک"
      >
        <Link className="w-4 h-4" />
      </Button>
    </div>
  );
}
