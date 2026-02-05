import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "صفحه پیدا نشد | پلتفرم دی بلال",
  description: "صفحه ای که دنبالش بودید پیدا نشد!",
};

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300 dark:bg-background dark:text-foreground">
      <div className="w-full max-w-md p-8 bg-white/5 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl border border-gray-200/10 dark:border-gray-700 shadow-lg">
        <div className="relative text-center">
          <h1 className="text-8xl font-extrabold relative z-10 bg-linear-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
            404
          </h1>

          <h2 className="text-xl sm:text-2xl font-semibold mt-4 relative z-10">
            صفحه ای که دنبالش بودید پیدا نشد!
          </h2>

          <p className="mt-3 text-sm sm:text-base text-foreground/80 dark:text-foreground/70 max-w-md mx-auto">
            اگر فکر میکنید مشکلی پیش اومده، با پشتیبانی تماس بگیرید!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <Link href="/">➤ بازگشت به خانه</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
