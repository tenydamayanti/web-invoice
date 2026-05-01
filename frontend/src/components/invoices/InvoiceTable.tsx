import Link from "next/link";
import { Download, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice } from "@/types";
import { StatusBadge } from "./StatusBadge";

export function InvoiceTable({
  invoices,
  loading,
  onDownload,
  onDelete,
}: {
  invoices: Invoice[];
  loading: boolean;
  onDownload: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
}) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton className="h-48 w-full rounded-[24px]" key={index} />
            ))
          : invoices.map((invoice) => (
              <div className="rounded-[24px] border border-border bg-[color:var(--card-strong)] p-4" key={invoice.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-base font-semibold text-teal-700 [overflow-wrap:anywhere]">
                      {getInvoiceDisplayNumber(invoice)}
                    </p>
                    <p className="mt-1 break-words text-sm text-[color:var(--muted)] [overflow-wrap:anywhere]">
                      {invoice.vendor?.company_name || "-"}
                    </p>
                  </div>
                  <StatusBadge status={invoice.status} />
                </div>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex flex-col gap-1.5">
                    <dt className="text-[color:var(--muted)]">Tgl Terbit</dt>
                    <dd className="break-words text-left [overflow-wrap:anywhere]">{formatDate(invoice.issue_date)}</dd>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <dt className="text-[color:var(--muted)]">Jatuh Tempo</dt>
                    <dd className="break-words text-left [overflow-wrap:anywhere]">{formatDate(invoice.due_date)}</dd>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <dt className="text-[color:var(--muted)]">Total</dt>
                    <dd className="break-words text-left font-semibold [overflow-wrap:anywhere]">
                      {formatCurrency(invoice.total)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button asChild className="h-10 rounded-xl px-3" variant="outline">
                    <Link href={`/invoices/${invoice.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Lihat
                    </Link>
                  </Button>
                  <Button className="h-10 rounded-xl px-3" onClick={() => onDownload(invoice)} variant="secondary">
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                  {invoice.status === "draft" ? (
                    <Button className="col-span-2 h-10 rounded-xl px-3" onClick={() => onDelete(invoice)} variant="danger">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus Draft
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
      </div>

      <div className="hidden md:block">
        <div className="table-scroll">
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>No. Invoice</TableHeaderCell>
                <TableHeaderCell>Vendor</TableHeaderCell>
                <TableHeaderCell>Tgl Terbit</TableHeaderCell>
                <TableHeaderCell>Jatuh Tempo</TableHeaderCell>
                <TableHeaderCell>Total</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-semibold text-teal-700">
                        {getInvoiceDisplayNumber(invoice)}
                      </TableCell>
                      <TableCell>{invoice.vendor?.company_name || "-"}</TableCell>
                      <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                      <TableCell>{formatDate(invoice.due_date)}</TableCell>
                      <TableCell>{formatCurrency(invoice.total)}</TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild className="h-9 rounded-xl px-3" variant="outline">
                            <Link href={`/invoices/${invoice.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Lihat
                            </Link>
                          </Button>
                          <Button
                            className="h-9 rounded-xl px-3"
                            onClick={() => onDownload(invoice)}
                            variant="secondary"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                          </Button>
                          {invoice.status === "draft" ? (
                            <Button
                              className="h-9 rounded-xl px-3"
                              onClick={() => onDelete(invoice)}
                              variant="danger"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
