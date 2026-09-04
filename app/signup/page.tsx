"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function SignupRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();
    router.replace(`/login${params ? `?${params}` : ""}`);
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">در حال انتقال به صفحه ورود...</p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="w-full flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <Suspense fallback={<div className="text-center text-sm text-muted-foreground animate-pulse">در حال بارگذاری...</div>}>
        <SignupRedirect />
      </Suspense>
    </div>
  );
}
