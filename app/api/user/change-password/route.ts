import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
    const { currentPassword, newPassword, isForgotMode } = body;

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "رمز عبور جدید باید حداقل ۸ کاراکتر باشد." },
        { status: 400 }
      );
    }

    if (!isForgotMode) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, message: "وارد کردن رمز عبور فعلی الزامی است." },
          { status: 400 }
        );
      }

      try {
        await auth.api.changePassword({
          body: {
            currentPassword,
            newPassword,
            revokeOtherSessions: false,
          },
          headers: await headers(),
        });

        return NextResponse.json({
          success: true,
          message: "رمز عبور با موفقیت تغییر یافت!",
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "خطا در تغییر رمز عبور. لطفاً از صحت رمز فعلی اطمینان حاصل کنید.";
        console.error("Change password error:", err);
        return NextResponse.json(
          {
            success: false,
            message,
          },
          { status: 400 }
        );
      }
    } else {
      // Forgot Password mode (resetting password for logged in user)
      try {
        await auth.api.setPassword({
          body: {
            newPassword,
          },
          headers: await headers(),
        });

        return NextResponse.json({
          success: true,
          message: "رمز عبور جدید با موفقیت ثبت شد!",
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "خطا در ثبت رمز عبور جدید. لطفاً دوباره تلاش کنید.";
        console.error("Set password error:", err);
        return NextResponse.json(
          {
            success: false,
            message,
          },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error("Error in change-password route:", error);
    return NextResponse.json(
      { success: false, message: "خطایی در سرور هنگام بروزرسانی رمز عبور رخ داد." },
      { status: 500 }
    );
  }
}
