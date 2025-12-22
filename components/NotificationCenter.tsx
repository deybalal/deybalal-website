"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.data.filter((n: Notification) => !n.isRead).length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 6 minutes and a half
    const interval = setInterval(fetchNotifications, 400000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(
          notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "cursor-pointer relative transition-colors h-10 w-10 rounded-full ring-1 ring-gray-400/30 ",
            unreadCount > 0
              ? "text-orange-400 hover:text-orange-300 animate-pulse duration-18000"
              : "text-gray-400 hover:text-white"
          )}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-blue-500 text-white text-center text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl"
        align="end"
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h4 className="font-bold text-lg">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-white/5">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 transition-colors hover:bg-white/5 relative group ${
                    !notification.isRead ? "bg-blue-500/5" : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 flex-1">
                      <p
                        className={`text-sm font-semibold ${
                          !notification.isRead ? "text-white" : "text-gray-300"
                        }`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markAsRead(notification.id)}
                        className="h-6 w-6 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 z-10"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  {notification.link && (
                    <Link
                      href={notification.link}
                      className="absolute inset-0 z-0"
                      onClick={() =>
                        !notification.isRead && markAsRead(notification.id)
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="w-12 h-12 mb-4 opacity-20" />
              <p>No notifications yet</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
