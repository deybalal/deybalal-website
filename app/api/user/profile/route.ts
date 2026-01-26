import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  isPrivate: z.boolean().optional(),
  downloadPreference: z.number().optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "شما مجاز به انجام این کار نیستید!" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = profileSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.isPrivate !== undefined && {
          isPrivate: validatedData.isPrivate,
        }),
        ...(validatedData.downloadPreference !== undefined && {
          downloadPreference: validatedData.downloadPreference,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        isPrivate: updatedUser.isPrivate,
        downloadPreference: updatedUser.downloadPreference,
      },
      message: "پروفایل با موفقیت ویرایش شد!",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "خطا در ویرایش پروفایل!" },
      { status: 500 }
    );
  }
}
