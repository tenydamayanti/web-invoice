"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import {
  createInvoiceTemplateDefaults,
  generateDocumentNumber,
  getInvoiceDisplayNumber,
  hydrateInvoiceTemplate,
  mapSenderCompanyToTemplate,
  mapVendorToTemplate,
} from "@/lib/invoice-template";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { Invoice, InvoiceTemplateData, SenderCompany, Vendor } from "@/types";

const itemSchema = z.object({
  description: z.string().min(1, "Deskripsi wajib diisi"),
  quantity: z.coerce.number().gt(0, "Qty harus lebih dari 0"),
  unit_price: z.coerce.number().gt(0, "Harga satuan harus lebih dari 0"),
});

const templateSchema = z.object({
  issuer_company_name: z.string().min(1, "Nama perusahaan wajib diisi"),
  issuer_address: z.string().min(1, "Alamat perusahaan wajib diisi"),
  recipient_company_name: z.string().min(1, "Nama penerima wajib diisi"),
  recipient_address: z.string(),
  recipient_npwp: z.string(),
  document_number: z.string(),
  contract_number: z.string(),
  payment_bank_name: z.string().min(1, "Nama bank wajib diisi"),
  payment_account_number: z.string().min(1, "Nomor rekening wajib diisi"),
  payment_account_holder: z.string().min(1, "Nama pemilik rekening wajib diisi"),
  signature_city: z.string().min(1, "Kota tanda tangan wajib diisi"),
  signature_date: z.string().min(1, "Tanggal tanda tangan wajib diisi"),
  signature_role: z.string().min(1),
  signature_name: z.string().min(1),
  tax_percent: z.coerce.number().min(0),
  deduction_label: z.string().min(1),
  deduction_percent: z.coerce.number().min(0),
});

const invoiceSchema = z
  .object({
    sender_company_id: z.number().min(1, "Perusahaan pengirim wajib dipilih"),
    vendor_id: z.number().min(1, "Vendor wajib dipilih"),
    issue_date: z.string().min(1, "Tanggal invoice wajib diisi"),
    due_date: z.string().min(1, "Tanggal jatuh tempo wajib diisi"),
    notes: z.string().optional(),
    manual_last_sequence: z.coerce.number().int().min(0, "Nomor terakhir tidak boleh negatif").optional(),
    template_data: templateSchema,
    items: z.array(itemSchema).min(1, "Minimal satu item invoice"),
  })
  .refine((value) => new Date(value.due_date) >= new Date(value.issue_date), {
    message: "Tanggal jatuh tempo tidak boleh sebelum tanggal invoice",
    path: ["due_date"],
  });

type InvoiceFormInput = z.input<typeof invoiceSchema>;
type InvoiceFormOutput = z.output<typeof invoiceSchema>;

