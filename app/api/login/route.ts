import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { email, password } = body;

    const login = await auth.api.signInEmail({
      body: {
        email,
        password,
        callbackURL: `${process.env.BETTER_AUTH_URL}/panel`,
      },
    });

    if (login.user) {
      return NextResponse.json({
        success: true,
        message: "Sign In Successful!",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password!",
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error((error as Error).message);

    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message.includes("prisma")
          ? "Something went wrong!"
          : (error as Error).message,
      },
      { status: 401 }
    );
  }
}
