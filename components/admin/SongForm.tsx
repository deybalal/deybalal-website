"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { Album } from "@/types/types";
import { Check, ChevronsUpDown } from "lucide-react";
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

interface Artist {
  id: string;
  name: string;
  nameEn?: string | null;
}

interface SongFormProps {
  songId?: string;
  mode?: "create" | "edit";
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  titleEn: z.string().optional(),
  artist: z.string().min(2, "You must enter artist name!"),
  artistEn: z.string().optional(),
  artistId: z.string().optional(), // Will be set automatically when artist is selected
  albumId: z.string().optional(),
  albumName: z.string().optional(),
  coverArt: z.string().optional(),
  duration: z.number().min(0).optional(),
  filename: z.string().optional(),

  tempCoverArt: z.string().optional(),
});

type SongFormValues = z.infer<typeof formSchema>;

export default function SongForm({ songId, mode = "create" }: SongFormProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [openArtist, setOpenArtist] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0); // Key to force file input reset
  const [fetchingData, setFetchingData] = useState(false);

  const form = useForm<SongFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      titleEn: "",
      artist: "",
      artistEn: "",
      artistId: "",
      albumId: "",
      albumName: "",
      coverArt: "",
      duration: 0,
      filename: "",

      tempCoverArt: "",
    },
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
        console.error("Failed to fetch albums", error);
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
        console.error("Failed to fetch artists", error);
      }
    };

    fetchAlbums();
    fetchArtists();
  }, []);

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
              form.setValue("artistEn", song.artistEn || "");
              form.setValue("artistId", song.artistId || "");
              form.setValue("albumId", song.albumId || "");
              form.setValue("albumName", song.albumName || "");
              form.setValue("coverArt", song.coverArt || "");
              form.setValue("duration", song.duration || 0);
              form.setValue("filename", song.filename || "");
            } else {
              toast.error("Failed to fetch song data");
            }
          }
        } catch (error) {
          console.error("Error fetching song:", error);
          toast.error("Failed to fetch song data");
        } finally {
          setFetchingData(false);
        }
      };

      fetchSongData();
    }
  }, [mode, songId, form]);

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
        toast.error(result.message || `Failed to ${mode} song`);
        throw new Error(result.message || `Failed to ${mode} song`);
      }

      toast.success(
        `Song ${mode === "edit" ? "updated" : "created"} successfully`
      );
      if (mode === "create") {
        form.reset();
        setFileInputKey((prev) => prev + 1); // Reset file inputs by changing key
      }
    } catch {
      toast.error(`Failed to ${mode} song`);
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
      toast.error("Please select an MP3 file");
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
        throw new Error(result.message || "Failed to upload file");
      }

      const { filePath, filename, metadata, coverArt, tempCoverArt } =
        result.data;

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
          // Set both artist name and ID
          form.setValue("artist", matchingArtist.name);
          form.setValue("artistId", matchingArtist.id);
          if (matchingArtist.nameEn) {
            form.setValue("artistEn", matchingArtist.nameEn);
          }
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

      if (metadata.duration)
        form.setValue("duration", Math.round(metadata.duration));

      if (coverArt) {
        form.setValue("coverArt", coverArt);
        form.setValue("tempCoverArt", tempCoverArt);
      }

      toast.success("File uploaded and metadata extracted");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
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
        throw new Error(result.message || "Failed to upload image");
      }

      const { filePath, filename } = result.data;

      form.setValue("coverArt", filePath);
      form.setValue("tempCoverArt", filename);

      toast.success("Cover art uploaded");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload cover art");
    } finally {
      setUploading(false);
    }
  };

  console.log("artists ", artists);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
        <FormItem>
          <FormLabel>Upload MP3</FormLabel>
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
              Uploading and parsing...
            </p>
          )}
        </FormItem>
        <FormField
          control={form.control}
          name="coverArt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Art</FormLabel>
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
                        alt="Cover Art Preview"
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Song Title" {...field} />
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
              <FormLabel>Title (English)</FormLabel>
              <FormControl>
                <Input placeholder="Song Title (English)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="artist"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Artist</FormLabel>
              <Popover open={openArtist} onOpenChange={setOpenArtist}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openArtist}
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? artists.find((artist) => artist.name === field.value)
                            ?.name || field.value
                        : "Select artist"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search artist..." />
                    <CommandList>
                      <CommandEmpty>No artist found.</CommandEmpty>
                      <CommandGroup>
                        {artists.map((artist) => (
                          <CommandItem
                            value={artist.name}
                            key={artist.id}
                            onSelect={() => {
                              form.setValue("artist", artist.name);
                              form.setValue("artistId", artist.id); // Automatically set artistId
                              if (artist.nameEn) {
                                form.setValue("artistEn", artist.nameEn);
                              }
                              setOpenArtist(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                artist.name === field.value
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
          name="artistEn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Artist (English)</FormLabel>
              <FormControl>
                <Input placeholder="Artist Name (English)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="albumId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Album</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an album" />
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
              <FormLabel>Album Name (Optional override)</FormLabel>
              <FormControl>
                <Input placeholder="Album Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (seconds)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
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

        <Button type="submit" disabled={loading || fetchingData}>
          {loading
            ? mode === "edit"
              ? "Updating..."
              : "Creating..."
            : mode === "edit"
            ? "Update Song"
            : "Create Song"}
        </Button>
      </form>
    </Form>
  );
}
