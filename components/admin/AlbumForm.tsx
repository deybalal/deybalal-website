"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { toast } from "react-hot-toast";
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
import Image from "next/image";
import { Genre } from "@prisma/client";

interface Artist {
  id: string;
  name: string;
  nameEn?: string | null;
}

const formSchema = z.object({
  name: z.string().min(1, "نام اجباری است"),
  artistName: z.string().min(1, "نام خواننده اجباری است"),
  nameEn: z.string().min(1, "نام خواننده به انگلیسی اجباری است"),
  artistId: z.string().optional(), // Will be set automatically when artist is selected
  coverArt: z.string().optional(),
  releaseDate: z.string().optional(),
  genreIds: z.array(z.string()).optional(),
});

export default function AlbumForm() {
  const [loading, setLoading] = useState(false);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [uploading, setUploading] = useState(false);
  const [openArtist, setOpenArtist] = useState(false);
  const [openGenre, setOpenGenre] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      artistName: "",
      nameEn: "",
      artistId: "",
      coverArt: "",
      releaseDate: "",
      genreIds: [],
    },
  });

  useEffect(() => {
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
        toast.error("خطا در دریافت لیست خواننده ها");
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
        console.error("خطا در دریافت سبک ها", error);
        toast.error("خطا در دریافت سبک ها");
      }
    };
    fetchArtists();
    fetchGenres();
  }, []);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("لطفا یک تصویر انتخاب کنید!");
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
        throw new Error(result.message || "خطا در ارسال عکس!");
      }

      const { filePath } = result.data;
      form.setValue("coverArt", filePath);
      toast.success("تصویر آهنگ آپلود شد.");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("خطا در ارسال عکس!");
    } finally {
      setUploading(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const res = await fetch("/api/albums/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await res.json();
      if (!res.ok || !result.success)
        throw new Error(result.message || "خطا در ساخت آلبوم");

      toast.success("آلبوم ساخته شد.");
      form.reset();
    } catch {
      toast.error("خطا در ساخت آلبوم");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-md"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نام آلبوم</FormLabel>
              <FormControl>
                <Input placeholder="نام آلبوم را وارد کنید" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="artistName"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>خواننده</FormLabel>
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
                        : "یک خواننده را انتخاب کنید"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="جستوجوی خواننده" />
                    <CommandList>
                      <CommandEmpty>نتیجه ای پیدا نشد!</CommandEmpty>
                      <CommandGroup>
                        {artists.map((artist) => (
                          <CommandItem
                            value={artist.name}
                            key={artist.id}
                            onSelect={() => {
                              form.setValue("artistName", artist.name);
                              form.setValue("artistId", artist.id);
                              if (artist.nameEn) {
                                form.setValue("nameEn", artist.nameEn);
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
          name="nameEn"
          render={({ field }) => (
            <FormItem>
              <FormLabel> نام خواننده به انگلیسی </FormLabel>
              <FormControl>
                <Input
                  placeholder="نام خواننده را به زبان انگلیسی وارد کنید"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="coverArt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تصویر آلبوم (Cover Art)</FormLabel>
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
          name="releaseDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>سال انتشار به میلادی</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  maxLength={4}
                  placeholder="2025"
                  {...field}
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
                      انتخاب سبک ها...
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="جست و جوی سبک..." />
                    <CommandList>
                      <CommandEmpty>نتیجه ای پیدا نشد!</CommandEmpty>
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
        <Button type="submit" disabled={loading}>
          {loading ? "درحال ساخت..." : "ساخت آلبوم"}
        </Button>
      </form>
    </Form>
  );
}
