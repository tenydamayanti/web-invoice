"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Eraser, FileSpreadsheet, Search, WalletCards } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { getInvoiceDisplayNumber, getInvoiceDownloadFileName } from "@/lib/invoice-template";
import { useInvoices } from "@/hooks/useInvoices";
import type { Invoice, InvoiceStatus } from "@/types";

const statusTabs: Array<{ label: string; value: InvoiceStatus | "all" }> = [
  { label: "Semua", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Terbit", value: "sent" },
  { label: "Lunas", value: "paid" },
  { label: "Jatuh Tempo", value: "overdue" },
  { label: "Dibatalkan", value: "cancelled" },
];

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<InvoiceStatus | "all">(getStatusFromQuery(statusParam));
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { invoices, loading, pagination, refresh } = useInvoices({
    page,
    search,
    status,
    fromDate,
    toDate,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const nextStatus = getStatusFromQuery(statusParam);

    setStatus((currentStatus) => (currentStatus === nextStatus ? currentStatus : nextStatus));
    setPage(1);
  }, [statusParam]);

  async function handleDownload(invoice: Invoice) {
    try {
      const response = await api.get(`/invoices/${invoice.id}/pdf`, {
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = getInvoiceDownloadFileName(invoice);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Gagal mengunduh PDF invoice.");
    }
  }

  async function handleDelete(invoice: Invoice) {
    const confirmed = window.confirm(`Hapus invoice ${getInvoiceDisplayNumber(invoice)}?`);

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/invoices/${invoice.id}`);
      toast.success("Invoice berhasil dihapus.");
      void refresh();
    } catch {
      toast.error("Gagal menghapus invoice.");
    }
  }

  async function handleClearInvoices() {
    const confirmed = window.confirm(
      "Clear semua invoice? Nomor invoice akan kembali mulai dari 01 setelah data dibersihkan.",
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete("/invoices/clear");
      toast.success("Semua invoice berhasil dibersihkan.");
      setPage(1);
      void refresh();
    } catch {
      toast.error("Gagal membersihkan invoice.");
    }
  }

  async function handleExportExcel() {
    try {
      const response = await api.get("/invoices/export/excel", {
        params: {
          status: status === "all" ? undefined : status,
          search: search || undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
        },
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `invoice-detail-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Gagal export detail invoice ke Excel.");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="fade-up">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Invoice
            </p>
            <CardTitle className="mt-2">Daftar Invoice</CardTitle>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap lg:justify-end">
            <Button className="min-w-0 px-3 sm:w-auto sm:px-5" onClick={handleExportExcel} variant="outline">
              <FileSpreadsheet className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">Export</span>
            </Button>
            <Button className="min-w-0 px-3 sm:w-auto sm:px-5" onClick={handleClearInvoices} variant="danger">
              <Eraser className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">Clear</span>
            </Button>
            <Button asChild className="col-span-2 min-w-0 sm:col-span-1 sm:w-auto">
              <Link href="/invoices/create">Buat Invoice</Link>
            </Button>
          </div>
        </div>

        <div className="mt-5 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {statusTabs.map((tab) => (
            <button
              className={`shrink-0 snap-start rounded-full px-3 py-2 text-sm font-medium transition sm:px-4 ${
                status === tab.value
                  ? "bg-slate-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.16)]"
                  : "border border-white/80 bg-white/70 text-slate-600 hover:bg-white"
              }`}
              key={tab.value}
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
                router.replace(
                  tab.value === "all" ? "/invoices" : `/invoices?status=${tab.value}`,
                  { scroll: false },
                );
              }}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-5 min-w-0 max-w-full overflow-hidden rounded-[20px] border border-border bg-[color:var(--input)] p-3 sm:p-4">
          <div className="relative min-w-0 max-w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="border-white/80 bg-[color:var(--card-strong)] pl-10"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari nomor dokumen, nomor sistem, atau vendor"
              value={searchInput}
            />
          </div>

          <div className="mt-4 min-w-0 max-w-full overflow-hidden rounded-[18px] border border-dashed border-border bg-[color:var(--card-strong)] p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-primary">
                <CalendarDays className="h-4 w-4" />
              </span>
              <span>Filter tanggal</span>
            </div>

            <div className="mt-3 grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 xl:grid-cols-[160px_160px]">
              <label className="block w-full min-w-0 max-w-full space-y-1.5 overflow-hidden">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  Dari
                </span>
                <Input
                  className="date-input min-w-0 max-w-full border-white/80 bg-white/90 px-3"
                  onChange={(event) => {
                    setFromDate(event.target.value);
                    setPage(1);
                  }}
                  type="date"
                  value={fromDate}
                />
              </label>
              <label className="block w-full min-w-0 max-w-full space-y-1.5 overflow-hidden">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  Sampai
                </span>
                <Input
                  className="date-input min-w-0 max-w-full border-white/80 bg-white/90 px-3"
                  onChange={(event) => {
                    setToDate(event.target.value);
                    setPage(1);
                  }}
                  type="date"
                  value={toDate}
                />
              </label>
            </div>
          </div>
        </div>
      </Card>

      <Card className="fade-up">
        {loading ? null : invoices.length === 0 ? (
          <EmptyState icon={WalletCards} title="Tidak ada invoice" />
        ) : (
          <>
            <InvoiceTable
              invoices={invoices}
              loading={loading}
              onDelete={handleDelete}
              onDownload={handleDownload}
            />
            <Pagination
              currentPage={pagination?.current_page ?? 1}
              from={pagination?.from}
              lastPage={pagination?.last_page ?? 1}
              onPageChange={setPage}
              to={pagination?.to}
              total={pagination?.total}
            />
          </>
        )}
      </Card>
    </div>
  );
}

function getStatusFromQuery(value: string | null): InvoiceStatus | "all" {
  if (!value) {
    return "all";
  }

  return statusTabs.some((tab) => tab.value === value) ? (value as InvoiceStatus) : "all";
}
