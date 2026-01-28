"use client";

import { useState } from "react";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { Genre } from "@prisma/client";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
});

type GenreFormValues = z.infer<typeof formSchema>;

interface GenreFormProps {
  initialData?: Genre | null;
  onSuccess?: (genre: Genre) => void;
}

export default function GenreForm({ initialData, onSuccess }: GenreFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<GenreFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
    },
  });

  const onSubmit = async (values: GenreFormValues) => {
    setLoading(true);
    try {
      const url = initialData ? `/api/genres/${initialData.id}` : "/api/genres";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        toast.error(result.message || "خطا در ذخیره سبک");
        throw new Error(result.message || "خطا در ذخیره سبک");
      }

      toast.success(initialData ? "سبک بروزرسانی شد." : "سبک ساخته شد.");

      if (onSuccess) {
        onSuccess(result.data);
      } else {
        router.push("/panel/genres");
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving genre:", error);
      toast.error("خطا در ذخیره سبک");
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    if (!initialData) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      form.setValue("slug", slug);
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نام</FormLabel>
              <FormControl>
                <Input
                  placeholder="نام سبک. مانند: فولکور، یار یار، دی بلال و..."
                  {...field}
                  onChange={handleNameChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>آدرس (Slug)</FormLabel>
              <FormControl>
                <Input placeholder="genre-slug" {...field} />
              </FormControl>
              <FormDescription>
                آدرس یکتا برای این سبک. مانند:
                <span className="block text-lg text-foreground cursor-pointer hover:text-foreground/60 hover:scale-105">
                  {process.env.NEXT_PUBLIC_DEPLOYED_URL}
                  /genres/slug
                </span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading
            ? initialData
              ? "در حال بروزرسانی..."
              : "در حال ساخت..."
            : initialData
            ? "بروزرسانی سبک"
            : "ساخت سبک"}
        </Button>
      </form>
    </Form>
  );
}
