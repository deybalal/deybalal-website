import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ورود به حساب کاربری",
  description: "ورود به حساب کاربری در پلتفرم دی بلال",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
