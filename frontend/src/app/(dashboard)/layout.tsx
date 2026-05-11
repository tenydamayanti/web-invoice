"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BrandMark } from "@/components/layout/BrandMark";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { loading, logout, user } = useAuth();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileSidebarOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  if (loading || !user) {
    return (
      <div className="app-shell">
        <main className="page-frame flex min-h-[100dvh] items-center justify-center">
          <div className="app-panel w-full max-w-sm rounded-[32px] border border-white/80 px-8 py-10 text-center">
            <div className="flex justify-center">
              <BrandMark compact />
            </div>
            <div className="mt-6 space-y-3">
              <div className="mx-auto h-2 w-28 overflow-hidden rounded-full bg-slate-200/80">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-primary"></div>
              </div>
              <p className="text-sm font-medium text-[color:var(--muted)]">
                Memeriksa sesi dan menyiapkan workspace...
              </p>
            </div>
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
              : "lg:grid-cols-[clamp(240px,18vw,300px)_minmax(0,1fr)]",
          )}
        >
          <Sidebar
            collapsed={sidebarCollapsed}
            mobileOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
          />
          <section className="workspace-main desktop-main h-full min-h-[calc(100dvh-0.75rem)] lg:min-h-0">
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
            <footer className="mobile-safe-bottom px-4 pb-4 text-center text-sm text-[color:var(--muted)] sm:px-5 lg:px-6">
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
