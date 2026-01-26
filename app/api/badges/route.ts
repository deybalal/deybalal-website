import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const badges = await prisma.badge.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
    return NextResponse.json(badges);
  } catch (error) {
    console.error("Error fetching badges:", error);
    return NextResponse.json(
      { error: "خطا در دریافت نشان ها" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userRole = (session?.user as { role?: string })?.role;

    if (userRole !== "administrator") {
      return NextResponse.json(
        { error: "فقط مدیریت پلتفرم میتواند نشان جدید اضافه کند!" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "نام اجباری است!" }, { status: 400 });
    }

    const existingBadge = await prisma.badge.findUnique({
      where: { name },
    });

    if (existingBadge) {
      return NextResponse.json(
        { error: "نشان با این نام از قبل وجود دارد!" },
        { status: 400 }
      );
    }

    const badge = await prisma.badge.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json({ success: true, data: badge });
  } catch (error) {
    console.error("Error creating badge:", error);
    return NextResponse.json({ error: "خطا در ساخت نشان!" }, { status: 500 });
  }
}
