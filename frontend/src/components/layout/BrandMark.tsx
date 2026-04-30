"use client";

import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#1d4ed8,#0f172a)] text-white shadow-[0_18px_32px_rgba(29,78,216,0.24)]">
        <FileText className="h-6 w-6" />
      </div>
      {!compact ? (
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Invoice
          </p>
          <p className="truncate text-base font-semibold text-foreground">Logo Sementara</p>
        </div>
      ) : null}
    </div>
  );
}
