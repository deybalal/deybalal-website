import { prisma } from "./prisma";

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  return await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      link,
    },
  });
}

export async function notifyFollowers({
  artistId,
  type,
  title,
  message,
  link,
}: {
  artistId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  const followers = await prisma.follow.findMany({
    where: { artistId },
    select: { userId: true },
  });

  const notifications = followers.map((follower) => ({
    userId: follower.userId,
    type,
    title,
    message,
    link,
  }));

  if (notifications.length > 0) {
    return await prisma.notification.createMany({
      data: notifications,
    });
  }
}
