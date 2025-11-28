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
import { Textarea } from "@/components/ui/textarea";
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

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  titleEn: z.string().optional(),
  artist: z.string().min(2, "You must enter artist name!"),
  artistEn: z.string().optional(),
  albumId: z.string().optional(),
  albumName: z.string().optional(),
  coverArt: z.string().optional(),
  duration: z.number().min(0).optional(),
  filename: z.string().optional(),
  lyrics: z.string().optional(),
  syncedLyrics: z.string().optional(),
  tempCoverArt: z.string().optional(),
});

type SongFormValues = z.infer<typeof formSchema>;

export default function SongForm() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [openArtist, setOpenArtist] = useState(false);

  const form = useForm<SongFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      titleEn: "",
      artist: "",
      artistEn: "",
      albumId: "",
      albumName: "",
      coverArt: "",
      duration: 0,
      filename: "",
      lyrics: "",
      syncedLyrics: "",
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
            console.log(result.data);
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

  async function onSubmit(values: SongFormValues) {
    setLoading(true);
    try {
      const res = await fetch("/api/songs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        toast.error(result.message || "Failed to create song");
        throw new Error(result.message || "Failed to create song");
      }

      toast.success("Song created successfully");
      form.reset();
    } catch {
      toast.error("Failed to create song");
    } finally {
      setLoading(false);
    }
  }

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
      if (metadata.artist) form.setValue("artist", metadata.artist);
      if (metadata.album) form.setValue("albumName", metadata.album);
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

  console.log(albums);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-md"
      >
        <FormItem>
          <FormLabel>Upload MP3</FormLabel>
          <FormControl>
            <Input
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        <FormField
          control={form.control}
          name="lyrics"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lyrics</FormLabel>
              <FormControl>
                <Textarea placeholder="Song lyrics..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="syncedLyrics"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Synced Lyrics (LRC)</FormLabel>
              <FormControl>
                <Textarea placeholder="[00:00.00] Lyrics..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Song"}
        </Button>
      </form>
    </Form>
  );
}
