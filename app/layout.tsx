import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PlayerBar from "@/components/PlayerBar";
import PlayerProvider from "@/components/PlayerProvider";
import { Toaster } from "react-hot-toast";

import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: {
    default: "دی بلال | پلتفرم پخش آنلاین آهنگ لری",
    template: "%s | دی بلال",
  },
  description:
    "آهنگ لری مورد علاقه ی خود را پیدا و آنلاین پخش کنید یا با کیفیت عالی دانلود کنید.",
  keywords: [
    "music",
    "streaming",
    "songs",
    "artists",
    "albums",
    "lyrics",
    "download music",
  ],
  authors: [{ name: "ادمین دی بلال" }],
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "https://deybalal.com",
    siteName: "دی بلال",
    title: "دی بلال | پلتفرم پخش آنلاین آهنگ لری",
    description:
      "آهنگ لری مورد علاقه ی خود را پیدا و آنلاین پخش کنید یا با کیفیت عالی دانلود کنید.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "دی بلال",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "دی بلال | پلتفرم پخش آنلاین آهنگ لری",
    description:
      "آهنگ لری مورد علاقه ی خود را پیدا و آنلاین پخش کنید یا با کیفیت عالی دانلود کنید.",
    images: ["/images/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className={`antialiased bg-background text-foreground rtl`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen">
            <Navbar />
            <main className="flex flex-1 justify-center mr-0 md:mr-20 pb-32 md:pb-24 p-4 md:p-8 overflow-y-auto h-screen scroll-smooth">
              {children}
            </main>
          </div>
          <PlayerBar />
          <PlayerProvider />
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
