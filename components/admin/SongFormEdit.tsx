"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { Album } from "@/types/types";
import { Check, ChevronsUpDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Artist {
  id: string;
  name: string;
  nameEn?: string | null;
  image?: string | null;
}

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface SongFormProps {
  songId?: string;
  mode?: "create" | "edit";
}

const formSchema = z.object({
  title: z.string().min(1, "نام آهنگ اجباری است."),
  titleEn: z.string().optional(),
  artist: z.string().min(2, "وارد کردن نام خواننده اجباری است."),
  artistIds: z.array(z.string()).optional(), // Multiple artist IDs
  albumId: z.string().optional(),
  albumName: z.string().optional(),
  coverArt: z.string().optional(),
  year: z.number().min(0).optional(),
  filename: z.string().optional(),
  useArtistImage: z.boolean().optional(),

  tempCoverArt: z.string().optional(),
  crew: z
    .array(
      z.object({
        role: z.string().min(1, "نقش اجباری است"),
        name: z.string().min(1, "نام اجباری است"),
      })
    )
    .optional(),
  genreIds: z.array(z.string()).optional(),
});

type SongFormValues = z.infer<typeof formSchema>;

export default function SongFormEdit({ songId, mode = "edit" }: SongFormProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]); // Track selected artists
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [openArtist, setOpenArtist] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [openGenre, setOpenGenre] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0); // Key to force file input reset
  const [fetchingData, setFetchingData] = useState(false);
  const [manualCoverArt, setManualCoverArt] = useState<string | null>(null);

  const router = useRouter();

  const form = useForm<SongFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      titleEn: "",
      artist: "",
      artistIds: [],
      albumId: "",
      albumName: "",
      coverArt: "",
      year: 0,
      filename: "",
      useArtistImage: false,
      tempCoverArt: "",
      crew: [],
      genreIds: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "crew",
  });

  useEffect(() => {
    const fetchAlbums = async () => {
      console.log("What");

      try {
        const res = await fetch("/api/albums", { method: "POST" });
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            console.log("WDYM");

            setAlbums(result.data);
          }
        }
      } catch (error) {
        console.error("خطا در دریافت لیست آلبوم ها", error);
      }
    };

    const fetchArtists = async () => {
      try {
        const res = await fetch("/api/artists");
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            setArtists(result.data);
          }
        }
      } catch (error) {
        console.error("خطا در دریافت لیست خواننده ها", error);
      }
    };

    const fetchGenres = async () => {
      try {
        const res = await fetch("/api/genres");
        if (res.ok) {
          const result = await res.json();
          // The genres API returns the array directly
          setGenres(Array.isArray(result) ? result : result.data || []);
        }
      } catch (error) {
        console.error("خطا در دریافت لیست سبک ها", error);
      }
    };

    fetchAlbums();
    fetchArtists();
    fetchGenres();
  }, [openArtist, openGenre]);

  // Fetch song data in edit mode
  useEffect(() => {
    if (mode === "edit" && songId) {
      const fetchSongData = async () => {
        setFetchingData(true);
        try {
          const res = await fetch(`/api/songs/${songId}`);
          if (res.ok) {
            const result = await res.json();
            if (result.success) {
              const song = result.data;
              // Populate form with song data
              form.setValue("title", song.title || "");
              form.setValue("titleEn", song.titleEn || "");
              form.setValue("artist", song.artist || "");

              // Set multiple artists
              if (song.artists && song.artists.length > 0) {
                setSelectedArtists(song.artists);
                form.setValue(
                  "artistIds",
                  song.artists.map((a: Artist) => a.id)
                );
              }

              form.setValue("albumId", song.albumId || "");
              form.setValue("albumName", song.albumName || "");
              form.setValue("coverArt", song.coverArt || "");
              setManualCoverArt(song.coverArt || "");
              form.setValue("year", song.year || 0);
              form.setValue("filename", song.filename || "");
              if (song.crew) {
                form.setValue("crew", song.crew);
              }
              if (song.genres) {
                setSelectedGenres(song.genres);
                form.setValue(
                  "genreIds",
                  song.genres.map((g: Genre) => g.id)
                );
              }
            } else {
              toast.error("خطا در دریافت مشخصات آهنگ");
            }
          }
        } catch (error) {
          console.error("Error fetching song:", error);
          toast.error("خطا در دریافت مشخصات آهنگ");
        } finally {
          setFetchingData(false);
        }
      };

      fetchSongData();
    }
  }, [mode, songId, form]);

  const useEffectChangeWatcher = form.watch("useArtistImage");
  // Sync coverArt with artist image if useArtistImage is checked
  useEffect(() => {
    const useArtistImage = form.watch("useArtistImage");
    if (useArtistImage && selectedArtists.length > 0) {
      const artistImage = selectedArtists[0].image;
      form.setValue("coverArt", artistImage || "/images/cover.png");
    } else if (manualCoverArt) {
      form.setValue("coverArt", manualCoverArt);
    }
  }, [selectedArtists, useEffectChangeWatcher, manualCoverArt, form]);

  async function onSubmit(values: SongFormValues) {
    setLoading(true);
    try {
      const endpoint =
        mode === "edit" ? `/api/songs/${songId}` : "/api/songs/create";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        toast.error(
          result.message ||
            `خطا در ${mode === "create" ? "افزودن" : "ویرایش"} آهنگ`
        );
        throw new Error(
          result.message ||
            `خطا در ${mode === "create" ? "افزودن" : "ویرایش"} آهنگ`
        );
      }

      toast.success(`آهنگ ${mode === "edit" ? "ویرایش" : "افزوده"} شد`);
      if (mode === "create") {
        form.reset();
        setSelectedArtists([]);
        setFileInputKey((prev) => prev + 1); // Reset file inputs by changing key
      }
      router.push("/panel");
    } catch {
      toast.error(`خطا در ${mode === "create" ? "افزودن" : "ویرایش"} آهنگ`);
    } finally {
      setLoading(false);
    }
  }

  // Helper function to calculate string similarity (Levenshtein distance)
  const getStringSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;

    const len1 = s1.length;
    const len2 = s2.length;

    if (len1 === 0 || len2 === 0) return 0;

    // Create a matrix for dynamic programming
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return 1 - distance / maxLen;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".mp3")) {
      toast.error("لطفا یک فایل با فرمت MP3 انتخاب کنید.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/mp3", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "خطا در ارسال آهنگ");
      }

      const { filename, metadata, coverArt, tempCoverArt } = result.data;

      form.setValue("filename", filename);

      if (metadata.title) form.setValue("title", metadata.title);

      // Search for matching artist by name or nameEn with fuzzy matching
      if (metadata.artist) {
        // First try exact match
        let matchingArtist = artists.find(
          (artist) =>
            artist.name === metadata.artist || artist.nameEn === metadata.artist
        );

        // If no exact match, try fuzzy matching with 70% similarity threshold
        if (!matchingArtist) {
          const SIMILARITY_THRESHOLD = 0.7;
          let bestMatch: Artist | null = null;
          let bestSimilarity = 0;

          artists.forEach((artist) => {
            const nameSimilarity = getStringSimilarity(
              artist.name,
              metadata.artist
            );
            const nameEnSimilarity = artist.nameEn
              ? getStringSimilarity(artist.nameEn, metadata.artist)
              : 0;

            const maxSimilarity = Math.max(nameSimilarity, nameEnSimilarity);

            if (
              maxSimilarity > bestSimilarity &&
              maxSimilarity >= SIMILARITY_THRESHOLD
            ) {
              bestSimilarity = maxSimilarity;
              bestMatch = artist;
            }
          });

          matchingArtist = bestMatch || undefined;
        }

        if (matchingArtist) {
          // Set both artist name and IDs
          form.setValue("artist", matchingArtist.name);
          const currentIds = form.getValues("artistIds") || [];
          if (!currentIds.includes(matchingArtist.id)) {
            form.setValue("artistIds", [...currentIds, matchingArtist.id]);
          }

          // Update selectedArtists (artistEn will be updated by useEffect)
          setSelectedArtists((prev) => {
            const updatedArtists = prev.find((a) => a.id === matchingArtist.id)
              ? prev
              : [...prev, matchingArtist];

            return updatedArtists;
          });
        } else {
          // If no match found, just set the name
          form.setValue("artist", metadata.artist);
        }
      }

      // Search for matching album by name with fuzzy matching
      if (metadata.album) {
        // First try exact match
        let matchingAlbum = albums.find(
          (album) => album.name === metadata.album
        );

        // If no exact match, try fuzzy matching with 70% similarity threshold
        if (!matchingAlbum) {
          const SIMILARITY_THRESHOLD = 0.7;
          let bestMatch: Album | null = null;
          let bestSimilarity = 0;

          albums.forEach((album) => {
            const nameSimilarity = getStringSimilarity(
              album.name,
              metadata.album
            );

            if (
              nameSimilarity > bestSimilarity &&
              nameSimilarity >= SIMILARITY_THRESHOLD
            ) {
              bestSimilarity = nameSimilarity;
              bestMatch = album;
            }
          });

          matchingAlbum = bestMatch || undefined;
        }

        if (matchingAlbum) {
          // Set both album name and ID
          form.setValue("albumId", matchingAlbum.id);
          form.setValue("albumName", matchingAlbum.name);
        } else {
          // If no match found, just set the name
          form.setValue("albumName", metadata.album);
        }
      }

      if (metadata.year) form.setValue("year", Math.round(metadata.year));

      if (coverArt) {
        form.setValue("coverArt", coverArt);
        form.setValue("tempCoverArt", tempCoverArt);
        setManualCoverArt(coverArt);
      }

      toast.success("آهنگ آپلود شد! لطفا به مرحله بعد بروید!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("خطا در آپلود فایل");
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("لطفا یک عکس انتخاب کنید!");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "خطا در آپلود عکس");
      }

      const { filePath, filename } = result.data;

      form.setValue("coverArt", filePath);
      form.setValue("tempCoverArt", filename);
      setManualCoverArt(filePath);

      toast.success("عکس این آهنگ آپلود شد!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("خطا در آپلود عکس");
    } finally {
      setUploading(false);
    }
  };

  console.log("artists ", artists);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
        <FormItem>
          <FormLabel>آپلود فایل MP3</FormLabel>
          <FormControl>
            <Input
              key={`mp3-${fileInputKey}`}
              type="file"
              accept=".mp3,audio/mpeg"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </FormControl>
          {uploading && (
            <p className="text-sm text-muted-foreground">
              در حال آپلود و پردازش...
            </p>
          )}
        </FormItem>
        <FormField
          control={form.control}
          name="coverArt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>کاور آهنگ</FormLabel>
              <FormControl>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Input
                      key={`cover-${fileInputKey}`}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      disabled={uploading}
                      className="w-full"
                    />
                  </div>
                  {field.value && (
                    <div className="relative w-32 h-32 rounded-md overflow-hidden border">
                      <Image
                        src={field.value}
                        alt="پیش نمایش کاور"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="useArtistImage"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>استفاده از تصویر خواننده</FormLabel>
                <div className="text-sm text-muted-foreground">
                  تصویر خواننده به عنوان کاور آهنگ استفاده شود
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نام آهنگ</FormLabel>
              <FormControl>
                <Input placeholder="نام آهنگ" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="titleEn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نام آهنگ (انگلیسی)</FormLabel>
              <FormControl>
                <Input placeholder="نام آهنگ (انگلیسی)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="artist"
          render={() => (
            <FormItem className="flex flex-col">
              <FormLabel>
                خواننده ها{" "}
                <Link
                  className="border p-1.5 rounded-md hover:scale-110 transition-all"
                  href="/panel/new/artist"
                  target="_blank"
                >
                  افزودن جدید
                </Link>
              </FormLabel>

              {/* Display selected artists as badges */}
              {selectedArtists.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedArtists.map((artist) => (
                    <div
                      key={artist.id}
                      className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
                    >
                      <span>{artist.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedArtists((prev) =>
                            prev.filter((a) => a.id !== artist.id)
                          );
                          form.setValue(
                            "artistIds",
                            selectedArtists
                              .filter((a) => a.id !== artist.id)
                              .map((a) => a.id)
                          );
                          // Update artist string
                          const remaining = selectedArtists.filter(
                            (a) => a.id !== artist.id
                          );
                          form.setValue(
                            "artist",
                            remaining.map((a) => a.name).join(", ")
                          );
                        }}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Popover open={openArtist} onOpenChange={setOpenArtist}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openArtist}
                      className={cn(
                        "w-full justify-between",
                        selectedArtists.length === 0 && "text-muted-foreground"
                      )}
                    >
                      {selectedArtists.length > 0
                        ? `${selectedArtists.length} خواننده انتخاب شده`
                        : "انتخاب خواننده ها"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="جستجوی خواننده..." />
                    <CommandList>
                      <CommandEmpty>خواننده ای پیدا نشد.</CommandEmpty>
                      <CommandGroup>
                        {artists.map((artist) => (
                          <CommandItem
                            value={artist.name}
                            key={artist.id}
                            onSelect={() => {
                              const isSelected = selectedArtists.some(
                                (a) => a.id === artist.id
                              );

                              if (isSelected) {
                                // Remove artist
                                setSelectedArtists((prev) =>
                                  prev.filter((a) => a.id !== artist.id)
                                );
                                form.setValue(
                                  "artistIds",
                                  selectedArtists
                                    .filter((a) => a.id !== artist.id)
                                    .map((a) => a.id)
                                );
                              } else {
                                // Add artist
                                setSelectedArtists((prev) => [...prev, artist]);
                                form.setValue("artistIds", [
                                  ...(form.getValues("artistIds") || []),
                                  artist.id,
                                ]);
                              }

                              // Update artist string
                              const newSelected = isSelected
                                ? selectedArtists.filter(
                                    (a) => a.id !== artist.id
                                  )
                                : [...selectedArtists, artist];
                              form.setValue(
                                "artist",
                                newSelected.map((a) => a.name).join(", ")
                              );
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedArtists.some((a) => a.id === artist.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {artist.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="albumId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>آلبوم</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب آلبوم" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {albums.map((album) => (
                    <SelectItem key={album.id} value={album.id}>
                      {album.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="albumName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نام آلبوم (اختیاری)</FormLabel>
              <FormControl>
                <Input placeholder="نام آلبوم" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>سال انتشار</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  placeholder="2025"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? undefined : Number(value));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="genreIds"
          render={() => (
            <FormItem className="flex flex-col">
              <FormLabel>سبک ها</FormLabel>

              {/* Display selected genres as badges */}
              {selectedGenres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedGenres.map((genre) => (
                    <div
                      key={genre.id}
                      className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
                    >
                      <span>{genre.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = selectedGenres.filter(
                            (g) => g.id !== genre.id
                          );
                          setSelectedGenres(updated);
                          form.setValue(
                            "genreIds",
                            updated.map((g) => g.id)
                          );
                        }}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Popover open={openGenre} onOpenChange={setOpenGenre}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openGenre}
                      className={cn(
                        "w-full justify-between",
                        selectedGenres.length === 0 && "text-muted-foreground"
                      )}
                    >
                      {selectedGenres.length > 0
                        ? `${selectedGenres.length} سبک انتخاب شده`
                        : "انتخاب سبک ها"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="جستجوی سبک..." />
                    <CommandList>
                      <CommandEmpty>سبکی پیدا نشد.</CommandEmpty>
                      <CommandGroup>
                        {genres.map((genre) => (
                          <CommandItem
                            value={genre.name}
                            key={genre.id}
                            onSelect={() => {
                              const isSelected = selectedGenres.some(
                                (g) => g.id === genre.id
                              );

                              if (isSelected) {
                                // Remove genre
                                const updated = selectedGenres.filter(
                                  (g) => g.id !== genre.id
                                );
                                setSelectedGenres(updated);
                                form.setValue(
                                  "genreIds",
                                  updated.map((g) => g.id)
                                );
                              } else {
                                // Add genre
                                const updated = [...selectedGenres, genre];
                                setSelectedGenres(updated);
                                form.setValue(
                                  "genreIds",
                                  updated.map((g) => g.id)
                                );
                              }
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedGenres.some((g) => g.id === genre.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {genre.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel className="text-lg font-semibold">
              دست اندرکاران
            </FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ role: "", name: "" })}
            >
              افزودن عضو
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-end">
                <FormField
                  control={form.control}
                  name={`crew.${index}.role`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>نقش</FormLabel>
                      <FormControl>
                        <Input placeholder="مثلا میکس و مستر" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`crew.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>نام</FormLabel>
                      <FormControl>
                        <Input placeholder="مثلا علی رضایی" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mb-2 text-destructive hover:text-destructive/90"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          {fields.length === 0 && (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              هنوز دست اندرکاری اضافه نشده است.
            </div>
          )}
        </div>

        <Button type="submit" disabled={loading || fetchingData}>
          {loading
            ? mode === "edit"
              ? "در حال بروزرسانی..."
              : "در حال ساخت..."
            : mode === "edit"
            ? "ویرایش آهنگ"
            : "ساخت آهنگ"}
        </Button>
      </form>
    </Form>
  );
}
