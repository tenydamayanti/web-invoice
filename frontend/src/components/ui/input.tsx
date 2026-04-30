import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
        <input
          className={cn(
          "h-11 w-full rounded-2xl border border-border bg-[color:var(--input)] px-4 text-sm text-foreground outline-none transition placeholder:text-[color:var(--muted)] focus:border-teal-500 focus:ring-4 focus:ring-teal-100",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
