"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field";
import { useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { TelegramLoginModal } from "@/components/TelegramLoginModal";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  const searchParams = useSearchParams();

  // Get and sanitize redirect URL to handle callback redirect support safely
  const rawRedirect = searchParams.get("redirect") || searchParams.get("callbackUrl");
  const safeRedirect = rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
    ? rawRedirect
    : "/panel";

  const handleOAuthSignIn = async (provider: "google" | "instagram" | "github") => {
    if (loadingProvider) return;
    setLoadingProvider(provider);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: safeRedirect,
      });
    } catch (error) {
      console.error(`${provider} sign in failed:`, error);
      toast.error(`خطا در ورود با ${provider === "google" ? "گوگل" : provider === "instagram" ? "اینستاگرام" : "گیت‌هاب"}`);
      setLoadingProvider(null);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="shadow-lg border-border/60">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-black flex flex-col gap-y-1 text-primary">
            <span>خَش اومیی!</span>
            <span className="text-lg font-semibold text-muted-foreground">خوش آمدید</span>
          </CardTitle>
          <CardDescription className="text-sm mt-2 leading-relaxed">
            برای ارسال نظر، ساخت و مدیریت پلی‌لیست، پیشنهاد و ویرایش متن آهنگ، وارد حساب کاربری خود شوید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-3">
            <Field>
              {/* Telegram Bot Login */}
              <Button
                size="lg"
                type="button"
                className="w-full bg-[#229ED9] hover:bg-[#1c8ec4] text-white font-semibold py-6 text-base gap-3 shadow-md transition-all active:scale-[0.99]"
                onClick={() => setTelegramModalOpen(true)}
              >
                <svg
                  className="h-6 w-6 fill-current shrink-0"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.872-1.025 4.887-1.442 6.848-.176.828-.485 1.106-.782 1.133-.647.059-1.138-.428-1.764-.838-.98-.642-1.534-1.042-2.484-1.668-1.098-.724-.386-1.121.24-1.771.164-.17 3.008-2.756 3.064-2.993.007-.03.013-.14-.053-.198-.065-.058-.161-.038-.231-.023-.099.022-1.678 1.066-4.736 3.131-.448.308-.854.458-1.218.45-.401-.008-1.173-.227-1.747-.413-.705-.229-1.267-.35-1.218-.739.026-.203.307-.41.845-.623 3.312-1.442 5.522-2.393 6.63-2.855 3.155-1.312 3.811-1.54 4.238-1.548.094-.002.304.022.44.133.115.094.147.221.16.311.014.09.031.291.017.45z" />
                </svg>
                <span>ورود با ربات تلگرام</span>
              </Button>
            </Field>

            <Field>
              {/* Instagram OAuth */}
              <Button
                variant="outline"
                size="lg"
                type="button"
                disabled={loadingProvider !== null}
                className="w-full py-6 text-base gap-3 border-border hover:bg-muted/80 transition-all font-medium"
                onClick={() => handleOAuthSignIn("instagram")}
              >
                <svg
                  className="h-5 w-5 shrink-0 fill-[#E4405F]"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span>{loadingProvider === "instagram" ? "در حال انتقال..." : "ورود با اینستاگرام"}</span>
              </Button>
            </Field>

            <Field>
              {/* Google OAuth */}
              <Button
                variant="outline"
                size="lg"
                type="button"
                disabled={loadingProvider !== null}
                className="w-full py-6 text-base gap-3 border-border hover:bg-muted/80 transition-all font-medium"
                onClick={() => handleOAuthSignIn("google")}
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                <span>{loadingProvider === "google" ? "در حال انتقال..." : "ورود با حساب گوگل"}</span>
              </Button>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center text-xs text-muted-foreground">
        با ورود به حساب، شما <a href="/tos" className="underline hover:text-foreground">شرایط و قوانین</a> سرویس دی‌بلال را می‌پذیرید.
      </FieldDescription>

      {/* Telegram Login Modal */}
      <TelegramLoginModal
        open={telegramModalOpen}
        onOpenChange={setTelegramModalOpen}
        redirectUrl={safeRedirect}
      />
    </div>
  );
}
