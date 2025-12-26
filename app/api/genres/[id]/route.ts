import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { slugify } from "@/lib/utils";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userRole = (session?.user as { role?: string })?.role;

    if (userRole !== "administrator" && userRole !== "moderator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = slugify(name);

    // Check if another genre has this slug (excluding current one)
    const existingGenre = await prisma.genre.findFirst({
      where: {
        slug,
        NOT: {
          id,
        },
      },
    });

    if (existingGenre) {
      return NextResponse.json(
        { error: "Genre with this name already exists" },
        { status: 400 }
      );
    }

    const genre = await prisma.genre.update({
      where: { id },
      data: {
        name,
        slug,
      },
    });

    return NextResponse.json({ success: true, data: genre });
  } catch (error) {
    console.error("Error updating genre:", error);
    return NextResponse.json(
      { error: "Failed to update genre" },
      { status: 500 }
    );
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.genre.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting genre:", error);
    return NextResponse.json(
      { error: "Failed to delete genre" },
      { status: 500 }
    );
  }
}
