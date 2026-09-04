"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();
    router.replace(`/login${params ? `?${params}` : ""}`);
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center p-6">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">در حال انتقال به صفحه ورود...</p>
    </div>
  );
}
