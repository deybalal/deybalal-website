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
          toast.success(`آهنگ ${song.isActive ? "غیرفعال" : "تایید"} شد!`);
          router.refresh();
        } else {
          toast.error(result.message || "خطا در تغییر وضعیت آهنگ");
        }
      } catch (error) {
        console.error("Error updating song status:", error);
        toast.error("خطا در تغییر وضعیت آهنگ");
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
            `${
              song.isFeatured
                ? "آهنگ از لیست برگزیده ها حذف شد!"
                : "آهنگ به لیست برگزیده ها اضافه شد!"
            }`
          );
          router.refresh();
        } else {
          toast.error(result.message || "خطا در تغییر وضعیت آهنگ");
        }
      } catch (error) {
        console.error("Error updating song status:", error);
        toast.error("خطا در تغییر وضعیت آهنگ");
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
          toast.success("آهنگ حذف شد!");
          router.refresh();
        } else {
          toast.error(result.message || "خطا در حذف آهنگ");
        }
      } catch (error) {
        console.error("Error deleting song:", error);
        toast.error("خطا در حذف آهنگ");
      }
    });
  };

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">باز کردن منو</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-center">مدیریت</DropdownMenuLabel>
        {canApprove && (
          <DropdownMenuItem>
            <Link href={`/panel/edit/${song.id}`} className="w-full">
              ویرایش آهنگ
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem>
          <Link href={`/panel/edit/lyrics/${song.id}`} className="w-full">
            ویرایش متن
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {canApprove && (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={toggleActive}
            disabled={isPending}
          >
            {song.isActive ? "غیرفعال سازی آهنگ" : "تایید آهنگ"}
          </DropdownMenuItem>
        )}
        {isAdmin && (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={toggleFeatured}
            disabled={isPending}
          >
            {song.isFeatured ? "حذف از برگزیده ها" : "انتخاب به عنوان برگزیده"}
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
              title="حذف آهنگ"
              description="آیا از حذف کردن این آهنگ مطمئن هستید؟?"
              fn={deleteSong}
              fnButton="حذف"
            />
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => setSong(song as unknown as PlayerSong)}
        >
          پخش آهنگ
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href={`/song/${song.id}`} className="w-full">
            نمایش آهنگ
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const getSongColumns = (userRole?: string): ColumnDef<Song>[] => [
  {
    accessorKey: "title",
    header: "عنوان",
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
  { accessorKey: "artist", header: "خواننده" },
  { accessorKey: "albumName", header: "آلبوم" },
  {
    accessorKey: "isActive",
    header: "وضعیت",
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
            {isActive ? "تایید شده" : "در انتظار"}
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
    header: "زمان",
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
            `اکانت خواننده ${artist.isVerified ? "غیر رسمی" : "رسمی"} شد!`
          );
          router.refresh();
        } else {
          toast.error(result.message || "خطا در تغییر وضعیت اکانت خواننده!");
        }
      } catch (error) {
        console.error("Error updating artist status:", error);
        toast.error("خطا در تغییر وضعیت اکانت خواننده!");
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
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-center">مدیریت</DropdownMenuLabel>
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
  { accessorKey: "name", header: "نام" },
  {
    accessorKey: "nameEn",
    header: "فتست",
    cell: ({ row }) => {
      const isVerified = row.getValue("isVerified") as boolean;
      console.log(row.original);

      return (
        <div className="flex items-center gap-2">
          {isVerified ? (
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          ) : (
            <XCircle className="h-4 w-4 text-gray-500" />
          )}
          <span className="text-sm font-medium">
            {isVerified ? "اکانت رسمی" : "اکانت غیر رسمی"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "isVerified",
    header: "وضعیت",
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
            {isVerified ? "اکانت رسمی" : "اکانت غیر رسمی"}
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
          toast.success(`آلبوم ${album.isActive ? "غیرفعال" : "تایید"} شد!`);
          router.refresh();
        } else {
          toast.error(result.message || "خطا در تغییر وضعیت آلبوم");
        }
      } catch (error) {
        console.error("Error updating album status:", error);
        toast.error("خطا در تغییر وضعیت آلبوم");
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
            `آلبوم ${
              album.isFeatured
                ? "از لیست برگزینه ها حذف "
                : "به لیست برگزینه ها اضافه "
            } شد`
          );
          router.refresh();
        } else {
          toast.error(result.message || "خطا در تغییر وضعیت آلبوم");
        }
      } catch (error) {
        console.error("Error updating album status:", error);
        toast.error("خطا در تغییر وضعیت آلبوم");
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
          toast.success("آلبوم با موفقیت حذف شد!");
          router.refresh();
        } else {
          toast.error(result.message || "خطا در حذف آلبوم");
        }
      } catch (error) {
        console.error("Error deleting album:", error);
        toast.error("خطا در حذف آلبوم");
      }
    });
  };

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-center">مدیریت</DropdownMenuLabel>
        {canApprove && (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={toggleActive}
            disabled={isPending}
          >
            {album.isActive ? "غیرفعالسازی آلبوم" : "تایید آلبوم"}
          </DropdownMenuItem>
        )}
        {isAdmin && (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={toggleFeatured}
            disabled={isPending}
          >
            {album.isFeatured ? "حذف از برگزیده ها" : "انتخاب به عنوان برگزیده"}
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
              title="حذف آلبوم"
              description="آیا از حذف این آلبوم مطمئن هستید؟"
              fnButton="حذف"
              fn={deleteAlbum}
            />
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const getAlbumColumns = (userRole?: string): ColumnDef<Album>[] => [
  { accessorKey: "name", header: "نام" },
  { accessorKey: "artistName", header: "خواننده" },
  {
    accessorKey: "isActive",
    header: "وضعیت",
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
            {isActive ? "منتشر شده" : "در انتظار"}
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
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-center">مدیریت</DropdownMenuLabel>
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
    header: "عکس",
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
  { accessorKey: "name", header: "نام" },
  {
    accessorKey: "isPrivate",
    header: "نمایش",
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
    header: "ساخته شده در",
    cell: ({ row }) => (
      <div className="font-medium">
        {new Date(row.getValue("createdAt")).toLocaleDateString("fa-IR", {
          numberingSystem: "latn",
        })}
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
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-center">مدیریت</DropdownMenuLabel>
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
    header: "نام",
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
    header: "ایمیل",
  },
  {
    accessorKey: "role",
    header: "نقش",
  },
  {
    accessorKey: "createdAt",
    header: "ساخته شده در",
    cell: ({ row }) => (
      <div className="font-medium">
        {new Date(row.getValue("createdAt")).toLocaleDateString("fa-IR", {
          numberingSystem: "latn",
        })}
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
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-center">مدیریت</DropdownMenuLabel>
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
  { accessorKey: "content", header: "نظر" },
  {
    accessorKey: "postTitle",
    header: "آهنگ/آلبوم",
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
    header: "ارسال شده در",
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as string;
      return (
        <div className="flex items-center gap-2">
          {new Date(createdAt).toLocaleDateString("fa-IR", {
            numberingSystem: "latn",
          })}{" "}
          {new Date(createdAt).toLocaleTimeString("fa-IR", {
            numberingSystem: "latn",
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "وضعیت",
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
            {isActive ? "تایید شده" : "در انتظار تایید"}
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
    header: "آهنگ",
    cell: ({ row }) => (
      <Link
        href={`/song/${row.original.songId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium"
      >
        {row.original.song.title}
        <div className="text-xs text-muted-foreground">
          {row.original.song.artist}
        </div>
      </Link>
    ),
  },
  {
    id: "user_name",
    accessorFn: (row) => row.user.name,
    header: "ارسال شده توسط",
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
    header: "نوع",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <div className="text-sm font-medium">
          {type === "LYRICS" ? "متن" : "متن سینک شده"}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "وضعیت",
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
            {status === "APPROVED" ? "تایید شده" : "رد شده"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "تاریخ",
    cell: ({ row }) => (
      <div className="text-sm">
        {new Date(row.original.createdAt).toLocaleDateString("fa-IR", {
          numberingSystem: "latn",
        })}{" "}
        -{" "}
        {new Date(row.original.createdAt).toLocaleTimeString("fa-IR", {
          numberingSystem: "latn",
        })}
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
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">باز کردن منو</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-center">مدیریت</DropdownMenuLabel>
        <DropdownMenuItem>
          <Link href={`/panel/edit/genre/${genre.id}`} className="w-full">
            ویرایش سبک
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
              title="حذف سبک"
              description="آیا از حذف کردن این سبک اطمینان دارید؟"
              fnButton="حذف"
              fn={deleteGenre}
            />
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const getGenreColumns = (userRole?: string): ColumnDef<Genre>[] => [
  { accessorKey: "name", header: "نام" },
  {
    accessorKey: "slug",
    header: "آدرس(slug)",
    cell: ({ row }) => (
      <Link
        href={`/genres/${row.original.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="ltr text-left"
      >
        <span className="text-sm text-red-200">
          {process.env.NEXT_PUBLIC_DEPLOYED_URL}
        </span>
        <span className="text-sm text-green-400">/{row.original.slug}</span>
      </Link>
    ),
  },

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
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">باز کردن منو</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-center">مدیریت</DropdownMenuLabel>
        <DropdownMenuItem>
          <Link href={`/panel/edit/badge/${badge.id}`} className="w-full">
            ویرایش نشان
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
              title="حذف نشان"
              description="از حذف کردن این نشان اطمینان دارید؟"
              fnButton="حذف"
              fn={deleteBadge}
            />
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const getBadgeColumns = (userRole?: string): ColumnDef<Badge>[] => [
  { accessorKey: "name", header: "نام" },
  { accessorKey: "description", header: "توضیح کوتاه" },
  {
    id: "actions",
    cell: ({ row }) => <BadgeActionsCell row={row} userRole={userRole} />,
  },
];
