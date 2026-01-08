import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Albums",
  description: "Explore the latest albums and collections on Dey Music.",
};

export default function AlbumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
