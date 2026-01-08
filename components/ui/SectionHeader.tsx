import { ChevronRight } from "lucide-react";
import Link from "next/link";

const SectionHeader = ({
  title,
  color,
  href,
}: {
  title: string;
  color: string;
  href?: string;
}) => (
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold text-foreground flex items-center">
      <span
        className={`w-2 h-8 ${color} mr-3 rounded-full shadow-[0_0_10px_currentColor]`}
        style={{ color: color.replace("bg-", "") }}
      ></span>
      {title}
    </h2>
    {href && (
      <Link
        href={href}
        className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center transition-colors"
      >
        Show more <ChevronRight className="w-4 h-4 ml-1" />
      </Link>
    )}
  </div>
);

export default SectionHeader;
