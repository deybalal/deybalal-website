import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ثبت نام",
  description: "ثبت نام در پلتفرم دی بلال",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
