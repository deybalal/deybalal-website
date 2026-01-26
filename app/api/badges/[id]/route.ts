import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userRole = (session?.user as { role?: string })?.role;

    if (userRole !== "administrator") {
      return NextResponse.json(
        { error: "خطا! این اقدام مخصوص مدیریت است!" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "نام اجباری است!" }, { status: 400 });
    }

    // Check if another badge has the same name
    const existingBadge = await prisma.badge.findFirst({
      where: {
        name,
        NOT: {
          id,
        },
      },
    });

    if (existingBadge) {
      return NextResponse.json(
        { error: "این نشان از قبل وجود دارد!" },
        { status: 400 }
      );
    }

    const badge = await prisma.badge.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    return NextResponse.json({ success: true, data: badge });
  } catch (error) {
    console.error("Error updating badge:", error);
    return NextResponse.json({ error: "خطا در ویرایش عنوان" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userRole = (session?.user as { role?: string })?.role;

    if (userRole !== "administrator") {
      return NextResponse.json(
        { error: "خطا! این اقدام مخصوص مدیریت است!" },
        { status: 401 }
      );
    }

    const { id } = await params;

    await prisma.badge.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting badge:", error);
    return NextResponse.json(
      { success: false, message: "خطا در حذف نشان" },
      { status: 500 }
    );
  }
}
