import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileClient from "@/components/profile/ProfileClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "مدیریت حساب کاربری",
  description: "مدیریت و تغییر تنظیمات حساب کاربری در پلتفرم دی بلال.",
};

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      image: true,
      userSlug: true,
      isPrivate: true,
      downloadPreference: true,
    },
  });

  if (!user) {
    return redirect("/login");
  }

  return (
    <div className="container mx-auto py-10 ps-4 pe-4 md:ps-8 md:pe-8 mb-24 h-max">
      <h1 className="text-3xl font-bold mb-8">تنظیمات حساب کاربری</h1>
      <ProfileClient user={user} />
    </div>
  );
}
