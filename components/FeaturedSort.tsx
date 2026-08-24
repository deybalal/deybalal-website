"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { SortDropdown, SortOption } from "./SortDropdown";
import { ArrowDownAZ, Clock, PlayCircle } from "lucide-react";

const FeaturedSort = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onSortChange = (sortBy: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSortBy = searchParams.get("sortBy");
    const currentOrder = searchParams.get("sortOrder") || "desc";

    if (currentSortBy === sortBy) {
      params.set("sortOrder", currentOrder === "desc" ? "asc" : "desc");
    } else {
      params.set("sortBy", sortBy);
      params.set("sortOrder", "desc");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const sortOptions: SortOption[] = [
    {
      label: "جدیدترین",
      value: "createdAt",
      icon: <Clock className="w-4 h-4" />,
    },
    {
      label: "بیشترین پخش",
      value: "playCount",
      icon: <PlayCircle className="w-4 h-4" />,
    },
    {
      label: "نام (الفبا)",
      value: "title",
      icon: <ArrowDownAZ className="w-4 h-4" />,
    },
  ];

  const sortBy = searchParams.get("sortBy") || "playCount";
  return (
    <div className="flex w-full justify-end">
      <div className="flex items-center max-w-[50%] md:max-w-max">
        <SortDropdown
          options={sortOptions}
          value={sortBy}
          onChange={onSortChange}
          className="w-full md:w-[200px]"
        />
      </div>
    </div>
  );
};

export default FeaturedSort;
