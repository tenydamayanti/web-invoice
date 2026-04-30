"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut,
  MoonStar,
  PanelLeft,
  SunMedium,
  UserCircle2,
} from "lucide-react";
import api from "@/lib/axios";
import { useTheme } from "@/components/providers/ThemeProvider";
import { StatusBadge } from "@/components/invoices/StatusBadge";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInvoiceDisplayNumber } from "@/lib/invoice-template";
import { getStatusLabel } from "@/lib/utils";
import type { DashboardStats, User } from "@/types";

export function Header({
  isSidebarCollapsed,
  onToggleSidebar,
  user,
  onLogout,
}: {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  user: User;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const pageMeta = getPageMeta(pathname);
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      try {
        const response = await api.get<DashboardStats>("/dashboard/stats");

        if (mounted) {
          setStats(response.data);
        }
      } catch {
        if (mounted) {
          setStats(null);
        }
      }
    }

    void fetchStats();
    const timer = window.setInterval(() => {
      void fetchStats();
    }, 60000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const notifications = useMemo(() => buildNotifications(stats), [stats]);
  const ThemeIcon = theme === "dark" ? SunMedium : MoonStar;

  return (
    <header className="topbar-surface fade-up px-4 py-4 sm:px-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <button
            aria-label={isSidebarCollapsed ? "Buka sidebar" : "Minimalkan sidebar"}
            className="toolbar-button"
            onClick={onToggleSidebar}
            type="button"
          >
            <PanelLeft className={`h-5 w-5 transition ${isSidebarCollapsed ? "scale-x-[-1]" : ""}`} />
          </button>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {pageMeta.section}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
              {pageMeta.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="toolbar-button relative" type="button">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 ? (
                  <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white">
                    {notifications.length}
                  </span>
                ) : null}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[360px] p-2">
              <div className="rounded-[18px] border border-border bg-[color:var(--card-strong)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Notifikasi Status</p>
                    <p className="text-xs text-[color:var(--muted)]">Menyesuaikan status invoice terbaru</p>
                  </div>
                  <Badge className="border-slate-200 bg-white/80 text-slate-700">
                    {notifications.length} aktif
                  </Badge>
                </div>

                <div className="mt-4 space-y-3">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        className="rounded-[18px] border border-border bg-[color:var(--input)] p-3"
                        key={notification.key}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground">
                            {notification.title}
                          </p>
                          {notification.status ? (
                            <StatusBadge status={notification.status} />
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-[color:var(--muted)]">
                          {notification.message}
                        </p>
                        {notification.invoiceNumber ? (
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                            {notification.invoiceNumber}
                          </p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-border bg-[color:var(--input)] p-3 text-sm text-[color:var(--muted)]">
                      Belum ada notifikasi status.
                    </div>
                  )}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <button className="toolbar-button" onClick={toggleTheme} type="button">
            <ThemeIcon className="h-5 w-5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="group flex items-center gap-3 rounded-[24px] border border-border bg-[color:var(--card-strong)] px-3 py-3 text-left shadow-[0_14px_30px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 sm:px-4">
                <div className="hidden min-w-0 text-right sm:block">
                  <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs text-[color:var(--muted)]">Online</p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-sky-500 bg-[color:var(--card-strong)] text-primary">
                  <UserCircle2 className="h-6 w-6" />
                </span>
                <ChevronDown className="hidden h-4 w-4 text-[color:var(--muted)] transition group-hover:text-foreground sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function getPageMeta(pathname: string) {
  if (pathname === "/") {
    return {
      section: "Ringkasan",
      title: "Dashboard Invoice",
    };
  }

  if (pathname.startsWith("/vendors/")) {
    return {
      section: "Vendor",
      title: "Detail Vendor",
    };
  }

  if (pathname.startsWith("/vendors")) {
    return {
      section: "Vendor",
      title: "Daftar Vendor",
    };
  }

  if (pathname.startsWith("/sender-companies")) {
    return {
      section: "Master",
      title: "Perusahaan Pengirim",
    };
  }

  if (pathname.startsWith("/users")) {
    return {
      section: "Administrasi",
      title: "Manajemen User",
    };
  }

  if (pathname === "/invoices/create") {
    return {
      section: "Invoice",
      title: "Buat Invoice",
    };
  }

  if (pathname.endsWith("/edit")) {
    return {
      section: "Invoice",
      title: "Edit Invoice",
    };
  }

  if (pathname.startsWith("/invoices/")) {
    return {
      section: "Invoice",
      title: "Detail Invoice",
    };
  }

  if (pathname.startsWith("/invoices")) {
    return {
      section: "Invoice",
      title: "Daftar Invoice",
    };
  }

  return {
    section: "Ruang Kerja",
    title: "Panel Invoice",
  };
}

function buildNotifications(stats: DashboardStats | null) {
  if (!stats) {
    return [];
  }

  const notifications: Array<{
    key: string;
    title: string;
    message: string;
    status?: DashboardStats["recent_invoices"][number]["status"];
    invoiceNumber?: string;
  }> = [];

  if (stats.counts.overdue > 0) {
    notifications.push({
      key: "overdue-summary",
      title: "Perlu ditindaklanjuti",
      message: `${stats.counts.overdue} invoice sudah melewati jatuh tempo.`,
      status: "overdue",
    });
  }

  if (stats.counts.sent > 0) {
    notifications.push({
      key: "sent-summary",
      title: "Menunggu pembayaran",
      message: `${stats.counts.sent} invoice masih berstatus terbit.`,
      status: "sent",
    });
  }

  if (stats.counts.draft > 0) {
    notifications.push({
      key: "draft-summary",
      title: "Draft siap dicek",
      message: `${stats.counts.draft} draft belum diterbitkan.`,
      status: "draft",
    });
  }

  stats.recent_invoices
    .filter((invoice) => invoice.status !== "cancelled")
    .slice(0, 2)
    .forEach((invoice) => {
      notifications.push({
        key: `invoice-${invoice.id}`,
        title: invoice.vendor?.company_name || "Invoice terbaru",
        message: `Status saat ini: ${getStatusLabel(invoice.status)}.`,
        status: invoice.status,
        invoiceNumber: getInvoiceDisplayNumber(invoice),
      });
    });

  return notifications.slice(0, 5);
}
