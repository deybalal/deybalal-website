"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { Laptop, Smartphone, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
      console.error("Failed to fetch sessions", error);
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
        toast.success("Session revoked");
        fetchSessions();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to revoke session");
    }
  }

  function getDeviceIcon(userAgent: string | null) {
    if (!userAgent) return <Globe className="w-5 h-5" />;
    if (userAgent.toLowerCase().includes("mobile"))
      return <Smartphone className="w-5 h-5" />;
    return <Laptop className="w-5 h-5" />;
  }

  if (isLoading) return <div>Loading sessions...</div>;

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
                {session.ipAddress || "Unknown IP"}
                {session.isCurrent && (
                  <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {session.userAgent
                  ? session.userAgent.substring(0, 50) + "..."
                  : "Unknown Device"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Started {formatDistanceToNow(new Date(session.createdAt))} ago
              </div>
            </div>
          </div>
          {!session.isCurrent && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => revokeSession(session.id)}
            >
              Revoke
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
