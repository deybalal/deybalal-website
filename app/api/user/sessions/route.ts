import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const sessions = await prisma.session.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    // Mark current session
    const sessionsWithCurrent = sessions.map((s) => ({
      ...s,
      isCurrent: s.token === session.session.token,
    }));

    return NextResponse.json({
      success: true,
      data: sessionsWithCurrent,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("id");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: "Session ID is required" },
        { status: 400 }
      );
    }

    // Verify session belongs to user
    const targetSession = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!targetSession || targetSession.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "Session not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({
      success: true,
      message: "Session revoked successfully",
    });
  } catch (error) {
    console.error("Error revoking session:", error);
    return NextResponse.json(
      { success: false, message: "Failed to revoke session" },
      { status: 500 }
    );
  }
}
