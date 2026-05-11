"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Search } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { useManualInvoiceNumberLogs } from "@/hooks/useManualInvoiceNumberLogs";

export default function ManualInvoiceNumberLogsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { loading, logs, pagination } = useManualInvoiceNumberLogs({ page, search });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="space-y-6">
      <Card className="fade-up">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Logs
            </p>
            <CardTitle className="mt-2">Nomor Invoice Manual</CardTitle>
          </div>

          <div className="relative w-full min-w-0 sm:min-w-[320px] lg:w-auto">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
            <Input
              className="pl-10"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari user, perusahaan, atau nomor invoice"
              value={searchInput}
            />
          </div>
        </div>
      </Card>

      <Card className="fade-up">
        {loading ? null : logs.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Belum ada log nomor manual" />
        ) : (
          <>
            <div className="table-scroll">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Waktu</TableHeaderCell>
                    <TableHeaderCell>User</TableHeaderCell>
                    <TableHeaderCell>Perusahaan</TableHeaderCell>
                    <TableHeaderCell>Periode</TableHeaderCell>
                    <TableHeaderCell>Input Manual</TableHeaderCell>
                    <TableHeaderCell>Nomor Jadi</TableHeaderCell>
                    <TableHeaderCell>Invoice</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{formatDateTime(log.created_at)}</TableCell>
                      <TableCell>
                        <p className="font-semibold">{log.user?.name ?? "-"}</p>
                        <p className="mt-1 text-xs text-[color:var(--muted)]">{log.user?.email ?? "-"}</p>
                      </TableCell>
                      <TableCell>{log.sender_company?.company_name ?? "-"}</TableCell>
                      <TableCell>{formatPeriod(log.period_month, log.period_year)}</TableCell>
                      <TableCell>{log.manual_last_sequence}</TableCell>
                      <TableCell className="font-semibold">{log.generated_invoice_number}</TableCell>
                      <TableCell>
                        {log.invoice ? (
                          <Link className="font-semibold text-primary hover:underline" href={`/invoices/${log.invoice.id}`}>
                            Detail
                          </Link>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

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

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPeriod(month: number, year: number): string {
  return `${String(month).padStart(2, "0")}/${year}`;
}
