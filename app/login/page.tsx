"use client";
import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="w-full flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Suspense fallback={<div className="text-center text-sm text-muted-foreground animate-pulse">در حال بارگذاری...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
