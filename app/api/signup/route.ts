import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, email, password } = body;

    const signUp = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        userSlug: undefined as unknown as string,
        role: "user",
        isPrivate: true,
        isBanned: false,
        callbackURL: "/panel",
        downloadPreference: 128,
      },
    });

    if (signUp.user) {
      await prisma.playlist.create({
        data: {
          name: "موردعلاقه ها",
          description: "آهنگ های موردعلاقه شما",
          isFavorite: true,
          duration: 0,
          userId: signUp.user.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "ثبت نام با موفقیت انجام شد!",
    });
  } catch (error) {
    console.error((error as Error).message);

    return NextResponse.json({
      success: false,
      message: "Something went wrong!",
    });
  }
}
