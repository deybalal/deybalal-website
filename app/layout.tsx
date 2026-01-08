import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PlayerBar from "@/components/PlayerBar";
import PlayerProvider from "@/components/PlayerProvider";
import { Toaster } from "react-hot-toast";

import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: {
    default: "Dey Music | Your Ultimate Music Destination",
    template: "%s | Dey Music",
  },
  description:
    "Discover, stream, and download your favorite music on Dey Music. The best platform for artists and fans.",
  keywords: [
    "music",
    "streaming",
    "songs",
    "artists",
    "albums",
    "lyrics",
    "download music",
  ],
  authors: [{ name: "Dey Music Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dey-music.com",
    siteName: "Dey Music",
    title: "Dey Music | Your Ultimate Music Destination",
    description:
      "Discover, stream, and download your favorite music on Dey Music.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dey Music",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dey Music | Your Ultimate Music Destination",
    description:
      "Discover, stream, and download your favorite music on Dey Music.",
    images: ["/images/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen">
            <Navbar />
            <main className="flex flex-1 justify-center ml-0 md:ml-20 pb-32 md:pb-24 p-4 md:p-8 overflow-y-auto h-screen scroll-smooth">
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
