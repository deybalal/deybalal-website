"use client";

import { useSyncExternalStore } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileForm from "@/components/profile/ProfileForm";
import DownloadPreferenceForm from "@/components/profile/DownloadPreferenceForm";
import SessionsList from "@/components/profile/SessionsList";
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
    <Tabs id="profile-tabs" defaultValue="general" className="w-full max-w-4xl">
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="general">عمومی</TabsTrigger>
        <TabsTrigger value="security">امنیت</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
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
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>نشست‌های فعال</CardTitle>
            <CardDescription>
              نشست‌های فعال خود را در دستگاه‌های مختلف مدیریت کنید.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SessionsList />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
