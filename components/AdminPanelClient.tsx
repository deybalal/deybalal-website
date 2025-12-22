"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "@/components/data-table";
import {
  getSongColumns,
  getArtistColumns,
  getAlbumColumns,
  getPlaylistColumns,
  getUserColumns,
  getCommentColumns,
} from "./columns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Music2,
  Mic2,
  Disc,
  ListMusic,
  Plus,
  Users,
  MessageCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Song,
  Artist,
  Album,
  Playlist,
  User as PrismaUser,
  Comment,
} from "@prisma/client";

interface AdminPanelClientProps {
  userRole?: string;
  songs: Song[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
  users: PrismaUser[];
  songsCount: number;
  artistsCount: number;
  albumsCount: number;
  playlistsCount: number;
  usersCount: number;
  pageSize: number;
  comments: Comment[];
  commentsCount: number;
  currentPage: {
    songs: number;
    artists: number;
    albums: number;
    playlists: number;
    users: number;
    comments: number;
  };
}

export default function AdminPanelClient({
  userRole,
  songs,
  artists,
  albums,
  playlists,
  users,
  songsCount,
  artistsCount,
  albumsCount,
  playlistsCount,
  usersCount,
  pageSize,
  currentPage,
  comments,
  commentsCount,
}: AdminPanelClientProps) {
  const stats = [
    {
      title: "Total Songs",
      value: songsCount,
      icon: Music2,
      color: "text-blue-500",
    },
    {
      title: "Total Artists",
      value: artistsCount,
      icon: Mic2,
      color: "text-green-500",
    },
    {
      title: "Total Albums",
      value: albumsCount,
      icon: Disc,
      color: "text-purple-500",
    },
    {
      title: "Total Playlists",
      value: playlistsCount,
      icon: ListMusic,
      color: "text-orange-500",
    },
    {
      title: "Total Users",
      value: usersCount,
      icon: Users,
      color: "text-red-500",
    },
    {
      title: "Total Comments",
      value: commentsCount,
      icon: MessageCircle,
      color: "text-yellow-500",
    },
  ];

  const router = useRouter();
  const searchParams = useSearchParams();

  const onPageChange = (tab: string, page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(`${tab}Page`, page.toString());
    router.push(`/panel?${params.toString()}`, { scroll: false });
  };

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
        {stats.map((stat, index) => (
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

      <Tabs defaultValue="songs" className="space-y-6">
        <TabsList className="glass px-2 py-4 bg-background/40 backdrop-blur-xl border border-white/10 w-fit">
          <TabsTrigger
            value="songs"
            className="flex items-center cursor-pointer hover:border-primary gap-2 px-4 py-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
          >
            <Music2 className="h-4 w-4" />
            <span>Songs</span>
          </TabsTrigger>
          <TabsTrigger
            value="artists"
            className="flex items-center cursor-pointer hover:border-primary gap-2 px-4 py-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
          >
            <Mic2 className="h-4 w-4" />
            <span>Artists</span>
          </TabsTrigger>
          <TabsTrigger
            value="albums"
            className="flex items-center cursor-pointer hover:border-primary gap-2 px-4 py-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
          >
            <Disc className="h-4 w-4" />
            <span>Albums</span>
          </TabsTrigger>
          <TabsTrigger
            value="playlists"
            className="flex items-center cursor-pointer hover:border-primary gap-2 px-4 py-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
          >
            <ListMusic className="h-4 w-4" />
            <span>Playlists</span>
          </TabsTrigger>
          {userRole !== "user" && (
            <TabsTrigger
              value="users"
              className="flex items-center cursor-pointer hover:border-primary gap-2 px-4 py-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
            >
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
          )}
          {userRole !== "user" && (
            <TabsTrigger
              value="comments"
              className="flex items-center cursor-pointer hover:border-primary gap-2 px-4 py-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Comments</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="songs" className="space-y-4">
          <div className="flex justify-between items-center bg-card/30 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
            <h2 className="text-xl font-semibold">Songs Library</h2>
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              <Link href="/panel/new/song">
                <Plus className="mr-2 h-4 w-4" /> Add New Song
              </Link>
            </Button>
          </div>
          <div className="glass rounded-lg border border-white/10 overflow-hidden">
            <DataTable
              columns={getSongColumns(userRole)}
              data={songs}
              searchKey="title"
              pageCount={Math.ceil(songsCount / pageSize)}
              pageIndex={currentPage.songs - 1}
              onPageChange={(page) => onPageChange("songs", page + 1)}
            />
          </div>
        </TabsContent>

        <TabsContent value="artists" className="space-y-4">
          <div className="flex justify-between items-center bg-card/30 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
            <h2 className="text-xl font-semibold">Artists Library</h2>
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              <Link href="/panel/new/artist">
                <Plus className="mr-2 h-4 w-4" /> Add New Artist
              </Link>
            </Button>
          </div>
          <div className="glass rounded-lg border border-white/10 overflow-hidden">
            <DataTable
              columns={getArtistColumns(userRole)}
              data={artists}
              searchKey="name"
              pageCount={Math.ceil(artistsCount / pageSize)}
              pageIndex={currentPage.artists - 1}
              onPageChange={(page) => onPageChange("artists", page + 1)}
            />
          </div>
        </TabsContent>

        <TabsContent value="albums" className="space-y-4">
          <div className="flex justify-between items-center bg-card/30 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
            <h2 className="text-xl font-semibold">Albums Library</h2>
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              <Link href="/panel/new/album">
                <Plus className="mr-2 h-4 w-4" /> Add New Album
              </Link>
            </Button>
          </div>
          <div className="glass rounded-lg border border-white/10 overflow-hidden">
            <DataTable
              columns={getAlbumColumns(userRole)}
              data={albums}
              searchKey="name"
              pageCount={Math.ceil(albumsCount / pageSize)}
              pageIndex={currentPage.albums - 1}
              onPageChange={(page) => onPageChange("albums", page + 1)}
            />
          </div>
        </TabsContent>

        <TabsContent value="playlists" className="space-y-4">
          <div className="flex justify-between items-center bg-card/30 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
            <h2 className="text-xl font-semibold">Playlists Library</h2>
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              <Link href="/panel/new/playlist">
                <Plus className="mr-2 h-4 w-4" /> Add New Playlist
              </Link>
            </Button>
          </div>
          <div className="glass rounded-lg border border-white/10 overflow-hidden">
            <DataTable
              columns={getPlaylistColumns()}
              data={playlists}
              searchKey="name"
              pageCount={Math.ceil(playlistsCount / pageSize)}
              pageIndex={currentPage.playlists - 1}
              onPageChange={(page) => onPageChange("playlists", page + 1)}
            />
          </div>
        </TabsContent>

        {userRole !== "user" && (
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center bg-card/30 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
              <h2 className="text-xl font-semibold">User Management</h2>
            </div>
            <div className="glass rounded-lg border border-white/10 overflow-hidden">
              <DataTable
                columns={getUserColumns(userRole)}
                data={users}
                searchKey="name"
                pageCount={Math.ceil(usersCount / pageSize)}
                pageIndex={currentPage.users - 1}
                onPageChange={(page) => onPageChange("users", page + 1)}
              />
            </div>
          </TabsContent>
        )}

        {userRole !== "user" && (
          <TabsContent value="comments" className="space-y-4">
            <div className="flex justify-between items-center bg-card/30 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
              <h2 className="text-xl font-semibold">Comments Management</h2>
            </div>
            <div className="glass rounded-lg border border-white/10 overflow-hidden">
              <DataTable
                columns={getCommentColumns(userRole)}
                data={comments}
                searchKey="content"
                pageCount={Math.ceil(commentsCount / pageSize)}
                pageIndex={currentPage.comments - 1}
                onPageChange={(page) => onPageChange("comments", page + 1)}
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
