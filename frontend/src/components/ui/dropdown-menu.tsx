"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DropdownMenu({
  children,
}: {
  children: ReactNode;
}) {
  return <DropdownMenuPrimitive.Root>{children}</DropdownMenuPrimitive.Root>;
}

export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({
  className,
  sideOffset = 8,
  children,
}: {
  className?: string;
  sideOffset?: number;
  children: ReactNode;
}) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align="end"
        className={cn(
          "app-panel z-50 min-w-[180px] rounded-2xl border border-white/70 p-1 shadow-xl",
          className,
        )}
        sideOffset={sideOffset}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "flex cursor-pointer items-center rounded-xl px-3 py-2 text-sm text-foreground outline-none transition hover:bg-[color:var(--card-strong)] focus:bg-[color:var(--card-strong)]",
        className,
      )}
      {...props}
    />
  );
}
