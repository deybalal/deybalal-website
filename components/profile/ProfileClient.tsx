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
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <Tabs id="profile-tabs" defaultValue="general" className="w-full max-w-4xl">
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <DownloadPreferenceForm
          initialPreference={user.downloadPreference || 128}
        />
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your profile details and public information.
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
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>
              Manage your active sessions across different devices.
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
