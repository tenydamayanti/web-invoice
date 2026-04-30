import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => {
    return (
      <select
        className={cn(
          "h-11 w-full rounded-2xl border border-border bg-[color:var(--input)] px-4 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Select.displayName = "Select";
