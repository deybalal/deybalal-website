import SongForm from "@/components/admin/SongForm";

export default function NewSongPage() {
  return (
    <div className="flex flex-col items-center justify-center size-full mb-64 my-36 ">
      <div className="flex flex-col items-center justify-center w-full h-full">
        <h1 className="text-3xl font-bold text-foreground neon-text mb-5">
          Add New Song
        </h1>
        <div className="bg-card p-6 rounded-lg border border-border w-full md:w-xl xl:w-3xl">
          <SongForm mode="create" />
        </div>
      </div>
    </div>
  );
}
