import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const badges = await prisma.badge.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
    return NextResponse.json(badges);
  } catch (error) {
    console.error("Error fetching badges:", error);
    return NextResponse.json(
      { error: "Failed to fetch badges" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userRole = (session?.user as { role?: string })?.role;

    if (userRole !== "administrator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, icon } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = slugify(name);

    const existingBadge = await prisma.badge.findUnique({
      where: { slug },
    });

    if (existingBadge) {
      return NextResponse.json(
        { error: "Badge with this name already exists" },
        { status: 400 }
      );
    }

    const badge = await prisma.badge.create({
      data: {
        name,
        slug,
        description,
        icon,
      },
    });

    return NextResponse.json({ success: true, data: badge });
  } catch (error) {
    console.error("Error creating badge:", error);
    return NextResponse.json(
      { error: "Failed to create badge" },
      { status: 500 }
    );
  }
}
