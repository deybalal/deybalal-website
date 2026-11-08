import Image from "next/image";
import Link from "next/link";
import { getAssetUrl } from "@/lib/utils";

interface GenreCardProps {
  id: string;
  count: number;
  date: Date;
  totalDuration: string;
  coverArts: (string | null)[];
}

const RadioPlaylistItem = ({
  id,
  count,
  date,
  totalDuration,
  coverArts,
}: GenreCardProps) => {
  return (
    <>
      <Link href={`/radio/history/${id}`} className="block group w-full">
        <div className="flex flex-col items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all duration-300">
          <div className="relative flex w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300 border-2 border-transparent group-hover:border-purple-500/50">
            {coverArts ? (
              coverArts.map((cover, i) => (
                <Image
                  key={i}
                  src={getAssetUrl(cover) || "/images/default-album-art.png"}
                  alt={"آهنگ در رادیو دی بلال"}
                  width={60}
                  height={60}
                  className="object-cover"
                />
              ))
            ) : (
              <div className="w-full h-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">{"D"}</span>
              </div>
            )}
          </div>
          <div className="text-center">
            <h3 className="text-foreground font-bold truncate text-lg group-hover:text-purple-400 transition-colors">
              پلی لیست{" "}
              {new Date(date).toLocaleDateString("fa-IR", {
                numberingSystem: "latn",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}
            </h3>
            <p className="text-gray-400 text-sm">
              {count && (
                <span className="text-white/80 text-sm font-medium">
                  {count} آهنگ
                </span>
              )}
              {count && totalDuration ? <br /> : ""}
              {totalDuration && (
                <span className="text-white/80 text-sm font-medium">
                  {totalDuration}
                </span>
              )}
            </p>
          </div>
        </div>
      </Link>
    </>
  );
};

export default RadioPlaylistItem;
