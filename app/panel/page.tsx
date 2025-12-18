import { Button } from "@/components/ui/button";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/data-table";
import {
  songColumns,
  artistColumns,
  albumColumns,
  playlistColumns,
  userColumns,
} from "./columns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music2, Mic2, Disc, ListMusic, Plus, Users } from "lucide-react";

export default async function PanelPage() {
  const [
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
  ] = await Promise.all([
    prisma.song.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.artist.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.album.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.playlist.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.song.count(),
    prisma.artist.count(),
    prisma.album.count(),
    prisma.playlist.count(),
    prisma.user.count(),
  ]);

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

      <Tabs defaultValue="songs" className="space-y-4">
        <TabsList className="glass p-1 bg-background/50 backdrop-blur-md border border-white/10">
          <TabsTrigger value="songs">Songs</TabsTrigger>
          <TabsTrigger value="artists">Artists</TabsTrigger>
          <TabsTrigger value="albums">Albums</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
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
            <DataTable columns={songColumns} data={songs} searchKey="title" />
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
              columns={artistColumns}
              data={artists}
              searchKey="name"
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
            <DataTable columns={albumColumns} data={albums} searchKey="name" />
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
              columns={playlistColumns}
              data={playlists}
              searchKey="name"
            />
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center bg-card/30 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
            <h2 className="text-xl font-semibold">User Management</h2>
          </div>
          <div className="glass rounded-lg border border-white/10 overflow-hidden">
            <DataTable columns={userColumns} data={users} searchKey="name" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
