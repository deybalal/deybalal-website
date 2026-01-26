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
      { error: "خطا در دریافت سبک ها!" },
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
      return NextResponse.json(
        { error: "شما مجاز به انجام این کار نیستید!" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, slug } = body;

    if (!name) {
      return NextResponse.json({ error: "نام اجباری است!" }, { status: 400 });
    }

    const slugy = slugify(slug);

    console.log("slug ", slugy);

    const existingGenre = await prisma.genre.findUnique({
      where: { slug: slugy },
    });

    if (existingGenre) {
      return NextResponse.json(
        { error: "سبک با این نام از قبل وجود دارد!" },
        { status: 400 }
      );
    }

    const genre = await prisma.genre.create({
      data: {
        name,
        slug: slugy,
      },
    });

    return NextResponse.json({ success: true, data: genre });
  } catch (error) {
    console.error("Error creating genre:", error);
    return NextResponse.json({ error: "خطا در ساخت سبک" }, { status: 500 });
  }
}
