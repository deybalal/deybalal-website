"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Instagram } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: {
    name: string;
    image: string | null;
    userSlug: string;
    isPrivate: boolean;
    downloadPreference?: number | null;
  };
}

const profileSchema = z.object({
  name: z.string().min(1, "نام اجباری است"),
  image: z.string().optional(),
  isPrivate: z.boolean().optional(),
});

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
      isPrivate: user.isPrivate || false,
    },
    values: {
      name: user.name || "",
      isPrivate: user.isPrivate || false,
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "خطا در بروزرسانی پروفایل");
      }

      toast.success("پروفایل با موفقیت بروزرسانی شد");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "مشکلی پیش آمده است"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-md"
      >
        <div className="mb-8 text-xl">
          برای تغییر آواتار، باید خارج شده و دوباره با اینستاگرام وارد شوید!{" "}
          <Instagram className="inline-block mr-1 text-purple-500" />
        </div>

        {mounted && user?.userSlug && (
          <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5">
              <h3 className="font-semibold leading-none tracking-tight">
                پروفایل عمومی
              </h3>
              <p className="text-sm text-muted-foreground">
                پروفایل عمومی شما در این آدرس در دسترس است:
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                {`${window.location.origin}/u/${user.userSlug}`}
              </code>
              <Link
                href={`/u/${user.userSlug}`}
                target="_blank"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نام</FormLabel>
              <FormControl>
                <Input placeholder="نام شما" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPrivate"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">پروفایل خصوصی</FormLabel>
                <div className="text-sm text-muted-foreground">
                  در صورت فعال بودن، فقط خودتان می‌توانید پروفایل و لیست‌های پخش
                  خود را ببینید.
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

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </Button>
      </form>
    </Form>
  );
}
