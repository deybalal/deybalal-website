import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { songs: true, albums: true },
        },
      },
    });
    return NextResponse.json(genres);
  } catch (error) {
    console.error("Error fetching genres:", error);
    return NextResponse.json(
      { error: "Failed to fetch genres" },
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

    if (userRole !== "administrator" && userRole !== "moderator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = slugify(name);

    const existingGenre = await prisma.genre.findUnique({
      where: { slug },
    });

    if (existingGenre) {
      return NextResponse.json(
        { error: "Genre with this name already exists" },
        { status: 400 }
      );
    }

    const genre = await prisma.genre.create({
      data: {
        name,
        slug,
      },
    });

    return NextResponse.json({ success: true, data: genre });
  } catch (error) {
    console.error("Error creating genre:", error);
    return NextResponse.json(
      { error: "Failed to create genre" },
      { status: 500 }
    );
  }
}
