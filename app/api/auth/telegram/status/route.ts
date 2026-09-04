import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSecret, signCookieValue } from "@/lib/telegram-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { status: "ERROR", message: "توکن ارسال نشده است" },
        { status: 400 }
      );
    }

    const identifier = `telegram_auth_${token}`;
    const verification = await prisma.verification.findFirst({
      where: { identifier },
    });

    if (!verification) {
      return NextResponse.json({ status: "EXPIRED", message: "درخواست نامعتبر یا منقضی شده است" });
    }

    if (new Date() > verification.expiresAt) {
      await prisma.verification.delete({ where: { id: verification.id } }).catch(() => {});
      return NextResponse.json({ status: "EXPIRED", message: "مهلت زمان ورود به پایان رسیده است" });
    }

    let parsedValue: {
      status?: string;
      sessionToken?: string;
      userId?: string;
      name?: string;
      userSlug?: string;
      downloadPreference?: number;
    } = {};

    try {
      parsedValue = JSON.parse(verification.value);
    } catch {
      // Ignored
    }

    if (parsedValue.status !== "APPROVED" || !parsedValue.sessionToken) {
      return NextResponse.json({ status: "PENDING" });
    }

    // Verify that the session actually exists in DB
    const session = await prisma.session.findUnique({
      where: { token: parsedValue.sessionToken },
      include: { user: true },
    });

    if (!session || new Date() > session.expiresAt || session.user.isBanned) {
      await prisma.verification.delete({ where: { id: verification.id } }).catch(() => {});
      return NextResponse.json(
        { status: "ERROR", message: "جلسه نامعتبر یا مسدود شده است" },
        { status: 403 }
      );
    }

    // Sign the session token for Better-Auth cookie
    const secret = await getAuthSecret();
    const signedToken = await signCookieValue(session.token, secret);

    // Clean up the verification record so token cannot be reused
    await prisma.verification.delete({ where: { id: verification.id } }).catch(() => {});

    const response = NextResponse.json({
      status: "APPROVED",
      success: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        userSlug: session.user.userSlug,
        image: session.user.image,
      },
      downloadPreference: session.user.downloadPreference,
    });

    const isProduction = process.env.NODE_ENV === "production";
    const maxAge = 60 * 60 * 24 * 7; // 7 days

    // Set standard and secure Better-Auth session cookies
    response.cookies.set("dey.session_token", signedToken, {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge,
    });

    if (isProduction) {
      response.cookies.set("__Secure-dey.session_token", signedToken, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge,
      });
    }

    return response;
  } catch (error) {
    console.error("Error checking telegram auth status:", error);
    return NextResponse.json(
      { status: "ERROR", message: "خطا در بررسی وضعیت ورود تلگرام" },
      { status: 500 }
    );
  }
}
