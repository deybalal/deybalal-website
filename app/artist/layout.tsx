import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artists",
  description: "Browse and discover your favorite artists on Dey Music.",
};

export default function ArtistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
