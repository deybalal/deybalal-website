import { Metadata } from "next";

export const metadata: Metadata = {
  title: "خواننده ها",
  description: "خواننده ی محبوب خود را در پلتفرم آهنگ لری دی بلال پیدا کنید.",
};

export default function ArtistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
