import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: id },
      select: { badgeId: true },
    });
    return NextResponse.json(userBadges);
  } catch (error) {
    console.error("Error fetching user badges:", error);
    return NextResponse.json(
      { error: "Failed to fetch user badges" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userRole = (session?.user as { role?: string })?.role;

    if (userRole !== "administrator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { badgeIds } = body; // Array of badge IDs

    // Transaction to replace badges
    await prisma.$transaction(async (tx) => {
      // Delete existing badges
      await tx.userBadge.deleteMany({
        where: { userId: id },
      });

      // Create new badges
      if (badgeIds && badgeIds.length > 0) {
        for (const badgeId of badgeIds) {
          await tx.userBadge.create({
            data: {
              userId: id,
              badgeId,
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user badges:", error);
    return NextResponse.json(
      { error: "Failed to update user badges" },
      { status: 500 }
    );
  }
}
