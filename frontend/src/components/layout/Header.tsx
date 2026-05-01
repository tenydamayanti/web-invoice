"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

const DISMISSED_NOTIFICATIONS_KEY = "web-invoice-dismissed-notifications";

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
  const dismissedNotificationsStorageKey = `${DISMISSED_NOTIFICATIONS_KEY}:${user.id}`;
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>(() =>
    readDismissedNotifications(dismissedNotificationsStorageKey),
  );

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
  const visibleNotifications = useMemo(
    () => notifications.filter((notification) => !dismissedNotifications.includes(notification.key)),
    [dismissedNotifications, notifications],
  );
  const ThemeIcon = theme === "dark" ? SunMedium : MoonStar;

  useEffect(() => {
    setDismissedNotifications(readDismissedNotifications(dismissedNotificationsStorageKey));
  }, [dismissedNotificationsStorageKey]);

  useEffect(() => {
    writeDismissedNotifications(dismissedNotificationsStorageKey, dismissedNotifications);
  }, [dismissedNotifications, dismissedNotificationsStorageKey]);

  useEffect(() => {
    setDismissedNotifications((currentValue) => {
      if (currentValue.length === 0) {
        return currentValue;
      }

      const activeKeys = new Set(notifications.map((notification) => notification.key));
      const nextValue = currentValue.filter((value) => activeKeys.has(value));

      return nextValue;
    });
  }, [dismissedNotificationsStorageKey, notifications]);

  function handleNotificationClick(key: string) {
    setDismissedNotifications((currentValue) => {
      if (currentValue.includes(key)) {
        return currentValue;
      }

      const nextValue = [...currentValue, key];
      writeDismissedNotifications(dismissedNotificationsStorageKey, nextValue);

      return nextValue;
    });
  }

  return (
    <header className="topbar-surface px-3 py-3 sm:px-5 sm:py-4">
      <div className="flex items-start justify-between gap-3 sm:items-center sm:gap-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
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
            <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-700 dark:text-slate-200 sm:truncate">
              {pageMeta.title}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="toolbar-button relative" type="button">
                <Bell className="h-5 w-5" />
                {visibleNotifications.length > 0 ? (
                  <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white">
                    {visibleNotifications.length}
                  </span>
                ) : null}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[min(22rem,calc(100vw-1.5rem))] p-2 sm:w-[360px]">
              <div className="rounded-[18px] border border-border bg-[color:var(--card-strong)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Notifikasi Status</p>
                    <p className="text-xs text-[color:var(--muted)]">Menyesuaikan status invoice terbaru</p>
                  </div>
                  <Badge className="border-slate-200 bg-white/80 text-slate-700">
                    {visibleNotifications.length} aktif
                  </Badge>
                </div>

                <div className="mt-4 space-y-3">
                  {visibleNotifications.length > 0 ? (
                    visibleNotifications.map((notification) => (
                      <Link
                        className="block rounded-[18px] border border-border bg-[color:var(--input)] p-3 transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white"
                        href={notification.href}
                        key={notification.key}
                        onMouseDown={() => handleNotificationClick(notification.key)}
                        onClick={() => handleNotificationClick(notification.key)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="min-w-0 text-sm font-semibold text-foreground">
                            {notification.title}
                          </p>
                          {notification.status ? (
                            <StatusBadge status={notification.status} />
                          ) : null}
                        </div>
                        <p className="mt-1 break-words text-sm text-[color:var(--muted)] [overflow-wrap:anywhere]">
                          {notification.message}
                        </p>
                        {notification.invoiceNumber ? (
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                            {notification.invoiceNumber}
                          </p>
                        ) : null}
                      </Link>
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
              <button className="group flex items-center gap-2 rounded-[22px] border border-border bg-[color:var(--card-strong)] px-2.5 py-2.5 text-left shadow-[0_14px_30px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 sm:gap-3 sm:px-4 sm:py-3">
                <div className="hidden min-w-0 text-right sm:block">
                  <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs text-[color:var(--muted)]">Online</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-sky-500 bg-[color:var(--card-strong)] text-primary sm:h-12 sm:w-12">
                  <UserCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
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

function readDismissedNotifications(storageKey: string) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey);

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);

    return Array.isArray(parsedValue)
      ? parsedValue.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    window.localStorage.removeItem(storageKey);
    return [];
  }
}

function writeDismissedNotifications(storageKey: string, notifications: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(notifications));
  } catch {
    // Ignore storage write failures so the notification UI still works in-memory.
  }
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
    href: string;
    status?: DashboardStats["recent_invoices"][number]["status"];
    invoiceNumber?: string;
  }> = [];

  if (stats.counts.overdue > 0) {
    notifications.push({
      key: "overdue-summary",
      title: "Perlu ditindaklanjuti",
      message: `${stats.counts.overdue} invoice sudah melewati jatuh tempo.`,
      href: "/invoices?status=overdue",
      status: "overdue",
    });
  }

  if (stats.counts.sent > 0) {
    notifications.push({
      key: "sent-summary",
      title: "Menunggu pembayaran",
      message: `${stats.counts.sent} invoice masih berstatus terbit.`,
      href: "/invoices?status=sent",
      status: "sent",
    });
  }

  if (stats.counts.draft > 0) {
    notifications.push({
      key: "draft-summary",
      title: "Draft siap dicek",
      message: `${stats.counts.draft} draft belum diterbitkan.`,
      href: "/invoices?status=draft",
      status: "draft",
    });
  }

  stats.recent_invoices
    .filter((invoice) => invoice.status !== "cancelled")
    .slice(0, 2)
    .forEach((invoice) => {
      notifications.push({
        key: `invoice-${invoice.id}-${invoice.status}`,
        title: invoice.vendor?.company_name || "Invoice terbaru",
        message: `Status saat ini: ${getStatusLabel(invoice.status)}.`,
        href: `/invoices/${invoice.id}`,
        status: invoice.status,
        invoiceNumber: getInvoiceDisplayNumber(invoice),
      });
    });

  return notifications.slice(0, 5);
}
