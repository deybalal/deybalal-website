import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new دی بلال account and start your musical journey.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
