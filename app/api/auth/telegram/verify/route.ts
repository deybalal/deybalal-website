import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function generateSlug(length = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const expectedSecret = process.env.TELEGRAM_BOT_SECRET;
    if (expectedSecret) {
      const headerSecret = request.headers.get("x-telegram-bot-secret");
      if (headerSecret !== expectedSecret) {
        return NextResponse.json(
          { success: false, message: "دسترسی غیرمجاز (کلید امنیتی ربات نامعتبر است)" },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    const { token, telegramUser } = body;

    if (!token || !telegramUser || !telegramUser.id) {
      return NextResponse.json(
        { success: false, message: "اطلاعات ارسالی ناقص است" },
        { status: 400 }
      );
    }

    const identifier = `telegram_auth_${token}`;
    const verification = await prisma.verification.findFirst({
      where: { identifier },
    });

    if (!verification) {
      return NextResponse.json(
        { success: false, message: "درخواست ورود یافت نشد یا منقضی شده است" },
        { status: 404 }
      );
    }

    if (new Date() > verification.expiresAt) {
      await prisma.verification.delete({ where: { id: verification.id } }).catch(() => {});
      return NextResponse.json(
        { success: false, message: "مهلت زمان ورود به پایان رسیده است. لطفاً مجدداً تلاش کنید." },
        { status: 400 }
      );
    }

    let parsedValue: { status?: string } = {};
    try {
      parsedValue = JSON.parse(verification.value);
    } catch {
      // Ignored
    }

    if (parsedValue.status === "APPROVED") {
      return NextResponse.json({
        success: true,
        message: "این درخواست قبلاً تأیید شده است",
      });
    }

    const telegramIdStr = telegramUser.id.toString();
    const telegramEmail = `tg_${telegramIdStr}@telegram.deybalal.ir`;

    // 1. Find user by Telegram Account
    const existingAccount = await prisma.account.findFirst({
      where: {
        providerId: "telegram",
        accountId: telegramIdStr,
      },
      include: { user: true },
    });

    let user = existingAccount?.user;

    // 2. If no account, check user by email
    if (!user) {
      user = (await prisma.user.findUnique({
        where: { email: telegramEmail },
      })) || undefined;
    }

    const fullName = [telegramUser.first_name, telegramUser.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || telegramUser.username || `کاربر تلگرام (${telegramIdStr})`;

    // 3. If user still not found, create new user
    if (!user) {
      const newUserId = crypto.randomUUID();
      let userSlug = generateSlug(10);
      // Ensure unique slug
      let slugExists = await prisma.user.findUnique({ where: { userSlug } });
      while (slugExists) {
        userSlug = generateSlug(10);
        slugExists = await prisma.user.findUnique({ where: { userSlug } });
      }

      user = await prisma.user.create({
        data: {
          id: newUserId,
          name: fullName,
          email: telegramEmail,
          emailVerified: true,
          image: telegramUser.photo_url || null,
          userSlug,
          role: "user",
          isPrivate: false,
          isBanned: false,
          downloadPreference: 128,
          accounts: {
            create: {
              id: crypto.randomUUID(),
              providerId: "telegram",
              accountId: telegramIdStr,
            },
          },
        },
      });

      // Create default playlists
      try {
        await prisma.playlist.createMany({
          data: [
            {
              id: crypto.randomUUID(),
              name: "موردعلاقه ها",
              description: "آهنگ های موردعلاقه شما",
              isFavorite: true,
              duration: 0,
              userId: user.id,
            },
            {
              id: crypto.randomUUID(),
              name: "لیست دانلود",
              description: "آهنگ هایی که میخواهید دانلود کنید. (روی موبایل)",
              isDownload: true,
              duration: 0,
              userId: user.id,
              coverArt: "/images/download.png",
            },
          ],
          skipDuplicates: true,
        });
      } catch (err) {
        console.error("Error creating default playlists for telegram user:", err);
      }
    } else {
      // Ensure account record exists for this provider
      if (!existingAccount) {
        await prisma.account.create({
          data: {
            id: crypto.randomUUID(),
            providerId: "telegram",
            accountId: telegramIdStr,
            userId: user.id,
          },
        }).catch(() => {});
      }
    }

    if (user.isBanned) {
      return NextResponse.json(
        { success: false, message: "حساب کاربری شما مسدود شده است" },
        { status: 403 }
      );
    }

    // 4. Create Better-Auth Session
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.session.create({
      data: {
        id: crypto.randomUUID(),
        token: sessionToken,
        userId: user.id,
        expiresAt: sessionExpiresAt,
      },
    });

    // 5. Mark verification record as APPROVED
    await prisma.verification.update({
      where: { id: verification.id },
      data: {
        value: JSON.stringify({
          status: "APPROVED",
          sessionToken,
          userId: user.id,
          name: user.name,
          userSlug: user.userSlug,
          downloadPreference: user.downloadPreference,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "ورود با موفقیت تأیید شد!",
      user: {
        id: user.id,
        name: user.name,
        userSlug: user.userSlug,
      },
    });
  } catch (error) {
    console.error("Error verifying telegram login:", error);
    return NextResponse.json(
      { success: false, message: "خطا در تایید ورود با تلگرام" },
      { status: 500 }
    );
  }
}
