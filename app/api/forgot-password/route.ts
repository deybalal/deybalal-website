import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isValidEmail } from "@/lib/input-sanitizer";
import { verifyCaptchaToken } from "@/lib/captcha";
import { cookies } from "next/headers";
import { hashPassword } from "better-auth/crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, newPassword, captchaToken, captchaAnswer } = body;

    // Validate CAPTCHA
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("captcha_token")?.value;
    const tokenToVerify = captchaToken || cookieToken || "";

    if (!tokenToVerify || !verifyCaptchaToken(tokenToVerify, captchaAnswer || "")) {
      return NextResponse.json(
        { success: false, message: "کد امنیتی نامعتبر است. لطفاً کپچا را مجدداً حل کنید." },
        { status: 400 }
      );
    }

    // Invalidate CAPTCHA cookie after use
    cookieStore.set("captcha_token", "", { maxAge: 0 });

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: "فرمت ایمیل وارد شده نامعتبر است." },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "رمز عبور جدید باید حداقل ۸ کاراکتر باشد." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "کاربری با این آدرس ایمیل یافت نشد." },
        { status: 404 }
      );
    }

    try {
      const hashedPassword = await hashPassword(newPassword);

      const account = await prisma.account.findFirst({
        where: {
          userId: user.id,
          providerId: "credential",
        },
      });

      if (!account) {
        return NextResponse.json(
          {
            success: false,
            message:
              "حساب کاربری با رمز عبور برای این ایمیل یافت نشد (ممکن است با گوگل یا اینستاگرام ثبت‌نام کرده باشید).",
          },
          { status: 400 }
        );
      }

      await prisma.account.update({
        where: { id: account.id },
        data: { password: hashedPassword },
      });

      return NextResponse.json({
        success: true,
        message: "رمز عبور با موفقیت بازنشانی شد! اکنون می‌توانید وارد شوید.",
      });
    } catch (err: unknown) {
      console.error("Error setting password in forgot-password:", err);
      return NextResponse.json(
        {
          success: false,
          message: "خطا در بروزرسانی رمز عبور. لطفاً مجدداً تلاش کنید.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in forgot-password route:", error);
    return NextResponse.json(
      { success: false, message: "خطایی در سرور هنگام بازنشانی رمز عبور رخ داد." },
      { status: 500 }
    );
  }
}
