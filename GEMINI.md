# Dey Balal (دی بلال) - Backend & API Reference for Android App

This document provides a complete technical guide to the **Dey Balal** backend (Next.js 16 + Prisma + MySQL + Better-Auth). It describes all API endpoints, data models, authentication flows, and integration guidelines needed to build a native Android client application.

---

## Table of Contents

1. [App Overview & Architecture](#app-overview--architecture)
2. [Authentication & Session Management for Android](#authentication--session-management-for-android)
3. [Media & Audio Streaming Architecture](#media--audio-streaming-architecture)
4. [Play Count Anti-Tamper Verification (Hash System)](#play-count-anti-tamper-verification-hash-system)
5. [Acoustic Audio Identification (Shazam-like)](#acoustic-audio-identification-shazam-like)
6. [24/7 Radio Station Engine](#247-radio-station-engine)
7. [Prisma Data Models & Enums](#prisma-data-models--enums)
8. [Complete API Route Directory](#complete-api-route-directory)
   - [Authentication & User Account](#1-authentication--user-account)
   - [Songs](#2-songs)
   - [Albums](#3-albums)
   - [Artists](#4-artists)
   - [Playlists](#5-playlists)
   - [Favorites](#6-favorites)
   - [Comments](#7-comments)
   - [Lyrics & Synced Lyrics](#8-lyrics--synced-lyrics)
   - [Radio](#9-radio)
   - [Search](#10-search)
   - [Audio Identification (Acoustic Fingerprinting)](#11-audio-identification-acoustic-fingerprinting)
   - [Notifications](#12-notifications)
   - [Badges](#13-badges)
   - [Administration & User Management](#14-administration--user-management)
   - [Media Uploads & Server Player (Dev/Proxy)](#15-media-uploads--server-player-devproxy)
   - [Security & Captcha](#16-security--captcha)
9. [Android Client Implementation Recommendations](#android-client-implementation-recommendations)

---

## App Overview & Architecture

**Dey Balal** is a specialized music streaming, lyrics, radio, and music discovery platform designed for Iranian folk/Bakhtiari music and general regional cataloging.

### Tech Stack
- **Framework:** Next.js 16 (App Router) running on Node.js.
- **ORM & Database:** Prisma ORM connected to MySQL.
- **Authentication:** Better-Auth with MySQL adapter + Custom Telegram Bot OAuth flow.
- **Audio & Media:**
  - Multi-bitrate encoding: 64kbps, 128kbps, 320kbps MP3s.
  - 30-second OGG previews.
  - Synchronized lyrics (LRC format parsed by millisecond intervals).
  - Acoustic fingerprint recognition powered by Dejavu algorithm.
- **Hosting / Asset Delivery:** Static assets served under `/assets/mp3/`, `/assets/ogg/`, and `/assets/cover/`.

---

## Authentication & Session Management for Android

> [!IMPORTANT]
> Standard email & password registration/login is **disabled** on this platform (`POST /api/login`, `POST /api/signup`, `POST /api/mobile/login` all return `403 Forbidden`).
>
> Users authenticate through **Telegram Bot Login** or Social Providers (Google, GitHub, Instagram, etc.).

### 1. Telegram Login Flow for Android
The recommended login flow on mobile is via the Telegram bot:

```
+---------------+                +----------------+                +---------------+
|  Android App  |                | DeyBalal Server|                |  Telegram App |
+---------------+                +----------------+                +---------------+
        |                                |                                 |
        | 1. POST /api/auth/telegram/create                               |
        |------------------------------->|                                 |
        | 2. Returns token, deepLink     |                                 |
        |<-------------------------------|                                 |
        |                                                                  |
        | 3. Open deepLink (`tg://resolve?domain=<bot>&start=login_<token>`) |
        |----------------------------------------------------------------->|
        |                                                                  | User taps 'Start'
        |                                4. Bot sends verify webhook       |
        |                                   (POST /api/auth/telegram/verify)
        |                                |<--------------------------------|
        |                                                                  |
        | 5. Poll GET /api/auth/telegram/status?token=<token>              |
        |------------------------------->|                                 |
        |    (returns status: PENDING)   |                                 |
        |                                |                                 |
        | 6. Poll GET /api/auth/telegram/status?token=<token>              |
        |------------------------------->|                                 |
        | 7. Returns APPROVED + Set-Cookie: dey.session_token=<signedToken>|
        |<-------------------------------|                                 |
```

### 2. Handling Sessions in Android (OkHttp / Retrofit)
Better-Auth uses signed session tokens stored in cookies or Bearer Authorization headers:
- **Cookie Name:** `dey.session_token` (in local/dev) or `__Secure-dey.session_token` (in production).
- **Persistent CookieJar:** Configure OkHttp with a persistent `CookieJar` (e.g. `PersistentCookieJar` or custom `SharedPreferences` cookie jar) so session cookies are automatically attached to all requests.
- **Bearer Token:** You can also extract the raw session token from the user session and send:
  ```http
  Authorization: Bearer <session_token>
  ```

---

## Media & Audio Streaming Architecture

### Song Audio Sources
Each active song in the database has:
- `uri`: Default playback path (usually relative `/assets/mp3/<filename>-128.mp3`).
- `ogg`: 30-second preview audio path (relative `/assets/ogg/<songId>.ogg`).
- `links`: JSON object containing audio variants:
  ```json
  {
    "64": {
      "url": "/assets/mp3/artist-title-64.mp3",
      "size": "1.8 MB",
      "bytes": 1887436
    },
    "128": {
      "url": "/assets/mp3/artist-title-128.mp3",
      "size": "3.5 MB",
      "bytes": 3670016
    },
    "320": {
      "url": "/assets/mp3/artist-title-320.mp3",
      "size": "8.8 MB",
      "bytes": 9227468
    }
  }
  ```

### Resolving Absolute URLs
All `uri`, `coverArt`, and `links.*.url` fields returned from the API are relative to the server origin (unless they start with `http://` or `https://`).
Android client must resolve them against `BASE_URL`:
```kotlin
fun resolveMediaUrl(baseUrl: String, relativeUrl: String?): String? {
    if (relativeUrl.isNullOrEmpty()) return null
    return if (relativeUrl.startsWith("http://") || relativeUrl.startsWith("https://")) {
        relativeUrl
    } else {
        "${baseUrl.trimEnd('/')}/${relativeUrl.trimStart('/')}"
    }
}
```

---

## Play Count Anti-Tamper Verification (Hash System)

When incrementing a song's play count (`POST /api/songs/[id]/play`), the backend requires a cryptographically validated payload to prevent replay and fake-play attacks.

### Algorithm Specification
1. **Inputs:**
   - `url`: Path string `/api/songs/<id>/play`
   - `timestamp`: Current Unix timestamp in seconds (`Math.floor(Date.now() / 1000)`)
   - `userTimeInfo`: An object containing:
     ```json
     {
       "localTime": "YYYY-MM-DDTHH:mm:ss.sssZ",
       "timezone": "Asia/Tehran"
     }
     ```
   - `HASH_SECRET`: Shared secret key configured in client and server (`HASH_SECRET`).
2. **Signature computation:**
   ```
   rawString = "${timestamp}:${url}:${HASH_SECRET}:${JSON.stringify(userTimeInfo)}"
   signature = sha256_hex(rawString)
   ```
3. **Payload Structure:**
   ```json
   {
     "t": 1740000000,
     "u": {
       "localTime": "2026-09-21T09:10:00.000Z",
       "timezone": "Asia/Tehran"
     },
     "s": "<hex_sha256_signature>"
   }
   ```
4. **Packing:**
   Encode the JSON string into **Base64** without line breaks.
5. **Request Body:**
   ```json
   {
     "hash": "<base64_encoded_payload>"
   }
   ```
6. **Expiration:** Server rejects hashes where `|current_timestamp - t| > 60` seconds.

---

## Acoustic Audio Identification (Shazam-like)

Endpoint: `POST /api/identify`

The app allows users to identify music playing in the environment or uploaded from storage:
1. Android app records 5–15 seconds of audio (WAV, MP3, OGG, FLAC, M4A).
2. Sends the audio data as `multipart/form-data` with key `file` (or raw body).
3. The server extracts acoustic fingerprints and performs combinatorial peak matching against indexed audio hashes.
4. Returns matching confidence percentage (`0-100%`), primary song candidate, time offset, and alternate candidate songs.

---

## 24/7 Radio Station Engine

Endpoints:
- `GET /api/radio/state`: Real-time state of the 24/7 stream.
- `GET /api/radio/history/today`: All tracks that have played today up to the current moment.

### How it works:
- Every night, a 24-hour playlist (`RadioPlaylist`) is prepared containing `RadioTrack` entries with `order`, `duration`, and cumulative `startOffset` (in seconds).
- When the Android app queries `GET /api/radio/state`, the server calculates the current elapsed time since `startTime` and returns:
  - `currentTrack`: The song currently playing.
  - `currentTrack.position`: Exact position (in seconds) within that track.
  - `nextTrack`: Next upcoming song.
  - `serverTime`: Epoch timestamp on the server for clock synchronization.
- Android player can sync its `ExoPlayer` directly to `currentTrack.position` and seamlessly play the live station.

---

## Prisma Data Models & Enums

### Core Enums
```prisma
enum Role {
  user
  moderator
  administrator
}

enum SuggestionStatus {
  PENDING
  APPROVED
  REJECTED
}

enum SuggestionType {
  LYRICS
  SYNCED
}
```

### Models Summary
- **User:** `id`, `name`, `email`, `image`, `bio`, `isPrivate`, `isBanned`, `role`, `isVerified`, `isUserAnArtist`, `artistId`, `userIndex`, `userSlug`, `instagramHandle`, `downloadPreference` (64, 128, 320).
- **Song:** `id`, `slug`, `title`, `titleEn`, `artist`, `artistEn`, `albumName`, `coverArt`, `year`, `duration`, `uri`, `filename`, `lyrics`, `syncedLyrics`, `playCount`, `isActive`, `isDisabled`, `disabledDescription`, `isFeatured`, `albumId`, `userId`, `links` (Json).
- **Album:** `id`, `name`, `artistName`, `artistNameEn`, `coverArt`, `releaseDate`, `duration`, `isActive`, `isFeatured`, `artistId`, `userId`.
- **Artist:** `id`, `name`, `nameEn`, `image`, `description`, `isVerified`, `userId`, `ig`, `igFollowers`.
- **Playlist:** `id`, `name`, `description`, `coverArt`, `duration`, `isFavorite`, `isDownload`, `isPrivate`, `userId`.
- **Comment:** `id`, `content`, `userId`, `userSlug`, `songId`, `albumId`, `postTitle`, `isActive`, `isDeleted`, `parentId`.
- **LyricsSuggestion:** `id`, `songId`, `userId`, `lyrics`, `syncedLyrics`, `status`, `type`, `lyricsSource`, `lyricsSourceUrl`.
- **Notification:** `id`, `userId`, `type`, `title`, `message`, `link`, `isRead`.
- **Genre:** `id`, `name`, `slug`.
- **Badge:** `id`, `name`, `description`.

---

## Complete API Route Directory

### 1. Authentication & User Account

#### 1.1 `POST /api/auth/telegram/create`
Generates a login ticket and Telegram bot deep link.
- **Auth:** Public
- **Request Body:** None
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "token": "4f9a7c...",
    "botUsername": "deybalalirbot",
    "botUrl": "https://t.me/deybalalirbot?start=login_4f9a7c...",
    "deepLink": "tg://resolve?domain=deybalalirbot&start=login_4f9a7c...",
    "expiresAt": "2026-09-21T09:15:00.000Z"
  }
  ```

#### 1.2 `GET /api/auth/telegram/status?token=<token>`
Polls the status of the Telegram login ticket.
- **Auth:** Public
- **Query Params:** `token` (String, required)
- **Response Pending `200 OK`:**
  ```json
  {
    "status": "PENDING"
  }
  ```
- **Response Approved `200 OK`:**
  (Also sends `Set-Cookie: dey.session_token=...`)
  ```json
  {
    "status": "APPROVED",
    "success": true,
    "user": {
      "id": "cuid...",
      "name": "نام کاربر",
      "userSlug": "ab12cd34ef",
      "image": "/assets/avatars/user.jpg"
    },
    "downloadPreference": 128
  }
  ```
- **Response Expired/Error `200 OK / 403 Forbidden`:**
  ```json
  {
    "status": "EXPIRED",
    "message": "مهلت زمان ورود به پایان رسیده است"
  }
  ```

#### 1.3 `POST /api/auth/telegram/verify`
Server-to-server webhook invoked by the Telegram Bot.
- **Auth:** Header `x-telegram-bot-secret: <secret>`
- **Request Body:**
  ```json
  {
    "token": "4f9a7c...",
    "telegramUser": {
      "id": 123456789,
      "first_name": "Reza",
      "last_name": "Bahrami",
      "username": "rezabahrami",
      "photo_url": "https://..."
    }
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "ورود با موفقیت تأیید شد!",
    "user": { "id": "...", "name": "...", "userSlug": "..." }
  }
  ```

#### 1.4 `GET /api/auth/[...all]` & `POST /api/auth/[...all]`
Standard Better-Auth engine endpoints:
- `GET /api/auth/get-session`: Returns the active user session and user profile.
- `POST /api/auth/sign-out`: Logs out the current session and clears cookies.

#### 1.5 `PATCH /api/user/profile`
Updates current logged-in user's profile.
- **Auth:** Required (Session)
- **Request Body:**
  ```json
  {
    "name": "نام جدید",
    "isPrivate": false,
    "bio": "درباره من...",
    "downloadPreference": 320
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "isPrivate": false,
      "downloadPreference": 320
    },
    "message": "پروفایل با موفقیت ویرایش شد!"
  }
  ```

#### 1.6 `POST /api/user/change-password`
Changes or sets user password.
- **Auth:** Required (Session)
- **Request Body:**
  ```json
  {
    "currentPassword": "oldPassword123",
    "newPassword": "newSecurePassword123",
    "isForgotMode": false
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "رمز عبور با موفقیت تغییر یافت!"
  }
  ```

---

### 2. Songs

#### 2.1 `GET /api/songs`
Paginated list of active songs.
- **Auth:** Public
- **Query Params:**
  - `page` (default: 1)
  - `limit` (default: 50)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "cuid...",
        "slug": "lor-song-slug",
        "title": "دی بلال",
        "titleEn": "Dey Balal",
        "artist": "مسعود بختیاری",
        "artistEn": "Masoud Bakhtiari",
        "coverArt": "/assets/cover/deybalal.jpg",
        "duration": 245,
        "year": 1378,
        "playCount": 1420,
        "isDisabled": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 520,
      "totalPages": 11
    }
  }
  ```

#### 2.2 `GET /api/songs/[id]`
Detailed song profile by ID.
- **Auth:** Public
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "id": "song_id",
      "slug": "song-slug",
      "title": "نام آهنگ",
      "titleEn": "Song Title",
      "artist": "نام خواننده",
      "artistEn": "Artist Name",
      "albumName": "نام آلبوم",
      "albumId": "album_id",
      "coverArt": "/assets/cover/song.jpg",
      "duration": 210,
      "year": 1402,
      "uri": "/assets/mp3/song-128.mp3",
      "ogg": "/assets/ogg/song_id.ogg",
      "filename": "song-128.mp3",
      "lyrics": "متن ترانه...",
      "syncedLyrics": "[00:12.30]متن هماهنگ\n[00:15.50]خط دوم...",
      "playCount": 350,
      "links": {
        "64": { "url": "/assets/mp3/song-64.mp3", "size": "1.5 MB", "bytes": 1572864 },
        "128": { "url": "/assets/mp3/song-128.mp3", "size": "3.1 MB", "bytes": 3250585 },
        "320": { "url": "/assets/mp3/song-320.mp3", "size": "7.8 MB", "bytes": 8178892 }
      },
      "artists": [{ "id": "...", "name": "...", "image": "..." }],
      "crew": [{ "id": "...", "role": "تنظیم", "name": "..." }],
      "genres": [{ "id": "...", "name": "بختیاری", "slug": "bakhtiari" }]
    }
  }
  ```

#### 2.3 `POST /api/songs/[id]/play`
Increments the play count of a song.
- **Auth:** Public, but requires **Anti-Tamper Hash**.
- **Request Body:**
  ```json
  {
    "hash": "<base64_packed_hash>"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true
  }
  ```
- **Response `403 Forbidden`:**
  ```json
  {
    "success": false,
    "message": "درخواست نامعتبر است"
  }
  ```

#### 2.4 `GET /api/songs/random-play`
Fetches a single random active song for shuffle / discovery.
- **Auth:** Public
- **Response `200 OK`:** Returns a complete `Song` object with relations (artists, album, genres).

#### 2.5 `GET /api/songs/random-synced`
Returns a random song snippet (first 4 lines of synced lyrics) for UI lyric quotes / banners.
- **Auth:** Public
- **Response `200 OK`:**
  ```json
  {
    "id": "cuid...",
    "title": "دی بلال",
    "singer": "مسعود بختیاری",
    "lyrics": [
      { "time": 12.3, "text": "آرمونم تیت بی" },
      { "time": 15.5, "text": "دی بلال دی بلال" },
      { "time": 19.2, "text": "آخی وای..." },
      { "time": 24.0, "text": "..." }
    ]
  }
  ```

#### 2.6 `POST /api/songs/check-duplicate`
Checks for duplicate songs before submission based on title, duration, and artist IDs.
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "title": "دی بلال",
    "titleEn": "Dey Balal",
    "duration": 210,
    "artistIds": ["artist_id_1"]
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "cuid...",
        "title": "دی بلال",
        "titleEn": "Dey Balal",
        "duration": 212,
        "slug": "dey-balal",
        "artists": [{ "name": "مسعود بختیاری" }]
      }
    ]
  }
  ```

#### 2.7 `POST /api/songs/download`
Adds a song to the user's special `"لیست دانلود"` (Download Queue Playlist).
- **Auth:** Required (Session)
- **Request Body:**
  ```json
  {
    "songId": "song_cuid"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "به لیست مورد علاقه ها اضافه شد!"
  }
  ```

#### 2.8 `PUT /api/songs/[id]`
Moderates or updates song metadata.
- **Auth:** Required (`moderator` or `administrator`)
- **Request Body:** Partial `Song` fields.
- **Response `200 OK`:** Updated `Song` object.

#### 2.9 `DELETE /api/songs/[id]`
Deletes song (Admins delete DB record + physical audio files; Moderators soft-delete by setting `isDisabled: true`).
- **Auth:** Required (`moderator` or `administrator`)

---

### 3. Albums

#### 3.1 `GET /api/albums`
Returns all active albums (if logged in as verified artist, filters to that artist's albums).
- **Auth:** Public
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "album_cuid",
        "name": "هی جار",
        "artistName": "مسعود بختیاری",
        "artistNameEn": "Masoud Bakhtiari",
        "coverArt": "/assets/cover/album.jpg",
        "releaseDate": 1371,
        "duration": 2800,
        "songs": [...]
      }
    ]
  }
  ```

#### 3.2 `GET /api/albums/[id]`
Retrieves album metadata and songs sorted by index.
- **Auth:** Public
- **Parameter:** `id` (Album ID)
- **Response `200 OK`:** Single `Album` object with `songs` and `artist`.

#### 3.3 `GET /api/albums/[id]/songs`
Returns all active songs in the album without pagination (used to queue an entire album into the audio player).
- **Auth:** Public
- **Parameter:** `id` (Album ID or Name)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [ /* Array of normalized Song objects */ ]
  }
  ```

#### 3.4 `POST /api/albums/create`
Creates a new album.
- **Auth:** Required (Session). If user is an artist, they can only create albums for their own `artistId`.
- **Request Body:**
  ```json
  {
    "name": "نام آلبوم",
    "artistName": "نام خواننده",
    "nameEn": "Artist Name English",
    "artistId": "optional_artist_id",
    "coverArt": "/assets/cover/album.jpg",
    "releaseDate": "1402"
  }
  ```

#### 3.5 `PUT /api/albums/[id]` & `DELETE /api/albums/[id]`
Updates album metadata (`moderator` or `administrator`) or deletes album (`administrator` only).

---

### 4. Artists

#### 4.1 `GET /api/artists`
Returns all registered artists (sorted alphabetically).
- **Auth:** Public (cached in-memory for 5 minutes).
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "artist_cuid",
        "name": "مسعود بختیاری",
        "nameEn": "Masoud Bakhtiari",
        "image": "/assets/artists/masoud.jpg",
        "isVerified": true
      }
    ]
  }
  ```

#### 4.2 `GET /api/artists/[id]`
Fetches artist profile with all songs and albums.
- **Auth:** Public
- **Parameter:** `id` (Artist ID or URL-encoded Name)
- **Response `200 OK`:** Artist object including `songs` and `albums`.

#### 4.3 `GET /api/artists/[id]/songs`
Fetches all active songs for the artist (unpaginated, used for player playback queue).
- **Auth:** Public
- **Parameter:** `id` (Artist ID or URL-encoded Name)

#### 4.4 `GET /api/artists/[id]/follow`
Checks if the current authenticated user is following the artist.
- **Auth:** Public (returns `isFollowing: false` if not logged in).
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "isFollowing": true
  }
  ```

#### 4.5 `POST /api/artists/[id]/follow`
Toggles follow / unfollow for the artist.
- **Auth:** Required (Session)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "isFollowing": true
  }
  ```

#### 4.6 `POST /api/artists/create`
Creates a new artist.
- **Auth:** Required (Session)
- **Request Body:**
  ```json
  {
    "name": "نام هنرمند",
    "nameEn": "Artist English",
    "image": "/assets/artists/photo.jpg",
    "description": "زندگینامه و بیوگرافی..."
  }
  ```

---

### 5. Playlists

#### 5.1 `GET /api/playlists`
Retrieves the logged-in user's playlists (paginated).
- **Auth:** Required (Session)
- **Query Params:** `page` (default: 1), `limit` (default: 50)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "playlist_cuid",
        "name": "پلی لیست من",
        "description": "توضیحات...",
        "coverArt": "/assets/cover/song.jpg",
        "duration": 650,
        "isFavorite": false,
        "isDownload": false,
        "isPrivate": true,
        "songs": [ /* Top songs for preview */ ]
      }
    ],
    "pagination": { "page": 1, "limit": 50, "total": 3, "totalPages": 1 }
  }
  ```

#### 5.2 `POST /api/playlists/create`
Creates a user playlist.
- **Auth:** Required (Session)
- **Request Body:**
  ```json
  {
    "name": "نام پلی لیست",
    "description": "توضیحات اختیاری",
    "coverArt": "/optional/cover.jpg"
  }
  ```

#### 5.3 `GET /api/playlists/[id]`
Gets playlist details and its songs.
- **Auth:** Required (Must own the playlist if it is private).

#### 5.4 `PATCH /api/playlists/[id]`
Updates playlist visibility.
- **Auth:** Required (Owner)
- **Request Body:** `{ "isPrivate": true }`

#### 5.5 `DELETE /api/playlists/[id]`
Deletes a playlist.
- **Auth:** Required (Owner)

#### 5.6 `POST /api/playlists/[id]/add-song`
Adds a song to the playlist.
- **Auth:** Required (Owner)
- **Request Body:** `{ "songId": "song_cuid" }`

#### 5.7 `POST /api/playlists/[id]/remove-song`
Removes a song from the playlist.
- **Auth:** Required (Owner)
- **Request Body:** `{ "songId": "song_cuid" }`

#### 5.8 `GET /api/playlists/[id]/songs`
Returns all active songs in the playlist (unpaginated, for queue playback).
- **Auth:** Public (if playlist is public) / Owner

---

### 6. Favorites

#### 6.1 `GET /api/favorites`
Fetches the user's favorite songs playlist (creates one automatically if not existing).
- **Auth:** Required (Session)
- **Query Params:** `page` (default: 1), `pageSize` (default: 20)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "id": "fav_playlist_cuid",
      "name": "موردعلاقه ها",
      "isFavorite": true,
      "songs": [ /* List of songs */ ]
    }
  }
  ```

#### 6.2 `POST /api/favorites/isfavorite`
Checks whether a specific song is marked as favorite.
- **Auth:** Required (Session)
- **Request Body:** `{ "songId": "song_cuid" }`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "isFavorite": true
  }
  ```

#### 6.3 `POST /api/favorites/add-song`
Adds a song to favorites.
- **Auth:** Required (Session)
- **Request Body:** `{ "songId": "song_cuid" }`

#### 6.4 `POST /api/favorites/remove-song`
Removes a song from favorites.
- **Auth:** Required (Session)
- **Request Body:** `{ "songId": "song_cuid" }`

---

### 7. Comments

#### 7.1 `GET /api/comments`
Fetches comments and replies for a song or album.
- **Auth:** Public (unapproved comments are only visible to their author).
- **Query Params:**
  - `songId` (String, optional)
  - `albumId` (String, optional)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "comment_cuid",
        "content": "عالی بود این آهنگ",
        "createdAt": "2026-09-20T10:00:00.000Z",
        "isActive": true,
        "user": {
          "name": "علی",
          "image": "/assets/avatars/ali.jpg",
          "userSlug": "ali123",
          "instagramHandle": "ali_bakhtiari"
        },
        "replies": [ /* Nested reply comments */ ]
      }
    ]
  }
  ```

#### 7.2 `POST /api/comments`
Submits a comment or a reply.
- **Auth:** Required (Session)
- **Security Note:** New top-level comments require `captchaAnswer` and `captchaToken` (from `/api/captcha`). Replies (`parentId != null`) do not require captcha.
- **Request Body:**
  ```json
  {
    "content": "متن نظر شما...",
    "songId": "song_cuid",
    "albumId": null,
    "parentId": null,
    "captchaToken": "<token_from_captcha_cookie_or_header>",
    "captchaAnswer": "7"
  }
  ```
- **Response `200 OK`:** Created comment object (starts with `isActive: false` awaiting moderation).

#### 7.3 `DELETE /api/comments?id=<commentId>`
Deletes a comment (Author or Administrator).

#### 7.4 `PUT /api/comments/[id]`
Approves or rejects a comment.
- **Auth:** Required (`moderator` or `administrator`)
- **Request Body:** `{ "isActive": true }`

---

### 8. Lyrics & Synced Lyrics

#### 8.1 `POST /api/lyrics/suggest`
Submits lyrics suggestion for a song.
- **Auth:** Required (Session)
- **Request Body:**
  ```json
  {
    "songId": "song_cuid",
    "lyrics": "متن آهنگ...",
    "syncedLyrics": "[00:10.00]متن هماهنگ..."
  }
  ```

#### 8.2 `PUT /api/lyrics/edit/[id]`
Submits plain text lyrics edit for a song:
- If caller is **Administrator / Moderator**, updates the song directly and calculates contributor percentage.
- If caller is a **regular User**, creates a `PENDING` suggestion in `LyricsSuggestion`.
- **Request Body:**
  ```json
  {
    "lyrics": "متن ویرایش شده...",
    "source": "منبع ترانه",
    "sourceUrl": "https://source.ir"
  }
  ```

#### 8.3 `PUT /api/lyrics/edit/synced/[id]`
Submits synced lyrics (LRC format) for a song:
- If caller is **Administrator / Moderator**, saves directly to `Song.syncedLyrics`.
- If caller is a **regular User**, creates a `PENDING` suggestion.
- **Request Body:**
  ```json
  {
    "syncedLyrics": "[00:05.10]شروع آهنگ\n[00:12.45]خط اول..."
  }
  ```

#### 8.4 `GET /api/lyrics/suggestions`
Retrieves pending/submitted suggestions.
- **Auth:** Required (Admins/Mods see all; users see their own).
- **Query Params:** `page` (default: 1)

#### 8.5 `PUT /api/lyrics/suggestions/[id]`
Moderates lyrics suggestion.
- **Auth:** Required (`administrator` or `moderator`)
- **Request Body:**
  ```json
  {
    "status": "APPROVED" // or "REJECTED"
  }
  ```

---

### 9. Radio

#### 9.1 `GET /api/radio/state`
Real-time state of the 24/7 continuous radio broadcast.
- **Auth:** Public
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "serverTime": 1740000000000,
      "elapsedTime": 3420,
      "totalDuration": 86400,
      "currentTrack": {
        "id": "song_cuid",
        "title": "دی بلال",
        "titleEn": "Dey Balal",
        "artist": "مسعود بختیاری",
        "uri": "/assets/mp3/dey-balal-128.mp3",
        "coverArt": "/assets/cover/dey.jpg",
        "duration": 210,
        "position": 45,
        "lyrics": "...",
        "syncedLyrics": "...",
        "links": { ... }
      },
      "nextTrack": {
        "id": "song_next_cuid",
        "title": "شیرعلی مردان",
        "artist": "..."
      },
      "playlistId": "radio_playlist_cuid",
      "timeZone": "Asia/Tehran"
    }
  }
  ```
- **Error States:**
  - `code: "NO_PLAYLIST"` - Radio is currently offline.
  - `code: "NOT_STARTED_YET"` - Tomorrow's schedule not yet reached.
  - `code: "PLAYLIST_ENDED"` - Current daily playlist finished.

#### 9.2 `GET /api/radio/history/today`
Returns all tracks played on today's radio up to the current moment.
- **Auth:** Public

#### 9.3 `POST /api/radio/generateRadio`
Generates tomorrow's 24-hour randomized radio playlist.
- **Auth:** Secret password protected (`password: process.env.RADIO_PASSWORD`).

---

### 10. Search

#### 10.1 `POST /api/search`
Multi-entity search across Songs, Artists, Albums, and Playlists with Fuse.js fuzzy scoring.
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "query": "مسعود",
    "scope": null
  }
  ```
  *(Optional `scope` filters search inside an entity: `{ "type": "artist", "id": "artist_cuid" }`)*
- **Response `200 OK`:**
  ```json
  {
    "songs": [ ... ],
    "artists": [ ... ],
    "albums": [ ... ],
    "playlists": [ ... ],
    "radioPlaylist": [ ... ],
    "topResult": {
      "id": "artist_cuid",
      "name": "مسعود بختیاری",
      "image": "/assets/artists/masoud.jpg",
      "type": "artist"
    }
  }
  ```

---

### 11. Audio Identification (Acoustic Fingerprinting)

#### 11.1 `POST /api/identify`
Identifies unknown recorded music from an audio stream.
- **Auth:** Public
- **Request Content-Type:** `multipart/form-data` with field `file` OR raw audio buffer.
- **Supported Formats:** WAV, MP3, OGG, M4A, FLAC, WEBM (5 to 15 seconds sample recommended).
- **Response `200 OK` (Match Found):**
  ```json
  {
    "success": true,
    "match": true,
    "confidence": 85,
    "song": {
      "id": "song_cuid",
      "slug": "dey-balal",
      "title": "دی بلال",
      "titleEn": "Dey Balal",
      "artist": "مسعود بختیاری",
      "coverArt": "/assets/cover/song.jpg",
      "duration": 210,
      "uri": "/assets/mp3/song-128.mp3",
      "links": { ... }
    },
    "stats": {
      "matchedPeaks": 42,
      "totalMatches": 58,
      "alignmentRatio": 0.72
    },
    "candidates": [
      {
        "song": { ... },
        "confidence": 85,
        "matchedPeaks": 42
      }
    ]
  }
  ```
- **Response `200 OK` (No Match):**
  ```json
  {
    "success": true,
    "match": false,
    "confidence": 0,
    "message": "No matching song found in the database.",
    "candidates": []
  }
  ```

#### 11.2 `GET /api/identify`
Health check and statistics for the identification service.

---

### 12. Notifications

#### 12.1 `GET /api/notifications`
Returns current user's notifications.
- **Auth:** Required (Session)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "notif_cuid",
        "type": "SONG_APPROVED",
        "title": "آهنگ تایید شد!",
        "message": "آهنگ ارسالی شما تایید شد!",
        "link": "/song/song_cuid",
        "isRead": false,
        "createdAt": "2026-09-20T12:00:00.000Z"
      }
    ]
  }
  ```

#### 12.2 `PATCH /api/notifications`
Marks notification(s) as read.
- **Auth:** Required (Session)
- **Request Body:**
  ```json
  { "id": "notif_cuid" }
  ```
  Or to mark all as read:
  ```json
  { "all": true }
  ```

#### 12.3 `POST /api/notifications`
Sends a custom notification to a user.
- **Auth:** Required (`administrator` only)

---

### 13. Badges

#### 13.1 `GET /api/badges`
Lists all achievement/status badges.
- **Auth:** Public

#### 13.2 `POST /api/badges`, `PUT /api/badges/[id]`, `DELETE /api/badges/[id]`
Creates, edits, or deletes badges (`administrator` only).

#### 13.3 `GET /api/users/[id]/badges`
Returns list of badge IDs awarded to a specific user.
- **Auth:** Public

#### 13.4 `POST /api/users/[id]/badges`
Awards or replaces badges for a user (`administrator` only).
- **Request Body:** `{ "badgeIds": ["badge_1", "badge_2"] }`

---

### 14. Administration & User Management

#### 14.1 `GET /api/users`
Lists all registered users.
- **Auth:** Required (`administrator` only)

#### 14.2 `GET /api/users/[id]`
Gets a public user profile by `userSlug`.
- **Auth:** Public (If profile `isPrivate: true`, only accessible if session user is the owner).
- **Response `200 OK`:** User object with public playlists.

#### 14.3 `PUT /api/users/[id]`
Updates user status (Role, Ban, Verification, Artist Link).
- **Auth:** Required (`administrator` only)
- **Request Body:**
  ```json
  {
    "role": "moderator",
    "isBanned": false,
    "isVerified": true,
    "isUserAnArtist": true,
    "artistId": "artist_cuid"
  }
  ```

---

### 15. Media Uploads & Server Player (Dev/Proxy)

#### 15.1 `POST /api/upload/image`
Image upload handler.
- **Note:** In production, routes may return dummy stub responses if external FTP storage or S3 is configured. Accepts `multipart/form-data` with `file`.

#### 15.2 `POST /api/upload/mp3`
Audio upload handler with `music-metadata` ID3 tag parsing.

#### 15.3 `POST /api/server-player`
Internal proxy to test audio output hardware/speakers on a local server.

---

### 16. Security & Captcha

#### 16.1 `GET /api/captcha`
Generates an SVG math captcha (e.g. `4 + 5 = ?`) and sets an encrypted HTTP-only cookie `captcha_token`.
- **Auth:** Public
- **Response:** `image/svg+xml`
- **Client Handling:** Display the SVG image to the user. When submitting a comment, send the user's answer in `captchaAnswer`.

---

## Android Client Implementation Recommendations

### 1. Networking Stack (Retrofit + OkHttp)
```kotlin
// Setup OkHttp with CookieJar for session preservation
val cookieJar = JavaNetCookieJar(CookieHandler.getDefault())

val okHttpClient = OkHttpClient.Builder()
    .cookieJar(cookieJar)
    .addInterceptor { chain ->
        val original = chain.request()
        val requestBuilder = original.newBuilder()
            .header("Accept", "application/json")
        // If you store token manually:
        // requestBuilder.header("Authorization", "Bearer $savedToken")
        chain.proceed(requestBuilder.build())
    }
    .build()

val retrofit = Retrofit.Builder()
    .baseUrl("https://deybalal.ir/") // Replace with your production domain
    .client(okHttpClient)
    .addConverterFactory(GsonConverterFactory.create())
    .build()
```

### 2. Audio Playback (Media3 / ExoPlayer)
- Use AndroidX Media3 (`androidx.media3.exoplayer` and `androidx.media3.session.MediaSessionService`).
- When playing a song, inspect the user's `downloadPreference` (64, 128, or 320). Select the matching bitrate from `song.links`, falling back to `song.uri`.
- After playing at least 30 seconds (or half the song duration), trigger the play count increment:
  ```kotlin
  fun incrementPlayCount(songId: String, hashSecret: String) {
      val url = "/api/songs/$songId/play"
      val timestamp = System.currentTimeMillis() / 1000
      val tz = TimeZone.getDefault().id
      val localTime = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
          timeZone = TimeZone.getTimeZone("UTC")
      }.format(Date())

      val userTimeInfoJson = """{"localTime":"$localTime","timezone":"$tz"}"""
      val raw = "$timestamp:$url:$hashSecret:$userTimeInfoJson"
      val signature = sha256Hex(raw)

      val payload = """{"t":$timestamp,"u":$userTimeInfoJson,"s":"$signature"}"""
      val packedHash = Base64.encodeToString(payload.toByteArray(Charsets.UTF_8), Base64.NO_WRAP)

      apiService.recordPlay(songId, PlayRequest(hash = packedHash))
  }
  ```

### 3. Synchronized Lyrics (LRC) Player
- Use regex to parse standard LRC formats:
  ```regex
  \[(\d{2}):(\d{2})\.(\d{2,3})\](.*)
  ```
- Calculate time in milliseconds: `(minutes * 60 + seconds) * 1000 + millis`.
- Sync with `exoPlayer.currentPosition` using a `ValueAnimator` or Compose `LaunchedEffect` loop to highlight current active line and auto-scroll.

### 4. Audio Identification Integration
- Record microphone input using `AudioRecord` formatted as 44.1kHz 16-bit Mono WAV.
- Record 7–10 seconds.
- Create a `MultipartBody.Part.createFormData("file", "sample.wav", requestFile)`.
- Send to `apiService.identifySong(body)`.
- If `match == true`, open the song detail page.
