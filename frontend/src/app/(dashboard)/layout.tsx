"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { loading, logout, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (loading || !user) {
    return (
      <div className="app-shell">
        <main className="page-frame">
          <div className="desktop-window lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="desktop-sidebar hidden lg:block">
              <div className="sidebar-surface p-6">
                <Skeleton className="h-[720px] w-full rounded-[32px]" />
              </div>
            </aside>
            <section className="workspace-main desktop-main min-w-0">
              <div className="topbar-surface p-4 sm:p-5">
                <Skeleton className="h-16 w-full rounded-[24px]" />
              </div>
              <div className="content-stage space-y-6">
                <Card>
                  <Skeleton className="h-32 w-full" />
                </Card>
                <Card>
                  <Skeleton className="h-[480px] w-full" />
                </Card>
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <main className="page-frame">
        <div
          className={cn(
            "desktop-window",
            sidebarCollapsed
              ? "lg:grid-cols-[96px_minmax(0,1fr)]"
              : "lg:grid-cols-[300px_minmax(0,1fr)]",
          )}
        >
          <Sidebar
            collapsed={sidebarCollapsed}
            mobileOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
          />
          <section className="workspace-main desktop-main h-full">
            <Header
              isSidebarCollapsed={sidebarCollapsed}
              onLogout={logout}
              onToggleSidebar={() => {
                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                  setMobileSidebarOpen((value) => !value);
                  return;
                }

                setSidebarCollapsed((value) => !value);
              }}
              user={user}
            />
            <div className="content-stage">{children}</div>
            <footer className="px-4 pb-5 text-center text-sm text-[color:var(--muted)] sm:px-5 lg:px-6">
              <div className="border-t border-border pt-4">
                © 2026 PT Digital Solusi Handal. All rights reserved.
              </div>
            </footer>
          </section>
        </div>
      </main>
    </div>
  );
}
