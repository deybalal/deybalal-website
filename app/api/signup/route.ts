import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, email, password } = body;

    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        callbackURL: "/panel",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Sign Up Successful!",
    });
  } catch (error) {
    console.error((error as Error).message);

    return NextResponse.json({
      success: false,
      message: (error as Error).message.includes("prisma")
        ? "Something went wrong!"
        : (error as Error).message,
    });
  }
}
