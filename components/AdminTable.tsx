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

  let columns;
  let searchKey = "name";
  let searchKeyTitle = "نام";

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

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey={searchKey}
      searchKeyTitle={searchKeyTitle}
      pageCount={pageCount}
      pageIndex={pageIndex}
      onPageChange={onPageChange}
    />
  );
}
