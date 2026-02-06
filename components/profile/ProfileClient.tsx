"use client";

import { useSyncExternalStore } from "react";
import ProfileForm from "@/components/profile/ProfileForm";
import DownloadPreferenceForm from "@/components/profile/DownloadPreferenceForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProfileClientProps {
  user: {
    id: string;
    name: string;
    bio: string;
    image: string | null;
    userSlug: string;
    isPrivate: boolean;
    downloadPreference: number | null;
  };
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div className="w-full max-w-4xl h-[400px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          در حال بارگذاری تنظیمات...
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl">
      <DownloadPreferenceForm
        initialPreference={user.downloadPreference || 128}
      />
      <Card>
        <CardHeader>
          <CardTitle>اطلاعات حساب کاربری</CardTitle>
          <CardDescription>
            اطلاعات حساب کاربری و اطلاعات عمومی خود را بروزرسانی کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
