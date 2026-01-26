import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { email, password } = body;

    const findUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (findUser?.isBanned) {
      return NextResponse.json(
        {
          success: false,
          message: "شما بلاک شده اید!",
        },
        { status: 401 }
      );
    }

    const login = await auth.api.signInEmail({
      body: {
        email,
        password,
        callbackURL: `${process.env.BETTER_AUTH_URL}/panel`,
      },
    });

    if (login.user) {
      return NextResponse.json({
        success: true,
        downloadPreference: login.user.downloadPreference,
        message: "ورود موفق به حساب کاربری!",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "خطا! ایمیل یا رمز اشتباه است!",
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error((error as Error).message);

    return NextResponse.json(
      {
        success: false,
        message: "خطایی پیش آمد!",
      },
      { status: 401 }
    );
  }
}
