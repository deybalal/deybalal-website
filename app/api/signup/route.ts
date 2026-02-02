import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isValidEmail } from "@/lib/input-sanitizer";
import { validatePassword } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate inputs
    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "تمام فیلدها اجباری هستند",
        },
        { status: 400 }
      );
    }

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

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: passwordValidation.errors.join(", "),
        },
        { status: 400 }
      );
    }

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

    return NextResponse.json(
      {
        success: false,
        message: "خطایی پیش آمد!",
      },
      { status: 500 }
    );
  }
}
