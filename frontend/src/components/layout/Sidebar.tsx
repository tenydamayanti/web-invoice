"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChevronDown,
  LayoutDashboard,
  ReceiptText,
  Search,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/layout/BrandMark";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const sections = [
  {
    id: "master",
    title: "Master Data",
    icon: Building2,
    items: [
      { href: "/sender-companies", label: "Perusahaan Pengirim", icon: Building2 },
      { href: "/vendors", label: "Vendor", icon: Users },
    ],
  },
  {
    id: "transaction",
    title: "Transaksi",
    icon: ReceiptText,
    items: [{ href: "/invoices", label: "Invoice", icon: ReceiptText }],
  },
] as const;

export function Sidebar({
  collapsed,
  mobileOpen,
  onClose,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    master: true,
    transaction: true,
  });

  useEffect(() => {
    setOpenSections((current) => {
      let changed = false;
      const next = { ...current };

      sections.forEach((section) => {
        const hasActiveItem = section.items.some(
          (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
        );

        if (hasActiveItem && !next[section.id]) {
          next[section.id] = true;
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [pathname]);

  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return sections;
    }

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.label.toLowerCase().includes(query)),
      }))
      .filter((section) => section.items.length > 0);
  }, [search]);

  const dashboardActive = pathname === "/";
  const usersActive = pathname === "/users" || pathname.startsWith("/users/");

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/45 transition lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "desktop-sidebar fixed left-2 top-[max(0.5rem,env(safe-area-inset-top))] z-50 w-[min(22rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] transition-transform duration-300 lg:static lg:inset-auto lg:z-auto lg:flex lg:w-auto lg:max-w-none",
          "mobile-drawer lg:h-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)] lg:translate-x-0",
        )}
      >
        <div className="sidebar-surface mobile-safe-bottom flex h-full min-h-0 flex-col p-3 sm:p-4 lg:flex-1">
          <div className={cn("rounded-[28px] border border-border bg-[color:var(--card-strong)] px-4 py-4 shadow-[0_18px_34px_rgba(15,23,42,0.08)]", collapsed ? "px-3" : "")}>
            <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
              <BrandMark className="justify-center" compact={collapsed} />
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-white/70 text-[color:var(--muted)] transition hover:text-foreground lg:hidden"
                onClick={onClose}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4">
            <Link
              className={cn(
                "flex items-center rounded-[24px] border px-4 py-4 transition",
                collapsed ? "justify-center px-3" : "gap-3",
                dashboardActive
                  ? "border-sky-300 bg-[linear-gradient(135deg,rgba(219,234,254,0.96),rgba(255,255,255,0.92))] text-primary shadow-[inset_0_0_0_1px_rgba(96,165,250,0.26)]"
                  : "border-border bg-[color:var(--card-strong)] text-foreground",
              )}
              href="/"
              onClick={onClose}
              title={collapsed ? "Dashboard" : undefined}
            >
              <span
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
                  dashboardActive
                    ? "border-sky-300 bg-primary text-white"
                    : "border-border bg-[color:var(--input)] text-[color:var(--muted)]",
                )}
              >
                <LayoutDashboard className="h-5 w-5" />
              </span>
              {!collapsed ? (
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                    Overview
                  </span>
                  <span className="mt-1 block truncate text-lg font-semibold">Dashboard</span>
                </span>
              ) : null}
            </Link>
          </div>

          {!collapsed ? (
            <div className="mt-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
                <Input
                  className="h-11 rounded-[18px] pl-10 shadow-none"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari menu..."
                  value={search}
                />
              </div>
            </div>
          ) : null}

          <div className="panel-scroll mt-4 flex-1 min-h-0 space-y-4 overflow-y-auto pr-1 overscroll-contain">
            {filteredSections.map((section) => {
              const sectionOpen = openSections[section.id];
              const sectionActive = section.items.some(
                (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
              );
              const SectionIcon = section.icon;

              return (
                <div className="sidebar-section overflow-hidden" key={section.id}>
                  <button
                    className={cn(
                      "flex w-full items-center border-b border-border transition",
                      collapsed ? "justify-center px-3 py-3" : "justify-between px-4 py-4",
                    )}
                    onClick={() =>
                      setOpenSections((current) => ({
                        ...current,
                        [section.id]: !current[section.id],
                      }))
                    }
                    type="button"
                  >
                    <span className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
                      <SectionIcon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          sectionActive ? "text-primary" : "text-[color:var(--muted)]",
                        )}
                      />
                      {!collapsed ? (
                        <span className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                          {section.title}
                        </span>
                      ) : null}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-[color:var(--muted)] transition",
                        sectionOpen ? "rotate-180" : "",
                      )}
                    />
                  </button>

                  {sectionOpen ? (
                    <div className={cn("space-y-1", collapsed ? "p-2" : "p-3")}>
                      {section.items.map((item) => {
                        const active =
                          pathname === item.href ||
                          pathname.startsWith(`${item.href}/`);
                        const ItemIcon = item.icon;

                        return (
                          <Link
                            className={cn(
                              "sidebar-item",
                              collapsed && "justify-center px-0",
                              active &&
                                "bg-[linear-gradient(135deg,rgba(219,234,254,0.95),rgba(255,255,255,0.78))] text-primary shadow-[inset_0_0_0_1px_rgba(96,165,250,0.3)]",
                            )}
                            href={item.href}
                            key={`${section.id}-${item.href}`}
                            onClick={onClose}
                            title={collapsed ? item.label : undefined}
                          >
                            <ItemIcon
                              className={cn(
                                "h-5 w-5 shrink-0",
                                active ? "text-primary" : "text-[color:var(--muted)]",
                              )}
                            />
                            {!collapsed ? <span>{item.label}</span> : null}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-4 shrink-0">
            <Link
              className={cn(
                "flex items-center rounded-[24px] border px-4 py-4 transition",
                collapsed ? "justify-center px-3" : "gap-3",
                usersActive
                  ? "border-sky-300 bg-[linear-gradient(135deg,rgba(219,234,254,0.96),rgba(255,255,255,0.92))] text-primary shadow-[inset_0_0_0_1px_rgba(96,165,250,0.26)]"
                  : "border-border bg-[color:var(--card-strong)] text-foreground",
              )}
              href="/users"
              onClick={onClose}
              title={collapsed ? "Manajemen User" : undefined}
            >
              <span
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
                  usersActive
                    ? "border-sky-300 bg-primary text-white"
                    : "border-border bg-[color:var(--input)] text-[color:var(--muted)]",
                )}
              >
                <UserCog className="h-5 w-5" />
              </span>
              {!collapsed ? (
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                    Administrasi
                  </span>
                  <span className="mt-1 block truncate text-lg font-semibold">Manajemen User</span>
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
