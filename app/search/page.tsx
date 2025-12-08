import SearchInterface from "@/components/SearchInterface";

export default function SearchPage() {
  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 min-h-screen">
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full pt-4">
        <SearchInterface isPage={true} />
      </div>
    </div>
  );
}
