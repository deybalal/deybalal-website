"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import {
  Song,
  Artist,
  Album,
  Playlist,
  User as PrismaUser,
  Comment,
  LyricsSuggestion,
  Genre,
  Badge,
} from "@prisma/client";
import Image from "next/image";
import { Song as PlayerSong } from "@/types/types";
import {
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Star,
  Eye,
  Check,
  X,
  ListMusic,
  HelpCircle,
  LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import ManageBadgesDialog from "./admin/ManageBadgesDialog";
import AssignArtistDialog from "./admin/AssignArtistDialog";
import LyricsDiff from "./admin/LyricsDiff";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { toast } from "react-hot-toast";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import DialogAlert from "./DialogAlert";
import { cn } from "@/lib/utils";

const SongActionsCell = ({
  row,
  userRole,
}: {
  row: Row<Song>;
  userRole?: string;
}) => {
  const song = row.original;
  const { setSong } = usePlayerStore();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const canApprove = userRole === "moderator" || userRole === "administrator";
  const isAdmin = userRole === "administrator";

  const toggleActive = async () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/songs/${song.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !song.isActive }),
        });
        const result = await response.json();
        if (result.success) {
          toast.success(
            `Song ${song.isActive ? "deactivated" : "approved"} successfully`
          );
          router.refresh();
        } else {
          toast.error(result.message || "Failed to update song status");
        }
      } catch (error) {
        console.error("Error updating song status:", error);
        toast.error("An error occurred while updating song status");
      }
    });
  };

  const toggleFeatured = async () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/songs/${song.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isFeatured: !song.isFeatured }),
        });
        const result = await response.json();
        if (result.success) {
          toast.success(
            `Song ${
              song.isFeatured ? "removed from featured" : "marked as featured"
            } successfully`
          );
          router.refresh();
        } else {
          toast.error(result.message || "Failed to update song status");
        }
      } catch (error) {
        console.error("Error updating song status:", error);
        toast.error("An error occurred while updating song status");
      }
    });
  };

  const deleteSong = async () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/songs/${song.id}`, {
          method: "DELETE",
        });
        const result = await response.json();
        if (result.success) {
          toast.success("Song deleted successfully");
          router.refresh();
        } else {
          toast.error(result.message || "Failed to delete song");
        }
      } catch (error) {
        console.error("Error deleting song:", error);
        toast.error("An error occurred while deleting song");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        {canApprove && (
          <DropdownMenuItem>
            <Link href={`/panel/edit/${song.id}`} className="w-full">
              Edit Song
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem>
          <Link href={`/panel/edit/lyrics/${song.id}`} className="w-full">
            Edit Lyrics
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {canApprove && (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={toggleActive}
            disabled={isPending}
          >
            {song.isActive ? "Deactivate Song" : "Approve Song"}
          </DropdownMenuItem>
        )}
        {isAdmin && (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={toggleFeatured}
            disabled={isPending}
          >
            {song.isFeatured ? "Remove from Featured" : "Mark as Featured"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuItem
            className="cursor-pointer text-red-500 hover:text-red-600"
            disabled={isPending}
            asChild
          >
            <DialogAlert
              title="Delete Song"
              description="Are you sure you want to delete this Song?"
              fn={deleteSong}
              fnButton="Delete"
            />
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => setSong(song as unknown as PlayerSong)}
        >
          Play Song
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href={`/song/${song.id}`} className="w-full">
            Show Song Page
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const getSongColumns = (userRole?: string): ColumnDef<Song>[] => [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const { id, title } = row.original;

      return (
        <Link
          href={`/song/${id}`}
          className="w-full"
          target="_blank"
          rel="noopener noreferrer"
        >
          {title}
        </Link>
      );
    },
  },
  { accessorKey: "artist", header: "Artist" },
  { accessorKey: "albumName", header: "Album" },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;
      const isFeatured = row.original.isFeatured;
      return (
        <div className="flex items-center gap-2">
          {isActive ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-yellow-500" />
          )}
          <span className="text-sm font-medium">
            {isActive ? "Active" : "Pending"}
          </span>
          {isFeatured && (
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => {
      const duration = parseFloat(row.getValue("duration"));
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      return (
        <div className="font-medium">{`${minutes}:${seconds
          .toString()
          .padStart(2, "0")}`}</div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <SongActionsCell row={row} userRole={userRole} />,
  },
];

const ArtistActionsCell = ({
  row,
  userRole,
}: {
  row: Row<Artist>;
  userRole?: string;
}) => {
  const artist = row.original;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const canApprove = userRole === "moderator" || userRole === "administrator";
  const isAdmin = userRole === "administrator";

  const toggleVerified = async () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/artists/${artist.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isVerified: !artist.isVerified }),
        });
        const result = await response.json();
        if (result.success) {
          toast.success(
            `Artist ${
              artist.isVerified ? "unverified" : "verified"
            } successfully`
          );
          router.refresh();
        } else {
          toast.error(result.message || "Failed to update artist status");
        }
      } catch (error) {
        console.error("Error updating artist status:", error);
        toast.error("An error occurred while updating artist status");
      }
    });
  };

  const deleteArtist = async () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/artists/${artist.id}`, {
          method: "DELETE",
        });
        const result = await response.json();
        if (result.success) {
          toast.success("Artist deleted successfully");
          router.refresh();
        } else {
          toast.error(result.message || "Failed to delete artist");
        }
      } catch (error) {
        console.error("Error deleting artist:", error);
        toast.error("An error occurred while deleting artist");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        {canApprove && (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={toggleVerified}
            disabled={isPending}
          >
            {artist.isVerified ? "Unverify Artist" : "Verify Artist"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuItem
            className="cursor-pointer text-red-500 hover:text-red-600"
            disabled={isPending}
            asChild
          >
            <DialogAlert
              title="Delete Artist"
              description="Are you sure you want to delete this Artist?"
              fnButton="Delete"
              fn={deleteArtist}
            />
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const getArtistColumns = (userRole?: string): ColumnDef<Artist>[] => [
  { accessorKey: "name", header: "Name" },
  {
    accessorKey: "isVerified",
    header: "Status",
    cell: ({ row }) => {
      const isVerified = row.getValue("isVerified") as boolean;
      return (
        <div className="flex items-center gap-2">
          {isVerified ? (
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          ) : (
            <XCircle className="h-4 w-4 text-gray-500" />
          )}
          <span className="text-sm font-medium">
            {isVerified ? "Verified" : "Unverified"}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ArtistActionsCell row={row} userRole={userRole} />,
  },
];

const AlbumActionsCell = ({
  row,
  userRole,
}: {
  row: Row<Album>;
  userRole?: string;
}) => {
  const album = row.original;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const canApprove = userRole === "moderator" || userRole === "administrator";
  const isAdmin = userRole === "administrator";

  const toggleActive = async () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/albums/${album.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !album.isActive }),
        });
        const result = await response.json();
        if (result.success) {
          toast.success(
            `Album ${album.isActive ? "deactivated" : "approved"} successfully`
          );
          router.refresh();
        } else {
          toast.error(result.message || "Failed to update album status");
        }
      } catch (error) {
        console.error("Error updating album status:", error);
        toast.error("An error occurred while updating album status");
      }
    });
  };

  const toggleFeatured = async () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/albums/${album.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isFeatured: !album.isFeatured }),
        });
        const result = await response.json();
        if (result.success) {
          toast.success(
            `Album ${
              album.isFeatured ? "removed from featured" : "marked as featured"
            } successfully`
          );
          router.refresh();
        } else {
          toast.error(result.message || "Failed to update album status");
        }
      } catch (error) {
        console.error("Error updating album status:", error);
        toast.error("An error occurred while updating album status");
      }
    });
  };

  const deleteAlbum = async () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/albums/${album.id}`, {
          method: "DELETE",
        });
        const result = await response.json();
        if (result.success) {
          toast.success("Album deleted successfully");
          router.refresh();
        } else {
          toast.error(result.message || "Failed to delete album");
        }
      } catch (error) {
        console.error("Error deleting album:", error);
        toast.error("An error occurred while deleting album");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        {canApprove && (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={toggleActive}
            disabled={isPending}
          >
            {album.isActive ? "Deactivate Album" : "Approve Album"}
          </DropdownMenuItem>
        )}
        {isAdmin && (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={toggleFeatured}
            disabled={isPending}
          >
            {album.isFeatured ? "Remove from Featured" : "Mark as Featured"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuItem
            className="cursor-pointer text-red-500 hover:text-red-600"
            disabled={isPending}
            asChild
          >
            <DialogAlert
              title="Delete Album"
              description="Are you sure you want to delete this Album?"
              fnButton="Delete"
              fn={deleteAlbum}
            />
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const getAlbumColumns = (userRole?: string): ColumnDef<Album>[] => [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "artistName", header: "Artist" },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;
      const isFeatured = row.original.isFeatured;
      return (
        <div className="flex items-center gap-2">
          {isActive ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-yellow-500" />
          )}
          <span className="text-sm font-medium">
            {isActive ? "Active" : "Pending"}
          </span>
          {isFeatured && (
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <AlbumActionsCell row={row} userRole={userRole} />,
  },
];

const PlaylistActionsCell = ({ row }: { row: Row<Playlist> }) => {
  const playlist = row.original;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const deletePlaylist = async () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/playlists/${playlist.id}`, {
          method: "DELETE",
        });
        const result = await response.json();
        if (result.success) {
          toast.success("Playlist deleted successfully");
          router.refresh();
        } else {
          toast.error(result.message || "Failed to delete playlist");
        }
      } catch (error) {
        console.error("Error deleting playlist:", error);
        toast.error("An error occurred while deleting playlist");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer text-red-500 hover:text-red-600"
          disabled={isPending}
          asChild
        >
          <DialogAlert
            title="Delete Playlist"
            description="Are you sure you want to delete this Playlist?"
            fnButton="Delete"
            fn={deletePlaylist}
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const getPlaylistColumns = (): ColumnDef<Playlist>[] => [
  {
    accessorKey: "coverArt",
    header: "Cover",
    cell: ({ row }) => {
      const coverArt = row.getValue("coverArt") as string;
      return (
        <div className="relative w-10 h-10 rounded overflow-hidden">
          {coverArt ? (
            <Image
              src={coverArt}
              alt={row.getValue("name")}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ListMusic className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
        </div>
      );
    },
  },
  { accessorKey: "name", header: "Name" },
  {
    accessorKey: "isPrivate",
    header: "Visibility",
    cell: ({ row }) => {
      const isPrivate = row.getValue("isPrivate") as boolean;
      return (
        <span
          className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            isPrivate
              ? "bg-yellow-500/10 text-yellow-500"
              : "bg-green-500/10 text-green-500"
          )}
        >
          {isPrivate ? "Private" : "Public"}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => (
      <div className="font-medium">
        {new Date(row.getValue("createdAt")).toLocaleDateString()}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <PlaylistActionsCell row={row} />,
  },
];

const UserActionsCell = ({
  row,
  userRole,
}: {
  row: Row<PrismaUser>;
  userRole?: string;
}) => {
  const user = row.original;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isAdmin = userRole === "administrator";

  const updateRole = async (newRole: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/users/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        });
        const result = await response.json();
        if (result.success) {
          toast.success(`User role updated to ${newRole}`);
          router.refresh();
        } else {
          toast.error(result.message || "Failed to update user role");
        }
      } catch (error) {
        console.error("Error updating user role:", error);
        toast.error("An error occurred while updating user role");
      }
    });
  };

  const toggleBanned = async () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/users/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isBanned: !user.isBanned }),
        });
        const result = await response.json();
        if (result.success) {
          toast.success(
            `User ${user.isBanned ? "unbanned" : "banned"} successfully`
          );
          router.refresh();
        } else {
          toast.error(result.message || "Failed to update user status");
        }
      } catch (error) {
        console.error("Error updating user status:", error);
        toast.error("An error occurred while updating user status");
      }
    });
  };

  const toggleVerified = async () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/users/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isVerified: !user.isVerified }),
        });
        const result = await response.json();
        if (result.success) {
          toast.success(
            `User ${user.isVerified ? "unverified" : "verified"} successfully`
          );
          router.refresh();
        } else {
          toast.error(result.message || "Failed to update user status");
        }
      } catch (error) {
        console.error("Error updating user status:", error);
        toast.error("An error occurred while updating user status");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        {isAdmin && (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Change Role</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => updateRole("user")}>
                    User
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateRole("moderator")}>
                    Moderator
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateRole("administrator")}>
                    Administrator
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={toggleVerified}
              disabled={isPending}
            >
              {user.isVerified ? "Unverify User" : "Verify User"}
            </DropdownMenuItem>
            <ManageBadgesDialog user={user}>
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={(e) => e.preventDefault()}
              >
                Manage Badges
              </DropdownMenuItem>
            </ManageBadgesDialog>
            <AssignArtistDialog user={user}>
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={(e) => e.preventDefault()}
              >
                Assign to Artist
              </DropdownMenuItem>
            </AssignArtistDialog>
            <DropdownMenuItem
              className="cursor-pointer text-red-500 hover:text-red-600"
              onClick={toggleBanned}
              disabled={isPending}
            >
              {user.isBanned ? "Unban User" : "Ban User"}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const getUserColumns = (userRole?: string): ColumnDef<PrismaUser>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.image && (
          <div className="relative w-8 h-8 rounded-full overflow-hidden">
            <Image
              src={row.original.image}
              alt={row.original.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        <span>{row.original.name}</span>
        {row.original.isVerified && (
          <CheckCircle2 className="w-4 h-4 text-blue-500" />
        )}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => (
      <div className="font-medium">
        {new Date(row.getValue("createdAt")).toLocaleDateString()}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <UserActionsCell row={row} userRole={userRole} />,
  },
];

const CommentsActionsCell = ({
  row,
  userSlug,
  userRole,
}: {
  row: Row<Comment>;
  userSlug: string;
  userRole?: string;
}) => {
  const comment = row.original;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const canApprove = userRole === "moderator" || userRole === "administrator";
  const isAdmin = userRole === "administrator";

  const toggleVerified = async () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/comments/${comment.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !comment.isActive }),
        });
        const result = await response.json();
        if (result.success) {
          toast.success(
            `Comment ${
              comment.isActive ? "unverified" : "verified"
            } successfully`
          );
          router.refresh();
        } else {
          toast.error(result.message || "Failed to update comment status");
        }
      } catch (error) {
        console.error("Error updating comment status:", error);
        toast.error("An error occurred while updating comment status");
      }
    });
  };

  const deleteComment = async () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/comments/${comment.id}`, {
          method: "DELETE",
        });
        const result = await response.json();
        if (result.success) {
          toast.success("Comment deleted successfully");
          router.refresh();
        } else {
          toast.error(result.message || "Failed to delete comment");
        }
      } catch (error) {
        console.error("Error deleting comment:", error);
        toast.error("An error occurred while deleting comment");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        {canApprove && (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={toggleVerified}
            disabled={isPending}
          >
            {comment.isActive ? "Unverify Comment" : "Verify Comment"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {(isAdmin || userSlug === row.original.userSlug) && (
          <DropdownMenuItem
            className="cursor-pointer text-red-500 hover:text-red-600"
            disabled={isPending}
            asChild
          >
            <DialogAlert
              title="Delete Comment"
              description="Are you sure you want to delete this comment?"
              fnButton="Delete"
              fn={deleteComment}
            />
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const getCommentColumns = (userRole?: string): ColumnDef<Comment>[] => [
  { accessorKey: "content", header: "Comment" },
  {
    accessorKey: "postTitle",
    header: "Post Title",
    cell: ({ row }) => {
      const rowOriginal = row.original;

      const url = rowOriginal.songId
        ? `/song/${rowOriginal.songId}`
        : `/album/${rowOriginal.albumId}`;
      return (
        <div className="flex items-center gap-2">
          <Link
            href={url}
            target="_blank"
            className="underline underline-offset-8 hover:text-blue-500 duration-700"
          >
            {rowOriginal.postTitle}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as string;
      return (
        <div className="flex items-center gap-2">
          {new Date(createdAt).toLocaleDateString()}{" "}
          {new Date(createdAt).toLocaleTimeString()}
        </div>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;
      return (
        <div className="flex items-center gap-2">
          {isActive ? (
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          ) : (
            <XCircle className="h-4 w-4 text-gray-500" />
          )}
          <span className="text-sm font-medium">
            {isActive ? "Verified" : "Unverified"}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <CommentsActionsCell
        row={row}
        userRole={userRole}
        userSlug={row.original.userSlug}
      />
    ),
  },
];

const SuggestionActionsCell = ({
  row,
  userRole,
}: {
  row: Row<
    LyricsSuggestion & {
      song: {
        title: string;
        artist: string;
        lyrics: string | null;
        syncedLyrics: string | null;
      };
      user: { name: string; email: string };
    }
  >;
  userRole?: string;
}) => {
  const suggestion = row.original;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleModerate = async (status: "APPROVED" | "REJECTED") => {
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/lyrics/suggestions/${suggestion.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          }
        );
        const result = await response.json();
        if (result.success) {
          toast.success(`Suggestion ${status.toLowerCase()} successfully`);
          router.refresh();
        } else {
          toast.error(result.message || "Failed to update suggestion");
        }
      } catch (error) {
        console.error("Error updating suggestion:", error);
        toast.error("An error occurred while updating suggestion");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="h-4 w-4" /> View Diff
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Lyrics Suggestion for {suggestion.song.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Suggested by:</span>{" "}
                {suggestion.user.name} ({suggestion.user.email})
              </div>
              <div>
                <span className="font-semibold">Song:</span>{" "}
                {suggestion.song.title} - {suggestion.song.artist}
              </div>
            </div>
            {suggestion.type === "LYRICS" && (
              <div className="space-y-2">
                <h4 className="font-medium">Lyrics Diff</h4>
                <LyricsDiff
                  oldLyrics={suggestion.song.lyrics}
                  newLyrics={suggestion.lyrics}
                />
              </div>
            )}
            {suggestion.type === "SYNCED" && (
              <div className="space-y-2">
                <h4 className="font-medium">Synced Lyrics Diff</h4>
                <LyricsDiff
                  oldLyrics={suggestion.song.syncedLyrics}
                  newLyrics={suggestion.syncedLyrics}
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            {(userRole === "administrator" || userRole === "moderator") && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleModerate("REJECTED")}
                  disabled={isPending || suggestion.status !== "PENDING"}
                >
                  <X className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleModerate("APPROVED")}
                  disabled={isPending || suggestion.status !== "PENDING"}
                >
                  <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const getLyricsSuggestionColumns = (
  userRole?: string
): ColumnDef<
  LyricsSuggestion & {
    song: {
      title: string;
      artist: string;
      lyrics: string | null;
      syncedLyrics: string | null;
    };
    user: { name: string; email: string };
  }
>[] => [
  {
    id: "song_title",
    accessorFn: (row) => row.song.title,
    header: "Song",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.song.title}
        <div className="text-xs text-muted-foreground">
          {row.original.song.artist}
        </div>
      </div>
    ),
  },
  {
    id: "user_name",
    accessorFn: (row) => row.user.name,
    header: "Suggested By",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.user.name}
        <div className="text-xs text-muted-foreground">
          {row.original.user.email}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <div className="text-sm font-medium">
          {type === "LYRICS" ? "Lyrics" : "Synced Lyrics"}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <div className="flex items-center gap-2">
          {status === "APPROVED" ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : status === "REJECTED" ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : (
            <div className="h-4 w-4 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin" />
          )}
          <span
            className={`text-sm font-medium ${
              status === "APPROVED"
                ? "text-green-500"
                : status === "REJECTED"
                ? "text-red-500"
                : "text-yellow-500"
            }`}
          >
            {status}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => (
      <div className="text-sm">
        {new Date(row.original.createdAt).toLocaleDateString()}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <SuggestionActionsCell row={row} userRole={userRole} />,
  },
];

const GenreActionsCell = ({
  row,
  userRole,
}: {
  row: Row<Genre>;
  userRole?: string;
}) => {
  const genre = row.original;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isAdmin = userRole === "administrator";

  const deleteGenre = async () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/genres/${genre.id}`, {
          method: "DELETE",
        });
        const result = await response.json();
        if (result.success) {
          toast.success("Genre deleted successfully");
          router.refresh();
        } else {
          toast.error(result.message || "Failed to delete genre");
        }
      } catch (error) {
        console.error("Error deleting genre:", error);
        toast.error("An error occurred while deleting genre");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem>
          <Link href={`/panel/edit/genre/${genre.id}`} className="w-full">
            Edit Genre
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuItem
            className="cursor-pointer text-red-500 hover:text-red-600"
            disabled={isPending}
            asChild
          >
            <DialogAlert
              title="Delete Genre"
              description="Are you sure you want to delete this Genre?"
              fnButton="Delete"
              fn={deleteGenre}
            />
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const getGenreColumns = (userRole?: string): ColumnDef<Genre>[] => [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "slug", header: "Slug" },

  {
    id: "actions",
    cell: ({ row }) => <GenreActionsCell row={row} userRole={userRole} />,
  },
];

const BadgeActionsCell = ({
  row,
  userRole,
}: {
  row: Row<Badge>;
  userRole?: string;
}) => {
  const badge = row.original;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isAdmin = userRole === "administrator";

  const deleteBadge = async () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/badges/${badge.id}`, {
          method: "DELETE",
        });
        const result = await response.json();
        if (result.success) {
          toast.success("Badge deleted successfully");
          router.refresh();
        } else {
          toast.error(result.message || "Failed to delete badge");
        }
      } catch (error) {
        console.error("Error deleting badge:", error);
        toast.error("An error occurred while deleting badge");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem>
          <Link href={`/panel/edit/badge/${badge.id}`} className="w-full">
            Edit Badge
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuItem
            className="cursor-pointer text-red-500 hover:text-red-600"
            disabled={isPending}
            asChild
          >
            <DialogAlert
              title="Delete Badge"
              description="Are you sure you want to delete this Badge?"
              fnButton="Delete"
              fn={deleteBadge}
            />
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const getBadgeColumns = (userRole?: string): ColumnDef<Badge>[] => [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "description", header: "Description" },
  {
    id: "actions",
    cell: ({ row }) => <BadgeActionsCell row={row} userRole={userRole} />,
  },
];
