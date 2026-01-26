import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PlayerBar from "@/components/PlayerBar";
import PlayerProvider from "@/components/PlayerProvider";
import { Toaster } from "react-hot-toast";

import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: {
    default: "دی بلال | Your Ultimate Music Destination",
    template: "%s | دی بلال",
  },
  description:
    "Discover, stream, and download your favorite music on دی بلال. The best platform for artists and fans.",
  keywords: [
    "music",
    "streaming",
    "songs",
    "artists",
    "albums",
    "lyrics",
    "download music",
  ],
  authors: [{ name: "دی بلال Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dey-music.com",
    siteName: "دی بلال",
    title: "دی بلال | Your Ultimate Music Destination",
    description:
      "Discover, stream, and download your favorite music on دی بلال.",
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
    title: "دی بلال | Your Ultimate Music Destination",
    description:
      "Discover, stream, and download your favorite music on دی بلال.",
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
