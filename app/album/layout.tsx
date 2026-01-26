import { Metadata } from "next";

export const metadata: Metadata = {
  title: "آلبوم ها",
  description: "پخش آنلاین و دانلود آلبوم ها در پلتفرم دی بلال",
};

export default function AlbumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
