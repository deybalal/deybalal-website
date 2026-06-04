"use client";

import { DataTable } from "@/components/data-table";
import {
  getSongColumns,
  getArtistColumns,
  getAlbumColumns,
  getPlaylistColumns,
  getUserColumns,
  getCommentColumns,
  getLyricsSuggestionColumns,
  getGenreColumns,
  getBadgeColumns,
} from "@/components/columns";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, ArrowDownAZ, PlayCircle } from "lucide-react";
import { SortOption } from "@/components/SortDropdown";

type TableType =
  | "songs"
  | "artists"
  | "albums"
  | "playlists"
  | "users"
  | "comments"
  | "suggestions"
  | "genres"
  | "badges";

interface AdminTableProps {
  data: any[];
  type: TableType;
  userRole?: string;
  pageCount: number;
  pageIndex: number;
}

export default function AdminTable({
  data,
  type,
  userRole,
  pageCount,
  pageIndex,
}: AdminTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onPageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", (page + 1).toString());
    router.push(`?${params.toString()}`);
  };

  const onSearchChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const onSortChange = (sortBy: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSortBy = searchParams.get("sortBy");
    const currentOrder = searchParams.get("sortOrder") || "desc";

    if (currentSortBy === sortBy) {
      // Toggle order
      params.set("sortOrder", currentOrder === "desc" ? "asc" : "desc");
    } else {
      params.set("sortBy", sortBy);
      params.set("sortOrder", "desc");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const searchValue = searchParams.get("q") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  let columns;
  let searchKey = "name";
  let searchKeyTitle = "نام";
// ... (rest of the switch case remains the same)
  switch (type) {
    case "songs":
      columns = getSongColumns(userRole);
      searchKey = "title";
      searchKeyTitle = "عنوان آهنگ";
      break;
    case "artists":
      columns = getArtistColumns(userRole);
      break;
    case "albums":
      columns = getAlbumColumns(userRole);
      searchKeyTitle = "نام آلبوم";
      break;
    case "playlists":
      columns = getPlaylistColumns();
      break;
    case "users":
      columns = getUserColumns(userRole);
      break;
    case "comments":
      columns = getCommentColumns(userRole);
      searchKey = "content";
      searchKeyTitle = "متن";
      break;
    case "suggestions":
      columns = getLyricsSuggestionColumns(userRole);
      searchKey = "song_title";
      searchKeyTitle = "عنوان آهنگ";
      break;
    case "genres":
      columns = getGenreColumns(userRole);
      searchKey = "name";
      searchKeyTitle = "نام سبک";
      break;
    case "badges":
      columns = getBadgeColumns(userRole);
      searchKey = "name";
      searchKeyTitle = "نام نشان";
      break;
  }

  const sortOptions: SortOption[] = [
    { label: "جدیدترین", value: "createdAt", icon: <Clock className="w-4 h-4" /> },
  ];

  if (type === "songs") {
    sortOptions.push(
      { label: "بیشترین پخش", value: "playCount", icon: <PlayCircle className="w-4 h-4" /> },
      { label: "نام (الفبا)", value: "title", icon: <ArrowDownAZ className="w-4 h-4" /> }
    );
  } else if (type === "albums" || type === "artists" || type === "playlists") {
    sortOptions.push({
      label: "نام (الفبا)",
      value: "name",
      icon: <ArrowDownAZ className="w-4 h-4" />,
    });
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey={searchKey}
      searchKeyTitle={searchKeyTitle}
      pageCount={pageCount}
      pageIndex={pageIndex}
      onPageChange={onPageChange}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortChange={onSortChange}
      sortOptions={sortOptions}
    />
  );
}
