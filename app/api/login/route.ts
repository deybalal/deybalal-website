import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { logAuthAttempt } from "@/lib/logger";
import { isValidEmail } from "@/lib/input-sanitizer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "فرمت ایمیل نامعتبر است",
        },
        { status: 400 }
      );
    }

    const login = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

    if (!login.user) {
      // Log failed attempt
      logAuthAttempt(false, email, ip, "Invalid credentials");

      return NextResponse.json(
        {
          success: false,
          message: "ایمیل یا رمز عبور اشتباه است",
        },
        { status: 401 }
      );
    }

    // Log successful login
    logAuthAttempt(true, email, ip);

    // Check if user is banned
    const user = await prisma.user.findUnique({
      where: { id: login.user.id },
      select: { isBanned: true },
    });

    if (user?.isBanned) {
      return NextResponse.json(
        {
          success: false,
          message: "حساب کاربری شما مسدود شده است",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ورود موفقیت آمیز بود!",
      user: login.user,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "خطایی پیش آمد!",
      },
      { status: 500 }
    );
  }
}
