import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Liked Songs",
  description: "Your personal collection of favorite songs on دی بلال.",
};

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
