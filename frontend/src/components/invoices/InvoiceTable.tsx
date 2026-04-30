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
  );
}
