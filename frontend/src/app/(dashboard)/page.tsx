"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Ban,
  CalendarClock,
  CircleDollarSign,
  FileCheck2,
  FileText,
} from "lucide-react";
import api from "@/lib/axios";
import { Card, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { getInvoiceDisplayNumber } from "@/lib/invoice-template";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DashboardStats } from "@/types";
import { StatusBadge } from "@/components/invoices/StatusBadge";

const statCards = [
  {
    key: "total_invoice",
    title: "Total Invoice",
    icon: FileText,
    accentClass: "border-l-[#f0b323]",
    iconClass: "bg-[#fff3cf] text-[#d49b00]",
  },
  {
    key: "paid",
    title: "Lunas",
    icon: FileCheck2,
    accentClass: "border-l-[#4ade80]",
    iconClass: "bg-[#dcfce7] text-[#16a34a]",
  },
  {
    key: "sent",
    title: "Menunggu Pembayaran",
    icon: CircleDollarSign,
    accentClass: "border-l-[#38bdf8]",
    iconClass: "bg-[#e0f2fe] text-[#0284c7]",
  },
  {
    key: "overdue",
    title: "Jatuh Tempo",
    icon: CalendarClock,
    accentClass: "border-l-[#ef4444]",
    iconClass: "bg-[#fee2e2] text-[#dc2626]",
  },
  {
    key: "cancelled",
    title: "Dibatalkan",
    icon: Ban,
    accentClass: "border-l-[#64748b]",
    iconClass: "bg-slate-200 text-slate-700",
  },
] as const;

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      try {
        const response = await api.get<DashboardStats>("/dashboard/stats");

        if (mounted) {
          setStats(response.data);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void fetchStats();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card className="page-hero fade-up overflow-hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
              Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">Monitoring Invoice</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[#e9f1ff] px-4 py-2 text-sm font-semibold text-primary">
              Draft {stats?.counts.draft ?? 0}
            </span>
            <span className="rounded-full bg-[#e0f2fe] px-4 py-2 text-sm font-semibold text-sky-700">
              Terbit {stats?.counts.sent ?? 0}
            </span>
            <span className="rounded-full bg-[#fef3c7] px-4 py-2 text-sm font-semibold text-amber-700">
              Jatuh Tempo {stats?.counts.overdue ?? 0}
            </span>
            <span className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              Dibatalkan {stats?.counts.cancelled ?? 0}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value =
            card.key === "total_invoice"
              ? stats?.total_invoice ?? 0
              : stats?.counts[card.key] ?? 0;

          return (
            <Card className={cn("fade-up border-l-[5px]", card.accentClass)} key={card.key}>
              {loading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                        {card.key === "total_invoice" ? "Ringkasan" : "Status"}
                      </p>
                      <p className="mt-4 text-sm text-[color:var(--muted)]">{card.title}</p>
                    </div>
                    <div className={cn("rounded-full p-4", card.iconClass)}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-8 text-3xl font-semibold text-foreground">{value}</p>
                </>
              )}
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="fade-up">
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <CardTitle>Pendapatan Bulan Ini</CardTitle>
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  Cash In
                </span>
              </div>
              <div className="mt-6 rounded-[24px] border border-emerald-100/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.96),rgba(255,255,255,0.94))] p-5">
                <p className="max-w-full overflow-hidden text-[clamp(1.4rem,2.2vw,2.35rem)] font-semibold leading-snug tracking-[-0.02em] text-teal-700 [overflow-wrap:anywhere]">
                  {formatCurrency(stats?.paid_this_month ?? 0)}
                </p>
              </div>
              <p className="mt-4 text-sm text-[color:var(--muted)]">
                Total lunas: {formatCurrency(stats?.paid_total ?? 0)}
              </p>
              <div className="mt-8 rounded-[24px] border border-border bg-[color:var(--input)] p-4">
                <p className="text-sm text-[color:var(--muted)]">Jatuh tempo bulan ini</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {stats?.due_this_month ?? 0}
                </p>
              </div>
            </>
          )}
        </Card>

        <Card className="fade-up">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>5 Invoice Terbaru</CardTitle>
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700"
              href="/invoices"
            >
              Lihat semua
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 table-scroll">
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>No. Invoice</TableHeaderCell>
                  <TableHeaderCell>Vendor</TableHeaderCell>
                  <TableHeaderCell>Total</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Tanggal</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={5}>
                          <Skeleton className="h-12 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  : stats?.recent_invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-semibold text-teal-700">
                          {getInvoiceDisplayNumber(invoice)}
                        </TableCell>
                        <TableCell>{invoice.vendor?.company_name || "-"}</TableCell>
                        <TableCell>{formatCurrency(invoice.total)}</TableCell>
                        <TableCell>
                          <StatusBadge status={invoice.status} />
                        </TableCell>
                        <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
          {!loading ? (
            <Pagination
              currentPage={1}
              from={stats?.recent_invoices.length ? 1 : 0}
              lastPage={1}
              onPageChange={() => {}}
              to={stats?.recent_invoices.length ?? 0}
              total={stats?.recent_invoices.length ?? 0}
            />
          ) : null}
        </Card>
      </div>
    </div>
  );
}
