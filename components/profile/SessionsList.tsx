"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { Laptop, Smartphone, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

interface Session {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export default function SessionsList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    try {
      const response = await fetch("/api/user/sessions");
      const result = await response.json();
      if (result.success) {
        setSessions(result.data);
      }
    } catch (error) {
      console.error("خطا در دریافت لیست نشست‌ها", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function revokeSession(sessionId: string) {
    try {
      const response = await fetch(`/api/user/sessions?id=${sessionId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        toast.success("نشست با موفقیت لغو شد");
        fetchSessions();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("خطا در لغو نشست");
    }
  }

  function getDeviceIcon(userAgent: string | null) {
    if (!userAgent) return <Globe className="w-5 h-5" />;
    if (userAgent.toLowerCase().includes("mobile"))
      return <Smartphone className="w-5 h-5" />;
    return <Laptop className="w-5 h-5" />;
  }

  if (isLoading) return <div>در حال بارگذاری نشست‌ها...</div>;

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="flex items-center justify-between p-4 border rounded-lg bg-card"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 bg-muted rounded-full">
              {getDeviceIcon(session.userAgent)}
            </div>
            <div>
              <div className="font-medium flex items-center gap-2">
                {session.ipAddress || "آی‌پی ناشناخته"}
                {session.isCurrent && (
                  <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">
                    فعلی
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {session.userAgent
                  ? session.userAgent.substring(0, 50) + "..."
                  : "دستگاه ناشناخته"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                شروع شده از{" "}
                {formatDistanceToNow(new Date(session.createdAt), {
                  locale: faIR,
                })}{" "}
                قبل
              </div>
            </div>
          </div>
          {!session.isCurrent && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => revokeSession(session.id)}
            >
              لغو دسترسی
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