export function InvoiceForm({
  initialData,
  mode,
}: {
  initialData?: Invoice;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const initialIssueDate = initialData?.issue_date ?? formatDateInput(0);
  const initialTemplate =
    initialData ? hydrateInvoiceTemplate(initialData) : createInvoiceTemplateDefaults(initialIssueDate);
  const [submitting, setSubmitting] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(initialData?.vendor ?? null);
  const [selectedSenderCompany, setSelectedSenderCompany] = useState<SenderCompany | null>(
    initialData?.sender_company ?? null,
  );
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorResults, setVendorResults] = useState<Vendor[]>([]);
  const [senderDialogOpen, setSenderDialogOpen] = useState(false);
  const [senderSearch, setSenderSearch] = useState("");
  const [senderLoading, setSenderLoading] = useState(false);
  const [senderResults, setSenderResults] = useState<SenderCompany[]>([]);
  const [documentNumber, setDocumentNumber] = useState(
    initialData
      ? getInvoiceDisplayNumber(initialData)
      : generateDocumentNumber(initialIssueDate, selectedSenderCompany?.invoice_prefix || "DIGITAL-INV"),
  );
  const [invoiceSequence, setInvoiceSequence] = useState(() => {
    const initialNumber = initialData
      ? getInvoiceDisplayNumber(initialData)
      : generateDocumentNumber(initialIssueDate, selectedSenderCompany?.invoice_prefix || "DIGITAL-INV");

    return String(extractInvoiceSequence(initialNumber) || 1);
  });
  const previousIssueDate = useRef(initialIssueDate);

  const form = useForm<InvoiceFormInput, unknown, InvoiceFormOutput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      sender_company_id: initialData?.sender_company_id ?? 0,
      vendor_id: initialData?.vendor_id ?? 0,
      issue_date: initialIssueDate,
      due_date: initialData?.due_date ?? formatDateInput(7),
      notes: initialData?.template_data?.contract_number ?? initialData?.notes ?? "",
      manual_last_sequence: 0,
      template_data: initialTemplate,
      items:
        initialData?.items?.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        })) ?? [{ description: "", quantity: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (!initialData) {
      return;
    }

    form.reset({
      sender_company_id: initialData.sender_company_id ?? 0,
      vendor_id: initialData.vendor_id,
      issue_date: initialData.issue_date,
      due_date: initialData.due_date,
      notes: initialData.template_data?.contract_number ?? initialData.notes ?? "",
      manual_last_sequence: 0,
      template_data: hydrateInvoiceTemplate(initialData),
      items: initialData.items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      })),
    });
    previousIssueDate.current = initialData.issue_date;
    setSelectedVendor(initialData.vendor);
    setSelectedSenderCompany(initialData.sender_company ?? null);
    const currentNumber = getInvoiceDisplayNumber(initialData);

    setDocumentNumber(currentNumber);
    setInvoiceSequence(String(extractInvoiceSequence(currentNumber) || 1));
  }, [form, initialData]);

  useEffect(() => {
    if (!vendorDialogOpen) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setVendorLoading(true);

      try {
        const response = await api.get<{ data: Vendor[] }>("/vendors", {
          params: {
            q: vendorSearch || undefined,
          },
        });

        setVendorResults(response.data.data);
      } catch {
        toast.error("Gagal memuat daftar vendor.");
      } finally {
        setVendorLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [vendorDialogOpen, vendorSearch]);

  useEffect(() => {
    if (!senderDialogOpen) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setSenderLoading(true);

      try {
        const response = await api.get<{ data: SenderCompany[] }>("/sender-companies", {
          params: {
            q: senderSearch || undefined,
          },
        });

        setSenderResults(response.data.data);
      } catch {
        toast.error("Gagal memuat perusahaan pengirim.");
      } finally {
        setSenderLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [senderDialogOpen, senderSearch]);

  useEffect(() => {
    if (initialData || selectedSenderCompany) {
      return;
    }

    let mounted = true;

    async function fetchDefaultSenderCompany() {
      try {
        const response = await api.get<{ data: SenderCompany[] }>("/sender-companies");
        const defaultSenderCompany = response.data.data[0];

        if (mounted && defaultSenderCompany) {
          const currentTemplate = form.getValues("template_data") as InvoiceTemplateData;
          const mappedTemplate = mapSenderCompanyToTemplate(defaultSenderCompany, currentTemplate);

          setSelectedSenderCompany(defaultSenderCompany);
          form.setValue("sender_company_id", defaultSenderCompany.id, { shouldValidate: true });
          form.setValue("template_data.issuer_company_name", mappedTemplate.issuer_company_name, {
            shouldDirty: true,
          });
          form.setValue("template_data.issuer_address", mappedTemplate.issuer_address, {
            shouldDirty: true,
          });
          form.setValue("template_data.payment_bank_name", mappedTemplate.payment_bank_name, {
            shouldDirty: true,
          });
          form.setValue("template_data.payment_account_number", mappedTemplate.payment_account_number, {
            shouldDirty: true,
          });
          form.setValue("template_data.payment_account_holder", mappedTemplate.payment_account_holder, {
            shouldDirty: true,
          });
          form.setValue("template_data.signature_city", mappedTemplate.signature_city, {
            shouldDirty: true,
          });
          form.setValue("template_data.signature_role", mappedTemplate.signature_role, {
            shouldDirty: true,
          });
          form.setValue("template_data.signature_name", mappedTemplate.signature_name, {
            shouldDirty: true,
          });
          form.setValue("template_data.tax_percent", mappedTemplate.tax_percent, {
            shouldDirty: true,
          });
          form.setValue("template_data.deduction_label", mappedTemplate.deduction_label, {
            shouldDirty: true,
          });
          form.setValue("template_data.deduction_percent", mappedTemplate.deduction_percent, {
            shouldDirty: true,
          });
        }
      } catch {
        // Biarkan form tetap bisa dibuka walau master belum termuat.
      }
    }

    void fetchDefaultSenderCompany();

    return () => {
      mounted = false;
    };
  }, [form, initialData, selectedSenderCompany]);

  const watchedItems = form.watch("items");
  const issueDate = form.watch("issue_date");
  const signatureDate = form.watch("template_data.signature_date");
  const senderCompanyId = form.watch("sender_company_id");
  const contractNumber = form.watch("notes");
  const manualLastSequence = form.watch("manual_last_sequence");
  const taxPercent = form.watch("template_data.tax_percent");
  const deductionLabel = form.watch("template_data.deduction_label");
  const deductionPercent = form.watch("template_data.deduction_percent");

  useEffect(() => {
    if (!issueDate) {
      return;
    }

    if (!signatureDate || signatureDate === previousIssueDate.current) {
      form.setValue("template_data.signature_date", issueDate, {
        shouldDirty: false,
      });
    }

    previousIssueDate.current = issueDate;
  }, [form, issueDate, signatureDate]);

  useEffect(() => {
    form.setValue("template_data.contract_number", contractNumber?.trim() ?? "", {
      shouldDirty: true,
    });
  }, [contractNumber, form]);

  useEffect(() => {
    let mounted = true;

    async function syncDocumentNumber() {
      if (mode === "edit" && initialData) {
        if (!issueDate) {
          return;
        }

        const baseNumber = generateDocumentNumber(
          issueDate,
          selectedSenderCompany?.invoice_prefix || initialData.sender_company?.invoice_prefix || "DIGITAL-INV",
        );
        const revisedNumber = replaceInvoiceSequence(
          baseNumber,
          invoiceSequence || String(extractInvoiceSequence(getInvoiceDisplayNumber(initialData)) || 1),
        );

        setDocumentNumber(revisedNumber);
        form.setValue("template_data.document_number", revisedNumber, {
          shouldDirty: false,
        });
        return;
      }

      if (!issueDate) {
        return;
      }

      try {
        const response = await api.get<{ data: { invoice_number: string } }>("/invoices/next-number", {
          params: {
            issue_date: issueDate,
            sender_company_id: senderCompanyId || undefined,
            exclude_invoice_id: mode === "edit" ? initialData?.id : undefined,
            manual_last_sequence: mode === "create" ? manualLastSequence || undefined : undefined,
          },
        });

        if (mounted) {
          const nextNumber = response.data.data.invoice_number;
          setDocumentNumber(nextNumber);
          setInvoiceSequence(String(extractInvoiceSequence(nextNumber) || 1));
          form.setValue("template_data.document_number", nextNumber, {
            shouldDirty: false,
          });
        }
      } catch {
        const fallbackNumber = generateDocumentNumber(
          issueDate,
          selectedSenderCompany?.invoice_prefix || "DIGITAL-INV",
        );

        if (mounted) {
          setDocumentNumber(fallbackNumber);
          setInvoiceSequence(String(extractInvoiceSequence(fallbackNumber) || 1));
          form.setValue("template_data.document_number", fallbackNumber, {
            shouldDirty: false,
          });
        }
      }
    }

    void syncDocumentNumber();

    return () => {
      mounted = false;
    };
  }, [form, initialData, invoiceSequence, issueDate, manualLastSequence, mode, selectedSenderCompany?.invoice_prefix, senderCompanyId]);

  const subtotal = watchedItems.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
  }, 0);
  const taxAmount = subtotal * ((Number(taxPercent) || 0) / 100);
  const deductionAmount = subtotal * ((Number(deductionPercent) || 0) / 100);
  const total = subtotal + taxAmount - deductionAmount;

  async function submitWithStatus(values: InvoiceFormOutput, status: "draft" | "sent") {
    setSubmitting(true);

    try {
      const payload = {
        ...values,
        template_data: {
          ...values.template_data,
          document_number: documentNumber,
          contract_number: values.notes?.trim() ?? "",
          signature_date: values.issue_date,
        },
        status,
      };

      if (mode === "edit" && initialData) {
        await api.put(`/invoices/${initialData.id}`, payload);
        toast.success("Invoice berhasil diperbarui.");
        router.push(`/invoices/${initialData.id}`);
      } else {
        const response = await api.post<{ data: Invoice }>("/invoices", payload);
        toast.success(status === "draft" ? "Draft berhasil disimpan." : "Invoice berhasil dibuat.");
        router.push(`/invoices/${response.data.data.id}`);
      }
    } catch {
      toast.error("Gagal menyimpan invoice.");
    } finally {
      setSubmitting(false);
    }
  }

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;

  function applyVendor(vendor: Vendor) {
    const currentTemplate = form.getValues("template_data") as InvoiceTemplateData;

    setSelectedVendor(vendor);
    setValue("vendor_id", vendor.id, { shouldValidate: true });

    const mappedTemplate = mapVendorToTemplate(vendor, currentTemplate);

    setValue("template_data.recipient_company_name", mappedTemplate.recipient_company_name, {
      shouldDirty: true,
    });
    setValue("template_data.recipient_address", mappedTemplate.recipient_address, {
      shouldDirty: true,
    });
    setValue("template_data.recipient_npwp", mappedTemplate.recipient_npwp, {
      shouldDirty: true,
    });
  }

  function applySenderCompany(senderCompany: SenderCompany) {
    const currentTemplate = form.getValues("template_data") as InvoiceTemplateData;

    setSelectedSenderCompany(senderCompany);
    setValue("sender_company_id", senderCompany.id, { shouldValidate: true });

    const mappedTemplate = mapSenderCompanyToTemplate(senderCompany, currentTemplate);

    setValue("template_data.issuer_company_name", mappedTemplate.issuer_company_name, {
      shouldDirty: true,
    });
    setValue("template_data.issuer_address", mappedTemplate.issuer_address, {
      shouldDirty: true,
    });
    setValue("template_data.payment_bank_name", mappedTemplate.payment_bank_name, {
      shouldDirty: true,
    });
    setValue("template_data.payment_account_number", mappedTemplate.payment_account_number, {
      shouldDirty: true,
    });
    setValue("template_data.payment_account_holder", mappedTemplate.payment_account_holder, {
      shouldDirty: true,
    });
    setValue("template_data.signature_city", mappedTemplate.signature_city, {
      shouldDirty: true,
    });
    setValue("template_data.signature_role", mappedTemplate.signature_role, {
      shouldDirty: true,
    });
    setValue("template_data.signature_name", mappedTemplate.signature_name, {
      shouldDirty: true,
    });
    setValue("template_data.tax_percent", mappedTemplate.tax_percent, {
      shouldDirty: true,
    });
    setValue("template_data.deduction_label", mappedTemplate.deduction_label, {
      shouldDirty: true,
    });
    setValue("template_data.deduction_percent", mappedTemplate.deduction_percent, {
      shouldDirty: true,
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <input type="hidden" {...register("template_data.issuer_company_name")} />
        <input type="hidden" {...register("template_data.issuer_address")} />
        <input type="hidden" {...register("template_data.payment_bank_name")} />
        <input type="hidden" {...register("template_data.payment_account_number")} />
        <input type="hidden" {...register("template_data.payment_account_holder")} />
        <input type="hidden" {...register("template_data.recipient_company_name")} />
        <input type="hidden" {...register("template_data.recipient_address")} />
        <input type="hidden" {...register("template_data.recipient_npwp")} />
        <input type="hidden" {...register("template_data.document_number")} />
        <input type="hidden" {...register("template_data.contract_number")} />
        <input type="hidden" {...register("template_data.signature_city")} />
        <input type="hidden" {...register("template_data.signature_date")} />
        <input type="hidden" {...register("template_data.signature_role")} />
        <input type="hidden" {...register("template_data.signature_name")} />
        <input type="hidden" {...register("template_data.tax_percent", { valueAsNumber: true })} />
        <input type="hidden" {...register("template_data.deduction_label")} />
        <input type="hidden" {...register("template_data.deduction_percent", { valueAsNumber: true })} />

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">Perusahaan Pengirim</span>
            <button
              className="flex h-24 w-full items-center justify-between rounded-[24px] border border-border bg-[color:var(--input)] px-4 text-left transition hover:bg-[color:var(--card-strong)]"
              onClick={() => setSenderDialogOpen(true)}
              type="button"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {selectedSenderCompany?.company_name || "Pilih perusahaan pengirim"}
                </p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {selectedSenderCompany
                    ? `${selectedSenderCompany.bank_name} • ${selectedSenderCompany.bank_account_number}`
                    : "Pilih dari master pengirim"}
                </p>
              </div>
              <Building2 className="h-5 w-5 text-[color:var(--muted)]" />
            </button>
            {errors.sender_company_id ? (
              <p className="text-sm text-amber-700">{errors.sender_company_id.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">Vendor</span>
            <button
              className="flex h-24 w-full items-center justify-between rounded-[24px] border border-border bg-[color:var(--input)] px-4 text-left transition hover:bg-[color:var(--card-strong)]"
              onClick={() => setVendorDialogOpen(true)}
              type="button"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {selectedVendor?.company_name || "Pilih vendor"}
                </p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {selectedVendor ? `${selectedVendor.name} • ${selectedVendor.phone}` : "Pilih dari master vendor"}
                </p>
              </div>
              <Users className="h-5 w-5 text-[color:var(--muted)]" />
            </button>
            {errors.vendor_id ? (
              <p className="text-sm text-amber-700">{errors.vendor_id.message}</p>
            ) : null}
          </div>

          <Field label="Tanggal Invoice" error={errors.issue_date?.message}>
            <Input type="date" {...register("issue_date")} />
          </Field>

          <Field label="Tanggal Jatuh Tempo" error={errors.due_date?.message}>
            <Input type="date" {...register("due_date")} />
          </Field>

          <Field label={mode === "edit" ? "Nomor Urut Invoice" : "Nomor Invoice"} error={errors.template_data?.document_number?.message}>
            {mode === "edit" ? (
              <div className="grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
                <Input
                  min="1"
                  onChange={(event) => {
                    const nextSequence = event.target.value.replace(/\D/g, "");
                    const nextNumber = replaceInvoiceSequence(documentNumber, nextSequence);

                    setInvoiceSequence(nextSequence);
                    setDocumentNumber(nextNumber);
                    setValue("template_data.document_number", nextNumber, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  step="1"
                  type="number"
                  value={invoiceSequence}
                />
                <div className="flex min-h-11 items-center break-words rounded-2xl border border-border bg-[color:var(--card-strong)] px-4 text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
                  {documentNumber}
                </div>
              </div>
            ) : (
              <Input readOnly value={documentNumber} />
            )}
          </Field>

          {mode === "create" ? (
            <Field label="Nomor Terakhir dari Perangkat Lain" error={errors.manual_last_sequence?.message}>
              <Input min="0" step="1" type="number" {...register("manual_last_sequence")} />
            </Field>
          ) : null}

          <Field label="No. Kontrak" error={errors.notes?.message}>
            <Input placeholder="Masukkan nomor kontrak" {...register("notes")} />
          </Field>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle>Data Pengirim</CardTitle>
          <div className="mt-6 space-y-4 text-sm text-[color:var(--muted)]">
            <PreviewRow
              label="Perusahaan"
              value={selectedSenderCompany?.company_name || "-"}
            />
            <PreviewRow label="Alamat" value={selectedSenderCompany?.address || "-"} />
            <PreviewRow label="Bank" value={selectedSenderCompany?.bank_name || "-"} />
            <PreviewRow
              label="Rekening"
              value={selectedSenderCompany?.bank_account_number || "-"}
            />
            <PreviewRow
              label="Pemilik Rekening"
              value={selectedSenderCompany?.bank_account_holder || "-"}
            />
            <PreviewRow
              label="Penandatangan"
              value={selectedSenderCompany?.signature_name || "-"}
            />
            <PreviewRow
              label="Prefix Invoice"
              value={selectedSenderCompany?.invoice_prefix || "-"}
            />
            <PreviewRow
              label="PPN"
              value={selectedSenderCompany ? `${selectedSenderCompany.tax_percent}%` : "-"}
            />
          </div>
        </Card>

        <Card>
          <CardTitle>Data Penerima</CardTitle>
          <div className="mt-6 space-y-4 text-sm text-[color:var(--muted)]">
            <PreviewRow label="Perusahaan" value={selectedVendor?.company_name || "-"} />
            <PreviewRow label="PIC" value={selectedVendor?.name || "-"} />
            <PreviewRow label="Email" value={selectedVendor?.email || "-"} />
            <PreviewRow label="Telepon" value={selectedVendor?.phone || "-"} />
            <PreviewRow label="NPWP" value={selectedVendor?.npwp || "-"} />
            <PreviewRow label="Alamat" value={selectedVendor?.address || "-"} />
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Item Invoice</CardTitle>
          <Button
            onClick={() => append({ description: "", quantity: 1, unit_price: 0 })}
            variant="secondary"
          >
            Tambah Item
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          {fields.map((field, index) => {
            const lineTotal =
              (Number(watchedItems[index]?.quantity) || 0) *
              (Number(watchedItems[index]?.unit_price) || 0);

            return (
              <div
                className="grid gap-4 rounded-[26px] border border-border bg-[color:var(--input)] p-4 lg:grid-cols-[minmax(0,1fr)_120px_180px_160px_72px]"
                key={field.id}
              >
                <Field
                  error={errors.items?.[index]?.description?.message}
                  label={`Deskripsi Item ${index + 1}`}
                >
                  <Input {...register(`items.${index}.description`)} />
                </Field>

                <Field error={errors.items?.[index]?.quantity?.message} label="Qty">
                  <Input step="0.01" type="number" {...register(`items.${index}.quantity`)} />
                </Field>

                <Field error={errors.items?.[index]?.unit_price?.message} label="Harga Satuan">
                  <Input step="0.01" type="number" {...register(`items.${index}.unit_price`)} />
                </Field>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Total</span>
                  <div className="flex h-11 items-center rounded-2xl border border-border bg-[color:var(--card-strong)] px-4 text-sm font-semibold text-foreground">
                    {formatCurrency(lineTotal)}
                  </div>
                </div>

                <div className="flex items-end">
                  <Button
                    className="h-11 w-full rounded-2xl px-0"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                    variant="danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        {typeof errors.items?.message === "string" ? (
          <p className="mt-3 text-sm text-amber-700">{errors.items.message}</p>
        ) : null}
      </Card>

      <Card className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <CardTitle>Ringkasan</CardTitle>
        </div>

        <div className="rounded-[26px] border border-border bg-[color:var(--input)] p-5">
          <div className="flex items-center justify-between py-2 text-sm">
            <span className="text-[color:var(--muted)]">Subtotal</span>
            <strong className="text-foreground">{formatCurrency(subtotal)}</strong>
          </div>
          <div className="flex items-center justify-between py-2 text-sm">
            <span className="text-[color:var(--muted)]">PPN {Number(taxPercent) || 0}%</span>
            <strong className="text-foreground">{formatCurrency(taxAmount)}</strong>
          </div>
          <div className="flex items-center justify-between py-2 text-sm">
            <span className="text-[color:var(--muted)]">{deductionLabel}</span>
            <strong className="text-foreground">- {formatCurrency(deductionAmount)}</strong>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-4 text-lg font-semibold text-teal-700">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          disabled={submitting}
          onClick={handleSubmit((values) => submitWithStatus(values, "draft"))}
          variant="outline"
        >
          {submitting ? "Menyimpan..." : mode === "edit" ? "Simpan sebagai Draft" : "Simpan Draft"}
        </Button>
        <Button
          disabled={submitting}
          onClick={handleSubmit((values) => submitWithStatus(values, "sent"))}
        >
          {submitting ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Buat Invoice"}
        </Button>
      </div>

      <Dialog onOpenChange={setSenderDialogOpen} open={senderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Perusahaan Pengirim</DialogTitle>
          </DialogHeader>

          <Input
            onChange={(event) => setSenderSearch(event.target.value)}
            placeholder="Cari perusahaan pengirim..."
            value={senderSearch}
          />

          <div className="mt-4 space-y-3">
            {senderLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton className="h-20 w-full" key={index} />
                ))
              : senderResults.map((senderCompany) => (
                  <button
                    className="w-full rounded-[24px] border border-border bg-[color:var(--input)] p-4 text-left transition hover:border-teal-400 hover:bg-[color:var(--card-strong)]"
                    key={senderCompany.id}
                    onClick={() => {
                      applySenderCompany(senderCompany);
                      setSenderDialogOpen(false);
                    }}
                    type="button"
                  >
                    <p className="font-semibold text-foreground">{senderCompany.company_name}</p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      {senderCompany.bank_name} • {senderCompany.bank_account_number}
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">
                      {senderCompany.signature_name}
                    </p>
                  </button>
                ))}

            {!senderLoading && senderResults.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-[color:var(--input)] px-4 py-8 text-center text-sm text-[color:var(--muted)]">
                Perusahaan pengirim tidak ditemukan.
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setVendorDialogOpen} open={vendorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Vendor</DialogTitle>
          </DialogHeader>

          <Input
            onChange={(event) => setVendorSearch(event.target.value)}
            placeholder="Cari vendor..."
            value={vendorSearch}
          />

          <div className="mt-4 space-y-3">
            {vendorLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton className="h-20 w-full" key={index} />
                ))
              : vendorResults.map((vendor) => (
                  <button
                    className="w-full rounded-[24px] border border-border bg-[color:var(--input)] p-4 text-left transition hover:border-teal-400 hover:bg-[color:var(--card-strong)]"
                    key={vendor.id}
                    onClick={() => {
                      applyVendor(vendor);
                      setVendorDialogOpen(false);
                    }}
                    type="button"
                  >
                    <p className="font-semibold text-foreground">{vendor.company_name}</p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      {vendor.name} • {vendor.phone}
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">{vendor.address || "-"}</p>
                  </button>
                ))}

            {!vendorLoading && vendorResults.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-[color:var(--input)] px-4 py-8 text-center text-sm text-[color:var(--muted)]">
                Vendor tidak ditemukan.
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {error ? <p className="text-sm text-amber-700">{error}</p> : null}
    </label>
  );
}

function PreviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span>{label}</span>
      <span className="max-w-[60%] text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function formatDateInput(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function extractInvoiceSequence(invoiceNumber: string) {
  const match = invoiceNumber.trim().match(/^(\d+)/);

  return match ? Number(match[1]) : 0;
}

function replaceInvoiceSequence(invoiceNumber: string, sequence: string) {
  const normalizedSequence = sequence === "" ? "" : String(Number(sequence)).padStart(2, "0");
  const separatorIndex = invoiceNumber.indexOf("/");

  if (separatorIndex === -1) {
    return normalizedSequence;
  }

  return `${normalizedSequence}${invoiceNumber.slice(separatorIndex)}`;
}
