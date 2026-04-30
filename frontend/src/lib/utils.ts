import { type ClassValue, clsx } from "clsx";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { twMerge } from "tailwind-merge";
import type { InvoiceStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

export function formatDate(date: string) {
  if (!date) {
    return "-";
  }

  return format(new Date(date), "dd MMMM yyyy", { locale: id });
}

export function getStatusColor(status: InvoiceStatus) {
  return {
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    sent: "bg-sky-100 text-sky-700 border-sky-200",
    paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
    overdue: "bg-amber-100 text-amber-700 border-amber-200",
    cancelled: "bg-slate-200 text-slate-700 border-slate-300",
  }[status];
}

export function getStatusLabel(status: InvoiceStatus) {
  return {
    draft: "Draft",
    sent: "Terbit",
    paid: "Lunas",
    overdue: "Jatuh Tempo",
    cancelled: "Dibatalkan",
  }[status];
}
