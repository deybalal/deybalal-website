"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Twitter, Send, Link, Share2, MessageSquareText } from "lucide-react";
import { toast } from "react-hot-toast";

interface ShareButtonsProps {
  title: string;
  url: string;
  shortUrl?: string;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <title>WhatsApp</title>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.006c6.56 0 11.9-5.336 11.902-11.894a11.864 11.864 0 00-3.481-8.413z" />
    </svg>
  );
}

export function ShareButtons({ title, url, shortUrl }: ShareButtonsProps) {
  const [isShareSupported, setIsShareSupported] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setIsShareSupported(typeof navigator !== "undefined" && !!navigator.share);
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(`${title} در پلتفرم دی بلال`);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    sms: `sms:?body=${encodedTitle}%0A${encodedUrl}`, // Use %0A (encoded newline) for formatted sharing
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

  const handleSystemShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `${title} در پلتفرم دی بلال`,
          url: url,
        });
        toast.success("با موفقیت به اشتراک گذاشته شد");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast.error("خطا در به اشتراک گذاری");
        }
      }
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* WhatsApp */}
      <Button
        variant="outline"
        size="icon"
        className="cursor-pointer rounded-full hover:bg-green-500/10 hover:text-green-400 border-white/10 h-9 w-9"
        onClick={() => window.open(shareLinks.whatsapp, "_blank")}
        title="به اشتراک گذاری در واتساپ"
      >
        <WhatsAppIcon className="w-4 h-4" />
      </Button>

      {/* Telegram */}
      <Button
        variant="outline"
        size="icon"
        className="cursor-pointer rounded-full hover:bg-blue-500/10 hover:text-blue-400 border-white/10 h-9 w-9"
        onClick={() => window.open(shareLinks.telegram, "_blank")}
        title="به اشتراک گذاری در تلگرام"
      >
        <Send className="w-4 h-4" />
      </Button>

      {/* Twitter */}
      <Button
        variant="outline"
        size="icon"
        className="cursor-pointer rounded-full hover:bg-blue-500/10 hover:text-blue-400 border-white/10 h-9 w-9"
        onClick={() => window.open(shareLinks.twitter, "_blank")}
        title="به اشتراک گذاری در توییتر"
      >
        <Twitter className="w-4 h-4" />
      </Button>

      {/* SMS */}
      <Button
        variant="outline"
        size="icon"
        className="cursor-pointer rounded-full hover:bg-teal-500/10 hover:text-teal-400 border-white/10 h-9 w-9"
        onClick={() => {
          window.location.href = shareLinks.sms;
        }}
        title="به اشتراک گذاری از طریق پیامک"
      >
        <MessageSquareText className="w-4 h-4" />
      </Button>

      {/* OS Share */}
      {isShareSupported && (
        <Button
          variant="outline"
          size="icon"
          className="cursor-pointer rounded-full hover:bg-orange-500/10 hover:text-orange-400 border-white/10 h-9 w-9"
          onClick={handleSystemShare}
          title="اشتراک‌گذاری با سیستم"
        >
          <Share2 className="w-4 h-4" />
        </Button>
      )}

      {/* Copy Link */}
      <Button
        variant="outline"
        size="icon"
        className="cursor-pointer rounded-full hover:bg-white/10 border-white/10 h-9 w-9"
        onClick={copyToClipboard}
        title="کپی لینک کامل"
      >
        <Link className="w-4 h-4" />
      </Button>

      {/* Short Link */}
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
