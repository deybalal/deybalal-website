import GenreForm from "@/components/admin/GenreForm";

export default function NewGenrePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">سبک جدید</h1>
        <p className="text-muted-foreground">
          یک سبک (ژانر) جدید برای آهنگ ها و آلبوم ها بسازید!
        </p>
      </div>
      <GenreForm />
    </div>
  );
}
