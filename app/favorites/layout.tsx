import { Metadata } from "next";

export const metadata: Metadata = {
  title: "موردعلاقه ها",
  description: "آهنگ های مورد علاقه ی شما در پلتفرم دی بلال",
};

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
