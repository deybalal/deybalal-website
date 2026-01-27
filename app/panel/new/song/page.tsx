import SongForm from "@/components/admin/SongForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewSongPage() {
  return (
    <div className="flex flex-col items-center justify-center size-full mb-24">
      <div className="flex flex-col items-center justify-center w-full h-full">
        <h1 className="text-3xl font-bold text-foreground neon-text mb-5">
          ارسال آهنگ جدید
        </h1>
        <div className="bg-card p-6 rounded-lg border border-border w-full md:w-xl xl:w-3xl">
          <SongForm mode="create" />
        </div>
        <Link href="/panel">
          <Button
            variant="secondary"
            className="h-12 px-6 mt-6 cursor-pointer"
            type="button"
          >
            برگشت به حساب
          </Button>
        </Link>
      </div>
    </div>
  );
}
