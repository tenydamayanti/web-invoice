import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <Card className="empty-illustration flex min-h-[190px] flex-col justify-center border-dashed px-6 py-14 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-sm">
        <Icon className="h-8 w-8 text-teal-700" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{description}</p>
      ) : null}
    </Card>
  );
}
