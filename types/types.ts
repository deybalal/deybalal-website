export interface Song {
  uri: string;
  links?: Record<number, { url: string; size: string }> | null;
  localUri?: string;
  filename: string;
  title: string | undefined;
  titleEn: string | undefined;
  artist: string | null;
  album: string | null;
  albumId: string | null;
  artists: Artist[];
  coverArt: string | null;
  index: number;
  year?: string | null;
  comment?: string | null;
  date?: number | null;
  duration: number | 0;
  id: string;
  isFavorite?: boolean;
  lyrics?: string | null;
  syncedLyrics?: string | null;
  size?: number;
  playCount?: number;
  lastPlayedAt?: number;
  contributors?: Contributor[];
  genres?: Genre[];
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface Contributor {
  id: string;
  type: string;
  percentage: number;
  user: {
    userSlug: string;
    image: string | null;
    name: string;
  };
}

export type Artist = {
  id: string;
  name: string;
  image: string | null;
  songs: Song[];
  isVerified: boolean;
};

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
