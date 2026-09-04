import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBotUsername } from "@/lib/telegram-auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    await prisma.verification.create({
      data: {
        id: crypto.randomUUID(),
        identifier: `telegram_auth_${token}`,
        value: JSON.stringify({ status: "PENDING", createdAt: Date.now() }),
        expiresAt,
      },
    });

    const botUsername = getBotUsername();
    const botUrl = `https://t.me/${botUsername}?start=login_${token}`;
    const deepLink = `tg://resolve?domain=${botUsername}&start=login_${token}`;

    return NextResponse.json({
      success: true,
      token,
      botUsername,
      botUrl,
      deepLink,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Error creating telegram auth token:", error);
    return NextResponse.json(
      { success: false, message: "خطا در ایجاد درخواست ورود تلگرام" },
      { status: 500 }
    );
  }
}
