import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }

    const login = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    if (login.user && login.token) {
      return NextResponse.json({
        success: true,
        message: "Sign In Successful!",
        user: login.user,
        token: login.token,
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
    console.error("Mobile login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || "Something went wrong!",
      },
      { status: 500 }
    );
  }
}
