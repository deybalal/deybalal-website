import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileForm from "@/components/profile/ProfileForm";
import SessionsList from "@/components/profile/SessionsList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-8">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      <Tabs defaultValue="general" className="w-full max-w-4xl">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile details and public information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm />
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
    </div>
  );
}
