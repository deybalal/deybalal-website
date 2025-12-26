import BadgeForm from "@/components/admin/BadgeForm";

export default function NewBadgePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Badge</h1>
        <p className="text-muted-foreground">Add a new badge to the system.</p>
      </div>
      <BadgeForm />
    </div>
  );
}
