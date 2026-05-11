"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  Download,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { getInvoiceDisplayNumber } from "@/lib/invoice-template";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, getStatusLabel } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/types";
import { StatusBadge } from "./StatusBadge";

export function InvoiceDetail({
  availableTransitions,
  invoice,
  onDelete,
  onDownload,
  onPreview,
  onStatusChange,
  statusUpdating,
}: {
  availableTransitions: InvoiceStatus[];
  invoice: Invoice;
  onDelete: () => void;
  onDownload: () => void;
  onPreview: () => void;
  onStatusChange: (status: InvoiceStatus) => void;
  statusUpdating: boolean;
}) {
  const [nextStatus, setNextStatus] = useState<InvoiceStatus | "">("");
  const manualTransitions = availableTransitions.filter((status) => status !== "overdue");
  const documentNumber = getInvoiceDisplayNumber(invoice);
  const recipientCompany =
    invoice.template_data?.recipient_company_name || invoice.vendor.company_name;
  const recipientAddress = invoice.template_data?.recipient_address || invoice.vendor.address || "-";
  const recipientNpwp = invoice.template_data?.recipient_npwp || invoice.vendor.npwp || "-";
  const deductionLabel = invoice.template_data?.deduction_label || "Potongan";
  const senderCompany =
    invoice.sender_company?.company_name || invoice.template_data?.issuer_company_name || "-";
  const senderAddress = invoice.template_data?.issuer_address || invoice.sender_company?.address || "-";
  const signatureDate = formatDate(invoice.template_data?.signature_date || invoice.issue_date);

  return (
    <div className="space-y-6">
      <Card className="page-hero fade-up overflow-hidden">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild className="px-4" variant="ghost">
            <Link href="/invoices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Daftar Invoice
            </Link>
          </Button>
          <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            Detail Invoice
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-6 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-2xl font-semibold text-foreground [overflow-wrap:anywhere] sm:text-3xl">
              {documentNumber}
            </h1>
            {documentNumber !== invoice.invoice_number ? (
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                No. sistem: {invoice.invoice_number}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <StatusBadge status={invoice.status} />
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-[color:var(--input)] px-3 py-2 text-sm text-[color:var(--muted)]">
                <CalendarClock className="h-4 w-4" />
                Terbit {formatDate(invoice.issue_date)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-[color:var(--input)] px-3 py-2 text-sm text-[color:var(--muted)]">
                <CalendarClock className="h-4 w-4" />
                Jatuh tempo {formatDate(invoice.due_date)}
              </span>
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-3 2xl:w-auto 2xl:items-end">
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:flex 2xl:w-auto 2xl:flex-wrap 2xl:justify-end">
              <Button className="w-full 2xl:w-auto" onClick={onPreview} variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                Preview PDF
              </Button>
              <Button className="w-full 2xl:w-auto" onClick={onDownload} variant="secondary">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              {invoice.status === "draft" || invoice.status === "sent" || invoice.status === "overdue" ? (
                <Button asChild className="w-full 2xl:w-auto" variant="outline">
                  <Link href={`/invoices/${invoice.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    {invoice.status === "draft" ? "Edit" : "Revisi"}
                  </Link>
                </Button>
              ) : null}
              {invoice.status === "draft" ? (
                <Button className="w-full 2xl:w-auto" onClick={onDelete} variant="danger">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </Button>
              ) : null}
            </div>

            {manualTransitions.length > 0 ? (
              <div className="w-full rounded-[24px] border border-border bg-[color:var(--input)] p-4 2xl:w-[340px]">
                <p className="text-sm font-semibold text-foreground">Ubah Status</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row 2xl:flex-col">
                  <Select
                    onChange={(event) => setNextStatus(event.target.value as InvoiceStatus)}
                    value={nextStatus}
                  >
                    <option value="">Pilih status berikutnya</option>
                    {manualTransitions.map((status) => (
                      <option key={status} value={status}>
                        {getStatusLabel(status)}
                      </option>
                    ))}
                  </Select>
                  <Button
                    disabled={!nextStatus || statusUpdating}
                    onClick={() => nextStatus && onStatusChange(nextStatus)}
                  >
                    {statusUpdating ? "Memperbarui..." : "Simpan Status"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,360px)]">
        <div className="space-y-6">
          <Card className="fade-up">
            <CardTitle>Pengirim dan Penerima</CardTitle>

            <div className="mt-6 grid gap-5 min-[1180px]:grid-cols-2">
              <InfoPanel
                address={senderAddress}
                details={[
                  { label: "Bank", value: invoice.template_data?.payment_bank_name || "-" },
                  {
                    label: "No. Rekening",
                    value: invoice.template_data?.payment_account_number || "-",
                  },
                  {
                    label: "Pemilik Rekening",
                    value: invoice.template_data?.payment_account_holder || "-",
                  },
                ]}
                eyebrow="Pengirim"
                title={senderCompany}
              />

              <InfoPanel
                address={recipientAddress}
                details={[
                  { label: "PIC", value: invoice.vendor.name || "-" },
                  { label: "Email", value: invoice.vendor.email || "-" },
                  { label: "Telepon", value: invoice.vendor.phone || "-" },
                  { label: "NPWP", value: recipientNpwp },
                ]}
                eyebrow="Tagihan Kepada"
                title={recipientCompany}
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 min-[1180px]:grid-cols-4">
              <MetricCard
                label="No. Invoice"
                value={documentNumber}
              />
              <MetricCard
                label="No. Sistem"
                value={invoice.invoice_number}
              />
              <MetricCard
                label="No. Kontrak"
                value={invoice.template_data?.contract_number || "-"}
              />
              <MetricCard
                label="Penandatangan"
                value={invoice.template_data?.signature_name || "-"}
              />
            </div>

            {invoice.template_data?.contract_number || invoice.notes ? (
              <div className="mt-6 rounded-[24px] border border-border bg-[color:var(--input)] p-5">
                <p className="text-sm font-semibold text-foreground">No. Kontrak</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  {invoice.template_data?.contract_number || invoice.notes}
                </p>
              </div>
            ) : null}
          </Card>

          <Card className="fade-up">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Item Invoice</CardTitle>
              <span className="text-sm text-[color:var(--muted)]">
                {invoice.items.length} item
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {invoice.items.map((item, index) => (
                <div
                  className="min-w-0 rounded-[24px] border border-border bg-[color:var(--input)] p-4"
                  key={item.id}
                >
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_70px_minmax(130px,0.45fr)_minmax(150px,0.5fr)] md:items-start xl:grid-cols-[minmax(0,1fr)_90px_150px_170px]">
                    <InvoiceField
                      label={`Item ${index + 1}`}
                      value={
                        <div>
                          <p className="font-semibold text-foreground">{item.description}</p>
                        </div>
                      }
                    />
                    <InvoiceField label="Qty" value={<span>{item.quantity}</span>} />
                    <InvoiceField
                      label="Harga Satuan"
                      value={<span>{formatCurrency(item.unit_price)}</span>}
                    />
                    <InvoiceField
                      label="Total"
                      value={
                        <span className="text-base font-semibold text-teal-700">
                          {formatCurrency(item.total)}
                        </span>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="fade-up">
            <CardTitle>Ringkasan Pembayaran</CardTitle>

            <div className="mt-6 rounded-[24px] border border-emerald-100 bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(255,255,255,0.96))] p-5">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                Grand Total
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-teal-700">
                {formatCurrency(invoice.total)}
              </p>
            </div>

            <div className="mt-6 space-y-4 text-sm text-[color:var(--muted)]">
              <DetailRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />
              <DetailRow
                label={`PPN ${invoice.tax_percent}%`}
                value={formatCurrency(invoice.tax_amount)}
              />
              <DetailRow
                label={deductionLabel}
                value={`- ${formatCurrency(invoice.deduction_amount)}`}
              />
              <Separator />
              <DetailRow label="Status" value={getStatusLabel(invoice.status)} />
            </div>
          </Card>

          <Card className="fade-up">
            <CardTitle>Pembayaran dan Tanda Tangan</CardTitle>

            <div className="mt-6 space-y-5">
              <div className="rounded-[24px] border border-border bg-[color:var(--input)] p-5">
                <p className="text-sm font-semibold text-foreground">Instruksi Pembayaran</p>
                <div className="mt-4 space-y-3 text-sm text-[color:var(--muted)]">
                  <DetailRow label="Nama Bank" value={invoice.template_data?.payment_bank_name || "-"} />
                  <DetailRow
                    label="No. Rekening"
                    value={invoice.template_data?.payment_account_number || "-"}
                  />
                  <DetailRow
                    label="Nama Pemilik"
                    value={invoice.template_data?.payment_account_holder || "-"}
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-border bg-[color:var(--input)] p-5">
                <p className="text-sm font-semibold text-foreground">Penandatangan</p>
                <div className="mt-4 space-y-3 text-sm text-[color:var(--muted)]">
                  <DetailRow label="Kota" value={invoice.template_data?.signature_city || "-"} />
                  <DetailRow label="Tanggal" value={signatureDate} />
                  <DetailRow label="Jabatan" value={invoice.template_data?.signature_role || "-"} />
                  <DetailRow label="Nama" value={invoice.template_data?.signature_name || "-"} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoPanel({
  eyebrow,
  title,
  address,
  details,
}: {
  eyebrow: string;
  title: string;
  address: string;
  details: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[28px] border border-border bg-[color:var(--input)] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
        {eyebrow}
      </p>
      <h3 className="mt-3 break-words text-lg font-semibold text-foreground [overflow-wrap:anywhere]">
        {title}
      </h3>
      <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-[color:var(--muted)] [overflow-wrap:anywhere]">
        {address}
      </p>

      <div className="mt-5 space-y-3 border-t border-border pt-4">
        {details.map((detail) => (
          <DetailRow key={`${eyebrow}-${detail.label}`} label={detail.label} value={detail.value} />
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[24px] border border-border bg-[color:var(--input)] p-4">
      <p className="break-words text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)] [overflow-wrap:anywhere]">
        {label}
      </p>
      <p className="mt-3 break-words text-sm font-semibold leading-6 text-foreground [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="min-w-0 shrink-0 break-words text-[color:var(--muted)] [overflow-wrap:anywhere]">{label}</span>
      <span className="min-w-0 break-words text-left font-medium text-foreground [overflow-wrap:anywhere] sm:max-w-[58%] sm:text-right xl:max-w-[62%]">
        {value}
      </span>
    </div>
  );
}

function InvoiceField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="break-words text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)] [overflow-wrap:anywhere]">
        {label}
      </p>
      <div className="mt-2 break-words text-sm text-foreground [overflow-wrap:anywhere]">{value}</div>
    </div>
  );
}
