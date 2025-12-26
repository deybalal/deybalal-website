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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { Album, Genre } from "@prisma/client";
import { Check, ChevronsUpDown, Trash2, Loader2, Plus } from "lucide-react";
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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ArtistForm from "./ArtistForm";
import GenreForm from "./GenreForm";
import { useRouter } from "next/navigation";

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
  artistIds: z.array(z.string()).optional(), // Multiple artist IDs
  albumId: z.string().optional(),
  albumName: z.string().optional(),
  coverArt: z.string().optional(),
  year: z.number().min(0).optional(),
  duration: z.number().min(0).optional(),
  filename: z.string().optional(),
  genreIds: z.array(z.string()).optional(),

  tempCoverArt: z.string().optional(),
  crew: z
    .array(
      z.object({
        role: z.string().min(1, "Role is required"),
        name: z.string().min(1, "Name is required"),
      })
    )
    .optional(),
});

type SongFormValues = z.infer<typeof formSchema>;

export default function SongForm({ songId, mode = "create" }: SongFormProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]); // Track selected artists
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [openArtist, setOpenArtist] = useState(false);
  const [openGenre, setOpenGenre] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0); // Key to force file input reset

  const [step, setStep] = useState(1);
  const [openCreateArtist, setOpenCreateArtist] = useState(false);
  const [openCreateGenre, setOpenCreateGenre] = useState(false);

  const router = useRouter();

  const form = useForm<SongFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      titleEn: "",
      artist: "",
      artistEn: "",
      artistIds: [],
      albumId: "",
      albumName: "",
      coverArt: "",
      year: 0,
      duration: 0,
      filename: "",

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
      try {
        const res = await fetch("/api/albums", { method: "POST" });
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
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

    const fetchGenres = async () => {
      try {
        const res = await fetch("/api/genres");
        if (res.ok) {
          const result = await res.json();
          setGenres(result);
        }
      } catch (error) {
        console.error("Failed to fetch genres", error);
      }
    };

    fetchAlbums();
    fetchArtists();
    fetchGenres();
  }, [openArtist]);

  // Fetch song data in edit mode
  useEffect(() => {
    if (mode === "edit" && songId) {
      const fetchSongData = async () => {
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
              form.setValue("year", song.year || 0);
              form.setValue("duration", song.duration || 0);
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
              toast.error("Failed to fetch song data");
            }
          }
        } catch (error) {
          console.error("Error fetching song:", error);
          toast.error("Failed to fetch song data");
        } finally {
          // setFetchingData(false);
        }
      };

      fetchSongData();
    }
  }, [mode, songId, form]);

  // Update artistEn whenever selectedArtists changes
  useEffect(() => {
    const artistEnNames = selectedArtists
      .map((a) => a.nameEn)
      .filter((name): name is string => !!name);

    if (artistEnNames.length > 0) {
      form.setValue("artistEn", artistEnNames.join(", "));
    } else {
      form.setValue("artistEn", "");
    }
  }, [selectedArtists, form]);

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
        setSelectedArtists([]);
        setSelectedGenres([]);
        setFileInputKey((prev) => prev + 1); // Reset file inputs by changing key
      }
      setStep(1);
      router.push("/panel");
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

      const { filename, metadata, coverArt, tempCoverArt } = result.data;

      form.setValue("filename", filename);

      if (metadata.title) form.setValue("titleEn", metadata.title);

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

  const nextStep = () => {
    if (step === 1 && selectedArtists.length === 0) {
      toast.error("Please select at least one artist");
      return;
    }
    if (step === 2 && !form.getValues("filename")) {
      toast.error("Please upload an MP3 file");
      return;
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  return (
    <div className="space-y-6">
      {/* Steps Indicator */}
      <div className="flex items-center justify-between px-10">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 transition-colors",
                step === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : step > s
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-muted text-muted-foreground"
              )}
            >
              {s}
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                step === s ? "text-primary" : "text-muted-foreground"
              )}
            >
              {s === 1
                ? "Artist"
                : s === 2
                ? "Upload"
                : s === 3
                ? "Details"
                : "Crew"}
            </span>
          </div>
        ))}
      </div>

      {/* Tips Section */}
      <div className="bg-muted/50 p-4 rounded-lg border border-primary/20">
        <h3 className="font-semibold text-primary mb-1 flex items-center gap-2">
          <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
            TIP
          </span>
          {step === 1
            ? "Select Artist"
            : step === 2
            ? "Upload Song"
            : step === 3
            ? "Song Details"
            : "Crew Members"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {step === 1
            ? "Start by selecting the main artist for this song. If the artist doesn't exist yet, you can create a new one right here."
            : step === 2
            ? "Upload the MP3 file for the song. We'll automatically extract metadata like title, album, and duration to save you time."
            : step === 3
            ? "Review the extracted details and fill in any missing information. Add cover art and ensure everything looks correct before saving."
            : "Add crew members who worked on this song (e.g., Mix & Master, Producer, Graphic Designer)."}
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 w-full"
        >
          {/* Step 1: Artist Selection */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <FormField
                control={form.control}
                name="artist"
                render={() => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-lg font-semibold">
                      Select Artist
                      <Dialog
                        open={openCreateArtist}
                        onOpenChange={setOpenCreateArtist}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="secondary"
                            className="h-12 px-6 ml-3"
                            type="button"
                          >
                            Create New Artist
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Artist</DialogTitle>
                          </DialogHeader>
                          <ArtistForm
                            onSuccess={(newArtist) => {
                              setArtists((prev) => [...prev, newArtist]);
                              setSelectedArtists((prev) => [
                                ...prev,
                                newArtist,
                              ]);
                              form.setValue("artistIds", [
                                ...(form.getValues("artistIds") || []),
                                newArtist.id,
                              ]);
                              form.setValue(
                                "artist",
                                [...selectedArtists, newArtist]
                                  .map((a) => a.name)
                                  .join(", ")
                              );
                              setOpenCreateArtist(false);
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                    </FormLabel>

                    {/* Display selected artists as badges */}
                    {selectedArtists.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded-md min-h-[50px] items-center">
                        {selectedArtists.map((artist) => (
                          <div
                            key={artist.id}
                            className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium animate-in zoom-in duration-200"
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
                              className="hover:text-destructive ml-1"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 flex-col">
                      <Popover open={openArtist} onOpenChange={setOpenArtist}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openArtist}
                              className={cn(
                                "w-full justify-between h-12",
                                selectedArtists.length === 0 &&
                                  "text-muted-foreground"
                              )}
                            >
                              {selectedArtists.length > 0
                                ? "Add more artists..."
                                : "Search and select artists..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
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
                                        setSelectedArtists((prev) => [
                                          ...prev,
                                          artist,
                                        ]);
                                        form.setValue("artistIds", [
                                          ...(form.getValues("artistIds") ||
                                            []),
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
                                        newSelected
                                          .map((a) => a.name)
                                          .join(", ")
                                      );

                                      // Update artistEn with all selected artists' nameEn
                                      const artistEnNames = newSelected
                                        .map((a) => a.nameEn)
                                        .filter(
                                          (name): name is string => !!name
                                        );

                                      if (artistEnNames.length > 0) {
                                        form.setValue(
                                          "artistEn",
                                          artistEnNames.join(", ")
                                        );
                                      } else {
                                        form.setValue("artistEn", "");
                                      }
                                      setOpenArtist(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedArtists.some(
                                          (a) => a.id === artist.id
                                        )
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
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 2: MP3 Upload */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <FormItem>
                <FormLabel className="text-lg font-semibold">
                  Upload MP3 File
                </FormLabel>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-4 transition-colors",
                    uploading
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <FormControl>
                    <Input
                      key={`mp3-${fileInputKey}`}
                      type="file"
                      accept=".mp3,audio/mpeg"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                      id="mp3-upload"
                    />
                  </FormControl>
                  <label
                    htmlFor="mp3-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                      {uploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" x2="12" y1="3" y2="15" />
                        </svg>
                      )}
                    </div>
                    <span className="text-lg font-medium">
                      {uploading
                        ? "Uploading & Extracting..."
                        : form.getValues("filename")
                        ? "File Uploaded!"
                        : "Click to Upload MP3"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {form.getValues("filename") ||
                        "Supported format: .mp3 (Max 20MB)"}
                    </span>
                  </label>
                </div>
                {uploading && (
                  <p className="text-center text-sm text-muted-foreground animate-pulse">
                    Please wait while we process the audio file...
                  </p>
                )}
              </FormItem>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
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
                            {field.value ? (
                              <div className="relative w-full aspect-square rounded-md overflow-hidden border shadow-sm">
                                <Image
                                  src={field.value}
                                  alt="Cover Art Preview"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-full aspect-square rounded-md border-2 border-dashed flex items-center justify-center text-muted-foreground bg-muted/20">
                                No Cover Art
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
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
                          <Input
                            placeholder="Song Title (English)"
                            {...field}
                          />
                        </FormControl>
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
                          <Input
                            placeholder="Artist Name (English)"
                            {...field}
                          />
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
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
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
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Release Year</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              placeholder="2025"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(
                                  value === "" ? undefined : Number(value)
                                );
                              }}
                            />
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
                          <FormLabel>Duration (s)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(
                                  value === "" ? undefined : Number(value)
                                );
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="genreIds"
                    render={() => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Genres</FormLabel>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {selectedGenres.map((genre) => (
                            <div
                              key={genre.id}
                              className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                            >
                              {genre.name}
                              <button
                                type="button"
                                onClick={() => {
                                  const newGenres = selectedGenres.filter(
                                    (g) => g.id !== genre.id
                                  );
                                  setSelectedGenres(newGenres);
                                  form.setValue(
                                    "genreIds",
                                    newGenres.map((g) => g.id)
                                  );
                                }}
                                className="ml-1 hover:text-destructive"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        <Popover open={openGenre} onOpenChange={setOpenGenre}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openGenre}
                                className="w-full justify-between"
                              >
                                Select genres...
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <Dialog
                            open={openCreateGenre}
                            onOpenChange={setOpenCreateGenre}
                          >
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Create New Genre</DialogTitle>
                              </DialogHeader>
                              <GenreForm
                                onSuccess={(newGenre) => {
                                  setGenres((prev) => [...prev, newGenre]);
                                  setSelectedGenres((prev) => [
                                    ...prev,
                                    newGenre,
                                  ]);
                                  form.setValue("genreIds", [
                                    ...(form.getValues("genreIds") || []),
                                    newGenre.id,
                                  ]);
                                  setOpenCreateGenre(false);
                                  setOpenGenre(false);
                                }}
                              />
                            </DialogContent>
                          </Dialog>
                          <PopoverContent className="w-[400px] p-0">
                            <div className="flex items-center justify-between p-2 border-b">
                              <span className="text-xs font-medium text-muted-foreground px-2">
                                Genres
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                                onClick={() => setOpenCreateGenre(true)}
                              >
                                <Plus className="w-3 h-3 mr-1" /> New Genre
                              </Button>
                            </div>
                            <Command>
                              <CommandInput placeholder="Search genre..." />
                              <CommandList>
                                <CommandEmpty>No genre found.</CommandEmpty>
                                <CommandGroup>
                                  {genres.map((genre) => (
                                    <CommandItem
                                      key={genre.id}
                                      value={genre.name}
                                      onSelect={() => {
                                        const isSelected = selectedGenres.some(
                                          (g) => g.id === genre.id
                                        );
                                        const newGenres = isSelected
                                          ? selectedGenres.filter(
                                              (g) => g.id !== genre.id
                                            )
                                          : [...selectedGenres, genre];

                                        setSelectedGenres(newGenres);
                                        form.setValue(
                                          "genreIds",
                                          newGenres.map((g) => g.id)
                                        );
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedGenres.some(
                                            (g) => g.id === genre.id
                                          )
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
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Crew */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <FormLabel className="text-lg font-semibold">
                  Crew Members
                </FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ role: "", name: "" })}
                >
                  Add Member
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
                          <FormLabel>Role</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Mix & Master" {...field} />
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
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. John Doe" {...field} />
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
                  No crew members added yet.
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              Previous
            </Button>

            {step < 4 ? (
              <Button
                type="button"
                onClick={nextStep}
                className={cn(
                  "transition-colors",
                  ((step === 1 && selectedArtists.length > 0) ||
                    (step === 2 && form.getValues("filename")) ||
                    (step === 3 && form.getValues("title"))) &&
                    "bg-green-600 hover:bg-green-700 text-white border-green-700"
                )}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading}
                className={cn(
                  "transition-colors",
                  form.getValues("title") &&
                    form.getValues("artist") &&
                    form.getValues("filename") &&
                    "bg-green-600 hover:bg-green-700 text-white border-green-700"
                )}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Create Song" : "Update Song"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
