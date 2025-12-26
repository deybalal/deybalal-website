"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { Badge } from "@prisma/client";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
});

type BadgeFormValues = z.infer<typeof formSchema>;

interface BadgeFormProps {
  initialData?: Badge | null;
}

export default function BadgeForm({ initialData }: BadgeFormProps) {
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const form = useForm<BadgeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      icon: initialData?.icon || "",
    },
  });

  const onSubmit = async (values: BadgeFormValues) => {
    setLoading(true);
    try {
      const url = initialData ? `/api/badges/${initialData.id}` : "/api/badges";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        toast.error(result.message || "Failed to save badge");
        throw new Error(result.message || "Failed to save badge");
      }

      toast.success(
        initialData
          ? "Badge updated successfully"
          : "Badge created successfully"
      );
      router.push("/panel?tab=badges");
      router.refresh();
    } catch (error) {
      console.error("Error saving badge:", error);
      toast.error("Failed to save badge");
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    if (!initialData) {
      form.setValue("slug", slugify(name));
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-md"
      >
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => {
            const IconComponent = (LucideIcons as Record<string, unknown>)[
              field.value || "Badge"
            ] as LucideIcon | undefined;
            return (
              <FormItem>
                <FormLabel>Badge Icon (Lucide Name)</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-4">
                    <Input
                      placeholder="e.g. Award, Star, Shield"
                      {...field}
                      className="flex-1"
                    />
                    <div className="flex items-center justify-center w-10 h-10 rounded-md border bg-muted">
                      {IconComponent ? (
                        <IconComponent className="w-6 h-6" />
                      ) : (
                        <LucideIcons.HelpCircle className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </FormControl>
                <FormDescription>
                  Enter a valid Lucide icon name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Badge Name"
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
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="badge-slug" {...field} />
              </FormControl>
              <FormDescription>
                Unique identifier for the badge.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Badge description..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading
            ? initialData
              ? "Updating..."
              : "Creating..."
            : initialData
            ? "Update Badge"
            : "Create Badge"}
        </Button>
      </form>
    </Form>
  );
}
