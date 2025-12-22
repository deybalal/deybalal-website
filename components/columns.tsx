"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import {
  Song,
  Artist,
  Album,
  Playlist,
  User as PrismaUser,
  Comment,
} from "@prisma/client";
import { Song as PlayerSong } from "@/types/types";
import { MoreHorizontal, CheckCircle2, XCircle, Star } from "lucide-react";
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
        <DropdownMenuItem>
          <Link href={`/panel/edit/${song.id}`} className="w-full">
            Edit Song
          </Link>
        </DropdownMenuItem>
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
  { accessorKey: "title", header: "Title" },
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
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <span className="capitalize font-medium">
        {row.getValue("role") as string}
      </span>
    ),
  },
  {
    accessorKey: "isBanned",
    header: "Status",
    cell: ({ row }) => {
      const isBanned = row.getValue("isBanned") as boolean;
      return (
        <div className="flex items-center gap-2">
          {isBanned ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          <span className="text-sm font-medium">
            {isBanned ? "Banned" : "Active"}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <UserActionsCell row={row} userRole={userRole} />,
  },
];

export const getPlaylistColumns = (): ColumnDef<Playlist>[] => [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "description", header: "Description" },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => (
      <div className="font-medium">
        {new Date(row.getValue("createdAt")).toLocaleDateString()}
      </div>
    ),
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
