"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import api from "@/lib/axios";
import { StatusBadge } from "@/components/invoices/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice, PaginatedResponse, Vendor } from "@/types";

export default function VendorDetailPage() {
  const params = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicePagination, setInvoicePagination] = useState<PaginatedResponse<Invoice> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const [vendorResponse, invoicesResponse] = await Promise.all([
          api.get<{ data: Vendor }>(`/vendors/${params.id}`),
          api.get<PaginatedResponse<Invoice>>("/invoices", {
            params: { vendor_id: params.id, page },
          }),
        ]);

        if (mounted) {
          setVendor(vendorResponse.data.data);
          setInvoices(invoicesResponse.data.data);
          setInvoicePagination(invoicesResponse.data);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void fetchData();

    return () => {
      mounted = false;
    };
  }, [page, params.id]);

  return (
    <div className="space-y-6">
      <Button asChild variant="outline">
        <Link href="/vendors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Vendor
        </Link>
      </Button>

      <Card className="fade-up">
        {loading || !vendor ? (
          <Skeleton className="h-52 w-full" />
        ) : (
          <>
            <CardTitle>{vendor.company_name}</CardTitle>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <InfoBox label="Nama PIC" value={vendor.name} />
              <InfoBox label="Email" value={vendor.email || "-"} />
              <InfoBox label="Telepon" value={vendor.phone} />
              <InfoBox label="NPWP" value={vendor.npwp || "-"} />
              <InfoBox label="Alamat" value={vendor.address || "-"} />
              <InfoBox label="Terdaftar" value={formatDate(vendor.created_at)} />
            </div>
          </>
        )}
      </Card>

      <Card className="fade-up">
        <CardTitle>Riwayat Invoice Vendor</CardTitle>

        <div className="mt-6">
          {loading ? null : invoices.length === 0 ? (
            <EmptyState icon={Building2} title="Belum ada invoice" />
          ) : (
            <>
              <div className="table-scroll">
                <Table>
                  <TableHead>
                    <tr>
                      <TableHeaderCell>Invoice</TableHeaderCell>
                      <TableHeaderCell>Tanggal</TableHeaderCell>
                      <TableHeaderCell>Total</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {invoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-semibold text-teal-700">
                              {invoice.invoice_number}
                            </TableCell>
                            <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                            <TableCell>{formatCurrency(invoice.total)}</TableCell>
                            <TableCell>
                              <StatusBadge status={invoice.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                currentPage={invoicePagination?.current_page ?? 1}
                from={invoicePagination?.from}
                lastPage={invoicePagination?.last_page ?? 1}
                onPageChange={setPage}
                to={invoicePagination?.to}
                total={invoicePagination?.total}
              />
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-border bg-[color:var(--input)] p-4">
      <p className="text-sm text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 font-semibold text-foreground">{value}</p>
    </div>
  );
}
