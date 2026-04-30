import {
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
} from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: ButtonVariant;
}

export function Button({
  asChild = false,
  children,
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
    variant === "primary" &&
      "bg-primary text-primary-foreground shadow-[0_16px_30px_rgba(29,78,216,0.18)] hover:-translate-y-0.5 hover:bg-[#1e40af]",
    variant === "secondary" &&
      "border border-sky-100 bg-sky-50 text-primary shadow-[0_12px_24px_rgba(148,163,184,0.12)] hover:-translate-y-0.5 hover:bg-sky-100",
    variant === "outline" &&
      "border border-border bg-[color:var(--input)] text-foreground hover:bg-[color:var(--card-strong)]",
    variant === "ghost" && "text-foreground hover:bg-[color:var(--card-strong)]",
    variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700",
    className,
  );

  if (asChild && isValidElement(children)) {
    return cloneElement(children as ReactElement<{ className?: string }>, {
      className: cn(classes, children.props.className),
    });
  }

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  );
}
