export interface TelegramFile {
  songId: string;
  type: string;
  quality: string;
  fileId: string;
  file_id: string;
  fileUniqueId: string;
  file_unique_id: string;
  uploadedAt?: number | Date;
}

export type SongLinks = Record<
  string | number,
  { url: string; size: string; bytes: number }
>;

export interface Song {
  id: string;
  slug?: string;
  title?: string;
  titleEn?: string | null;
  artist: string;
  artistEn?: string | null;
  artists: Artist[];
  albumName?: string | null;
  coverArt: string | null;
  year?: string | null;
  duration: number;
  uri: string;
  filename: string;
  songIndex?: number;
  index: number;
  lyrics?: string | null;
  syncedLyrics?: string | null;
  playCount?: number;
  downloads?: number;
  isDisabled?: boolean | number;
  disabledDescription?: string | null;
  isActive?: boolean | number;
  isFeatured?: boolean | number;
  album: string | null;
  albumId: string | null;
  userId?: string | null;
  lyricsSource?: string | null;
  lyricsSourceUrl?: string | null;
  ogg?: string | null;
  links?: Record<string | number, { url: string; size: string; bytes: number }> | null;
  date?: number | null;
  genres?: Genre[];
  contributors?: Contributor[];

  playedAtRange?: string;
  addedAt?: string | number;
  createdAt?: number | Date;
  updatedAt?: number | Date;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface TelegramSongWithFiles extends Song {
  telegram?: {
    coverArt: TelegramFile | null;
    ogg: TelegramFile | null;
    "64": TelegramFile | null;
    "128": TelegramFile | null;
    "320": TelegramFile | null;
  };
}

export interface Artist {
  id: string;
  name: string;
  nameEn?: string | null;
  image?: string | null;
  isVerified?: boolean | number;
  ig?: string | null;
  description?: string | null;
  followers?: number;
  userId?: string | null;
  songs?: Song[];
  fileId?: string | null;
  fileUniqueId?: string | null;
  telegramFileId?: string | null;
  telegramFileUniqueId?: string | null;
}

export interface Contributor {
  id: string;
  type: string;
  percentage: number;
  user: {
    userSlug: string;
    instagramHandle?: string | null;
    image: string | null;
    name: string;
  };
}

export interface SearchResult {
  song: Song;
  reason: "title" | "artist" | "lyrics";
  snippet?: string;
}

export interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export type LyricVideoState = {
  songId: string;
  images: string[];
  jobDir: string;
  startMs?: number;
  endMs?: number;
  progressMessageId?: number;
  step: "waiting_images" | "waiting_range" | "rendering" | "waiting_resolution";
  resolution?: VideoResolution;
};

export type VideoResolution = "big" | "small";

export interface VideoJob {
  userId: number;
  chatId: number;

  songId: string;

  title: string;

  resolve: () => void;
  reject: (err: Error) => void;
}

export type Playlist = {
  id: string;
  name: string;
  userId?: string;
  userName?: string;
  profileUrl?: string;
  description?: string;
  songs: Song[];
  songsLength: number;
  duration: number;
  coverArt?: string;
  isFavorite?: boolean;
  isDownload?: boolean;
  isPrivate?: boolean;
  createdAt: number;
  updatedAt: number;
};

export type Album = {
  id: string;
  name: string;
  artistId: string;
  artistName: string;
  coverArt?: string;
  songs: Song[];
  releaseDate: number;
  duration: number;
  genre?: string;
  artist?: Artist | null;
  createdAt: number;
  updatedAt: number;
};
