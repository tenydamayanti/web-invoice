"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eraser, Search, WalletCards } from "lucide-react";
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
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<InvoiceStatus | "all">("all");
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

  return (
    <div className="space-y-6">
      <Card className="fade-up">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <CardTitle>Daftar Invoice</CardTitle>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleClearInvoices} variant="danger">
              <Eraser className="mr-2 h-4 w-4" />
              Clear Invoice
            </Button>
            <Button asChild>
              <Link href="/invoices/create">Buat Invoice</Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <button
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                status === tab.value
                  ? "bg-slate-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.16)]"
                  : "border border-white/80 bg-white/70 text-slate-600 hover:bg-white"
              }`}
              key={tab.value}
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-10"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari nomor dokumen, nomor sistem, atau vendor"
              value={searchInput}
            />
          </div>
          <Input
            onChange={(event) => {
              setFromDate(event.target.value);
              setPage(1);
            }}
            type="date"
            value={fromDate}
          />
          <Input
            onChange={(event) => {
              setToDate(event.target.value);
              setPage(1);
            }}
            type="date"
            value={toDate}
          />
        </div>
      </Card>

      <Card className="fade-up">
        {!loading && invoices.length === 0 ? (
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
