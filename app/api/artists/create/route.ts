import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "ابتدا وارد حساب کاربری شوید.",
        },
        { status: 401 }
      );
    }

    // Check if user is a verified artist
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isUserAnArtist: true, isVerified: true, role: true },
    });

    if (
      user?.isUserAnArtist &&
      user.isVerified &&
      user.role !== "administrator" &&
      user.role !== "moderator"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "شما یک خواننده ی تایید شده هستید و اجازه ی ساخت خواننده ی جدید ندارید!",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, nameEn, image, description } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: "وارد کردن نام خواننده اجباری است!" },
        { status: 400 }
      );
    }

    const existingArtist = await prisma.artist.findUnique({
      where: { name },
    });

    if (existingArtist) {
      return NextResponse.json(
        { success: false, message: "این خواننده از قبل وجود دارد!" },
        { status: 400 }
      );
    }

    const artist = await prisma.artist.create({
      data: {
        name,
        nameEn,
        image,
        description,
        userId: session.user.id,
      },
    });

    // Invalidate artists cache
    cache.invalidate("artists:");

    return NextResponse.json({ success: true, data: artist });
  } catch (error) {
    console.error("Error creating artist:", error);
    return NextResponse.json(
      { success: false, message: "خطا در ساخت خواننده" },
      { status: 500 }
    );
  }
}
