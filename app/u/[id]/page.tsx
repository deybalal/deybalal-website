import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, CheckCircle2, HelpCircle, LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userSlug = id;

  if (!userSlug) {
    return notFound();
  }

  const user = await prisma.user.findFirst({
    where: { userSlug },
    include: {
      playlists: {
        where: {
          isPrivate: false,
        },
      },
      badges: {
        include: {
          badge: true,
        },
      },
    },
  });

  if (!user) {
    return notFound();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isOwner = session?.user?.id === user.id;

  if (user.isPrivate && !isOwner) {
    return (
      <div className="container mx-auto px-4 py-8 text-center size-full flex justify-center items-center">
        <h1 className="text-2xl font-bold">This profile is private.</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-background shadow-xl">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground">
              {user.name[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">{user.name}</h1>
          {user.isVerified && (
            <CheckCircle2 className="w-6 h-6 text-blue-500 fill-blue-500/10" />
          )}
        </div>

        {user.badges.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {user.badges.map(({ badge }) => {
              const IconComponent = badge.icon
                ? ((LucideIcons as Record<string, unknown>)[badge.icon] as
                    | LucideIcon
                    | undefined)
                : null;
              return (
                <div
                  key={badge.id}
                  className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20 text-sm font-medium"
                  title={badge.description || badge.name}
                >
                  {IconComponent ? (
                    <IconComponent className="w-3.5 h-3.5" />
                  ) : (
                    badge.icon && <HelpCircle className="w-3.5 h-3.5" />
                  )}
                  {badge.name}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Public Playlists</h2>
        {user.playlists.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No public playlists found.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {user.playlists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlists/${playlist.id}`}
                className="group transition-all hover:scale-105"
              >
                <Card className="h-full overflow-hidden border-none bg-secondary/50 hover:bg-secondary">
                  <div className="aspect-square relative w-full bg-muted flex items-center justify-center">
                    {playlist.coverArt ? (
                      <Image
                        src={playlist.coverArt}
                        alt={playlist.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Music className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="line-clamp-1 text-base">
                      {playlist.name}
                    </CardTitle>
                    {playlist.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground mt-1">
                        {playlist.description}
                      </p>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
