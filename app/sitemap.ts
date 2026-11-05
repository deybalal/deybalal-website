import { prisma } from "@/lib/prisma";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_DEPLOYED_URL || "https://deybalal.com";

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/tos`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Dynamic routes - Songs
  const songs = await prisma.song.findMany({
    where: { isActive: true },
    select: { id: true, updatedAt: true },
  });

  const songRoutes: MetadataRoute.Sitemap = songs.map((song) => ({
    url: `${baseUrl}/song/${song.id}`,
    lastModified: song.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Dynamic routes - Artists
  const artists = await prisma.artist.findMany({
    select: { id: true, name: true, updatedAt: true },
  });

  const artistRoutes: MetadataRoute.Sitemap = artists.map((artist) => ({
    url: `${baseUrl}/artist/${artist.id}`, // Using ID as per existing routing
    lastModified: artist.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Dynamic routes - Albums
  const albums = await prisma.album.findMany({
    where: { isActive: true },
    select: { id: true, updatedAt: true },
  });

  const albumRoutes: MetadataRoute.Sitemap = albums.map((album) => ({
    url: `${baseUrl}/album/${album.id}`,
    lastModified: album.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Dynamic routes - Genres
  const genres = await prisma.genre.findMany({
    select: { slug: true, updatedAt: true },
  });

  const genreRoutes: MetadataRoute.Sitemap = genres.map((genre) => ({
    url: `${baseUrl}/genres/${genre.slug}`,
    lastModified: genre.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...songRoutes,
    ...artistRoutes,
    ...albumRoutes,
    ...genreRoutes,
  ];
}
