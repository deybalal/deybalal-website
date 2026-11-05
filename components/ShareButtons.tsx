"use client";

import { Button } from "@/components/ui/button";
import { Twitter, Send, Link, MessageCircle } from "lucide-react";
import { toast } from "react-hot-toast";

interface ShareButtonsProps {
  title: string;
  url: string;
  shortUrl?: string;
}

export function ShareButtons({ title, url, shortUrl }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(`${title} در پلتفرم دی بلال`);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    toast.success("لینک کپی شد!");
  };

  const copyShortUrlToClipboard = () => {
    if (shortUrl) {
      navigator.clipboard.writeText(shortUrl);
      toast.success("لینک کوتاه کپی شد!");
    }
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
        title="کپی لینک کامل"
      >
        <Link className="w-4 h-4" />
      </Button>
      {shortUrl && (
        <Button
          variant="outline"
          className="cursor-pointer rounded-xl hover:bg-white/10 border-white/10 h-9 px-3 text-xs gap-2"
          onClick={copyShortUrlToClipboard}
          title="کپی لینک کوتاه"
        >
          <Link className="w-3 h-3" />
          لینک کوتاه
        </Button>
      )}
    </div>
  );
}
