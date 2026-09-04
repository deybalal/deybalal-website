import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "بازیابی رمز عبور غیرفعال شده است. لطفاً از طریق ربات تلگرام یا شبکه‌های اجتماعی وارد شوید.",
    },
    { status: 403 }
  );
}
