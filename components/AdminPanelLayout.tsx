"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Music2,
  Mic2,
  Disc,
  ListMusic,
  Users,
  MessageCircle,
  FileText,
  Tags,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminPanelLayoutProps {
  children: React.ReactNode;
  userRole?: string;
  stats: {
    songsCount: number;
    artistsCount: number;
    albumsCount: number;
    playlistsCount: number;
    usersCount: number;
    commentsCount: number;
    suggestionsCount: number;
  };
}

export default function AdminPanelLayout({
  children,
  userRole,
  stats,
}: AdminPanelLayoutProps) {
  const pathname = usePathname();

  const statItems = [
    {
      title: "تعداد آهنگ ها",
      value: stats.songsCount,
      icon: Music2,
      color: "text-blue-500",
    },
    {
      title: "تعداد خواننده ها",
      value: stats.artistsCount,
      icon: Mic2,
      color: "text-green-500",
    },
    {
      title: "تعداد آلبوم ها",
      value: stats.albumsCount,
      icon: Disc,
      color: "text-purple-500",
    },
    {
      title: "تعداد پلی لیست ها",
      value: stats.playlistsCount,
      icon: ListMusic,
      color: "text-orange-500",
    },
    {
      title: "تعداد کاربران",
      value: stats.usersCount,
      icon: Users,
      color: "text-red-500",
    },
    {
      title: "تعداد نظرات",
      value: stats.commentsCount,
      icon: MessageCircle,
      color: "text-yellow-500",
    },
    {
      title: "تعداد متن آهنگ ارسالی",
      value: stats.suggestionsCount,
      icon: FileText,
      color: "text-cyan-500",
    },
  ];

  const tabs = [
    {
      label: "آهنگ ها",
      href: "/panel",
      icon: Music2,
      active: pathname === "/panel",
    },
    {
      label: "خواننده ها",
      href: "/panel/artists",
      icon: Mic2,
      active: pathname.startsWith("/panel/artists"),
    },
    {
      label: "آلبوم ها",
      href: "/panel/albums",
      icon: Disc,
      active: pathname.startsWith("/panel/albums"),
    },
    {
      label: "پلی لیست ها",
      href: "/panel/playlists",
      icon: ListMusic,
      active: pathname.startsWith("/panel/playlists"),
    },
    ...(userRole !== "user"
      ? [
          {
            label: "کاربران",
            href: "/panel/users",
            icon: Users,
            active: pathname.startsWith("/panel/users"),
          },
        ]
      : []),
    ...(userRole !== "user"
      ? [
          {
            label: "نظرات",
            href: "/panel/comments",
            icon: MessageCircle,
            active: pathname.startsWith("/panel/comments"),
          },
        ]
      : []),

    {
      label: "متن آهنگ ها",
      href: "/panel/suggestions",
      icon: FileText,
      active: pathname.startsWith("/panel/suggestions"),
    },
    ...(userRole !== "user"
      ? [
          {
            label: "سبک ها",
            href: "/panel/genres",
            icon: Tags,
            active: pathname.startsWith("/panel/genres"),
          },
        ]
      : []),
    ...(userRole !== "user"
      ? [
          {
            label: "نشان ها",
            href: "/panel/badges",
            icon: Award,
            active: pathname.startsWith("/panel/badges"),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-8 w-full p-4 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground neon-text tracking-tight">
            حساب کاربری
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            مدیریت آهنگ ها، آلبوم ها، پلی لیست ها، متن آهنگ ها و...
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="glass hover:bg-white/10">
            <Link href="/">برگشت</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statItems.map((stat, index) => (
          <Card
            key={index}
            className="glass border-0 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6 pb-24">
        <div className="glass px-2 py-4 bg-background/40 backdrop-blur-xl border border-white/10 w-fit rounded-lg flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center cursor-pointer hover:border-primary gap-2 px-4 py-2 rounded-md transition-all duration-300",
                tab.active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-white/10"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </Link>
          ))}
        </div>

        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}
