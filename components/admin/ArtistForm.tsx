"use client";

import { useState } from "react";
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
import { toast } from "react-hot-toast";
import { Artist } from "@/types/types";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  tempImage: z.string().optional(),
});

type ArtistFormValues = z.infer<typeof formSchema>;

interface ArtistFormProps {
  initialData?: Artist;
  onSuccess?: (artist: Artist) => void;
}

export default function ArtistForm({
  initialData,
  onSuccess,
}: ArtistFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const form = useForm<ArtistFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      nameEn: initialData?.nameEn || "",
      description: initialData?.description || "",
      image: initialData?.image || "",
      tempImage: "",
    },
  });

  async function onSubmit(values: ArtistFormValues) {
    setLoading(true);
    try {
      const url = initialData
        ? `/api/artists/${initialData.id}`
        : "/api/artists/create";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        toast.error(
          result.message ||
            `خطا در ${initialData ? "ویرایش" : "افزودن"} خواننده`
        );
        throw new Error(
          result.message ||
            `خطا در ${initialData ? "ویرایش" : "افزودن"} خواننده`
        );
      }

      toast.success(
        initialData ? "تغییرات ذخیره شد!" : "خواننده ی جدید اضافه شد!"
      );
      if (!initialData) {
        form.reset();
      }
      if (onSuccess) {
        onSuccess(result.data);
      }
    } catch {
      toast.error(`خطا در ${initialData ? "ویرایش" : "افزودن"} خواننده`);
    } finally {
      setLoading(false);
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("لطفا یک عکس انتخاب کنید");
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
        throw new Error(result.message || "خطا در ارسال عکس");
      }

      const { filePath, filename } = result.data;

      form.setValue("image", filePath);
      form.setValue("tempImage", filename);

      toast.success("عکس آپلود شد");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("خطا در ارسال عکس");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.stopPropagation();
          form.handleSubmit(onSubmit)(e);
        }}
        className="space-y-4 max-w-md"
      >
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تصویر خواننده</FormLabel>
              <FormControl>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="w-full"
                    />
                  </div>
                  {field.value && (
                    <div className="relative w-32 h-32 rounded-md overflow-hidden border">
                      <Image
                        src={field.value}
                        alt="Artist Image Preview"
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نام</FormLabel>
              <FormControl>
                <Input placeholder="نام خواننده" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nameEn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نام خواننده به انگلیسی</FormLabel>
              <FormControl>
                <Input placeholder="نام خواننده به زبان انگلیسی" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>درباره خواننده</FormLabel>
              <FormControl>
                <Textarea placeholder="درباره خواننده" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading
            ? initialData
              ? "در حال ویرایش..."
              : "در حال ساخت..."
            : initialData
            ? "ذخیره تغییرات"
            : "افزودن"}
        </Button>
      </form>
    </Form>
  );
}
