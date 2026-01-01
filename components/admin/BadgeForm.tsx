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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { Badge } from "@prisma/client";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
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
      description: initialData?.description || "",
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
      if (!res.ok || result.success === false) {
        const errorMessage =
          result.error || result.message || "Failed to save badge";
        toast.error(errorMessage);
        throw new Error(errorMessage);
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
  };

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
