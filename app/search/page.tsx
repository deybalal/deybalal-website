import SearchInterface from "@/components/SearchInterface";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "جست و جو",
  description:
    "جست و جو در میان آهنگ ها، خواننده ها و آلبوم ها در پلتفرم دی بلال.",
};

export default function SearchPage() {
  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 min-h-screen">
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full pt-4">
        <SearchInterface isPage={true} />
      </div>
    </div>
  );
}
