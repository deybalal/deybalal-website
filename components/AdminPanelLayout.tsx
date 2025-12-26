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
      title: "Total Songs",
      value: stats.songsCount,
      icon: Music2,
      color: "text-blue-500",
    },
    {
      title: "Total Artists",
      value: stats.artistsCount,
      icon: Mic2,
      color: "text-green-500",
    },
    {
      title: "Total Albums",
      value: stats.albumsCount,
      icon: Disc,
      color: "text-purple-500",
    },
    {
      title: "Total Playlists",
      value: stats.playlistsCount,
      icon: ListMusic,
      color: "text-orange-500",
    },
    {
      title: "Total Users",
      value: stats.usersCount,
      icon: Users,
      color: "text-red-500",
    },
    {
      title: "Total Comments",
      value: stats.commentsCount,
      icon: MessageCircle,
      color: "text-yellow-500",
    },
    {
      title: "Lyrics Suggestions",
      value: stats.suggestionsCount,
      icon: FileText,
      color: "text-cyan-500",
    },
  ];

  const tabs = [
    {
      label: "Songs",
      href: "/panel",
      icon: Music2,
      active: pathname === "/panel",
    },
    {
      label: "Artists",
      href: "/panel/artists",
      icon: Mic2,
      active: pathname.startsWith("/panel/artists"),
    },
    {
      label: "Albums",
      href: "/panel/albums",
      icon: Disc,
      active: pathname.startsWith("/panel/albums"),
    },
    {
      label: "Playlists",
      href: "/panel/playlists",
      icon: ListMusic,
      active: pathname.startsWith("/panel/playlists"),
    },
    ...(userRole !== "user"
      ? [
          {
            label: "Users",
            href: "/panel/users",
            icon: Users,
            active: pathname.startsWith("/panel/users"),
          },
        ]
      : []),
    {
      label: "Comments",
      href: "/panel/comments",
      icon: MessageCircle,
      active: pathname.startsWith("/panel/comments"),
    },
    {
      label: "Lyrics Suggestions",
      href: "/panel/suggestions",
      icon: FileText,
      active: pathname.startsWith("/panel/suggestions"),
    },
  ];

  return (
    <div className="space-y-8 w-full p-4 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground neon-text tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Manage your music library content with ease.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="glass hover:bg-white/10">
            <Link href="/">Back to App</Link>
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
