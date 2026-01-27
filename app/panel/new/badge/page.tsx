import BadgeForm from "@/components/admin/BadgeForm";

export default function NewBadgePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ساخت نشان جدید</h1>
        <p className="text-muted-foreground">ساخت نشان جدید برای کاربران</p>
      </div>
      <BadgeForm />
    </div>
  );
}
