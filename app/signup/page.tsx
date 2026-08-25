"use client";

import { SignupForm } from "@/components/signupForm";
import { Suspense } from "react";

export default function SignupPage() {
  return (
    <div className="w-full flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Suspense fallback={<div className="text-center text-sm text-muted-foreground animate-pulse">در حال بارگذاری...</div>}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
