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
      },
    });

    if (signUp.user) {
      await prisma.playlist.create({
        data: {
          name: "Favorites",
          description: "Your favorite songs",
          isFavorite: true,
          duration: 0,
          userId: signUp.user.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Sign Up Successful!",
    });
  } catch (error) {
    console.error((error as Error).message);

    return NextResponse.json({
      success: false,
      message: (error as Error).message.includes("prisma")
        ? "Something went wrong!"
        : (error as Error).message,
    });
  }
}
