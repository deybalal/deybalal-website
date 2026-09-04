import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "ثبت‌نام با ایمیل غیرفعال شده است. حساب کاربری شما به صورت خودکار هنگام ورود با ربات تلگرام یا شبکه‌های اجتماعی ساخته می‌شود.",
    },
    { status: 403 }
  );
}
