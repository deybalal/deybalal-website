import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Sign in to your دی بلال account to access your playlists and favorites.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
