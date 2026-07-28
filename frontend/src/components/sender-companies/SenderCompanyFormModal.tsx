"use client";

import { useEffect, useState, type ReactNode } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SenderCompany } from "@/types";

const senderCompanySchema = z.object({
  company_name: z.string().min(1, "Nama perusahaan wajib diisi"),
  address: z.string().optional(),
  bank_name: z.string().min(1, "Nama bank wajib diisi"),
  bank_account_number: z.string().min(1, "Nomor rekening wajib diisi"),
  bank_account_holder: z.string().min(1, "Nama pemilik rekening wajib diisi"),
  signature_city: z.string().min(1, "Kota tanda tangan wajib diisi"),
  signature_role: z.string().min(1, "Jabatan wajib diisi"),
  signature_name: z.string().min(1, "Nama penandatangan wajib diisi"),
  invoice_prefix: z.string().min(1, "Prefix invoice wajib diisi"),
  last_invoice_sequence: z.coerce.number().int().min(0, "Nomor terakhir tidak boleh negatif"),
  tax_percent: z.coerce.number().min(0, "PPN tidak boleh negatif"),
  deduction_label: z.string().min(1, "Label potongan wajib diisi"),
  deduction_percent: z.coerce.number().min(0, "Potongan tidak boleh negatif"),
});

type SenderCompanyFormInput = z.input<typeof senderCompanySchema>;
type SenderCompanyFormOutput = z.output<typeof senderCompanySchema>;

export function SenderCompanyFormModal({
  open,
  onOpenChange,
  initialData,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: SenderCompany | null;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [footerFile, setFooterFile] = useState<File | null>(null);
  const [removeHeaderImage, setRemoveHeaderImage] = useState(false);
  const [removeFooterImage, setRemoveFooterImage] = useState(false);
  const form = useForm<SenderCompanyFormInput, unknown, SenderCompanyFormOutput>({
    resolver: zodResolver(senderCompanySchema),
    defaultValues: {
      company_name: "",
      address: "",
      bank_name: "",
      bank_account_number: "",
      bank_account_holder: "",
      signature_city: "",
      signature_role: "",
      signature_name: "",
      invoice_prefix: "",
      last_invoice_sequence: 0,
      tax_percent: 0,
      deduction_label: "",
      deduction_percent: 0,
    },
  });

  useEffect(() => {
    setHeaderFile(null);
    setFooterFile(null);
    setRemoveHeaderImage(false);
    setRemoveFooterImage(false);

    if (initialData) {
      form.reset({
        company_name: initialData.company_name,
        address: initialData.address ?? "",
        bank_name: initialData.bank_name,
        bank_account_number: initialData.bank_account_number,
        bank_account_holder: initialData.bank_account_holder,
        signature_city: initialData.signature_city,
        signature_role: initialData.signature_role,
        signature_name: initialData.signature_name,
        invoice_prefix: initialData.invoice_prefix || "DIGITAL-INV",
        last_invoice_sequence: isCurrentInvoiceSequencePeriod(initialData) ? initialData.last_invoice_sequence : 0,
        tax_percent: initialData.tax_percent ?? 0,
        deduction_label: initialData.deduction_label,
        deduction_percent: initialData.deduction_percent,
      });
      return;
    }

    form.reset({
      company_name: "",
      address: "",
      bank_name: "",
      bank_account_number: "",
      bank_account_holder: "",
      signature_city: "",
      signature_role: "",
      signature_name: "",
      invoice_prefix: "",
      last_invoice_sequence: 0,
      tax_percent: 0,
      deduction_label: "",
      deduction_percent: 0,
    });
  }, [form, initialData, open]);

  async function onSubmit(values: SenderCompanyFormOutput) {
    setSubmitting(true);

    try {
      const payload = new FormData();
      const normalizedValues = {
        ...values,
        invoice_prefix: values.invoice_prefix.trim() || "DIGITAL-INV",
        last_invoice_sequence: Number.isFinite(values.last_invoice_sequence) ? values.last_invoice_sequence : 0,
        tax_percent: Number.isFinite(values.tax_percent) ? values.tax_percent : 0,
        deduction_percent: Number.isFinite(values.deduction_percent) ? values.deduction_percent : 0,
      };

      Object.entries(normalizedValues).forEach(([key, value]) => {
        payload.append(key, String(value ?? ""));
      });

      if (headerFile) {
        payload.append("header_image", headerFile);
      }

      if (footerFile) {
        payload.append("footer_image", footerFile);
      }

      if (removeHeaderImage) {
        payload.append("remove_header_image", "1");
      }

      if (removeFooterImage) {
        payload.append("remove_footer_image", "1");
      }

      if (initialData) {
        await api.post(`/sender-companies/${initialData.id}?_method=PUT`, payload);
        toast.success("Perusahaan pengirim berhasil diperbarui.");
      } else {
        await api.post("/sender-companies", payload);
        toast.success("Perusahaan pengirim berhasil ditambahkan.");
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Gagal menyimpan perusahaan pengirim."));
    } finally {
      setSubmitting(false);
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Perusahaan Pengirim" : "Tambah Perusahaan Pengirim"}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nama Perusahaan" error={errors.company_name?.message}>
              <Input {...register("company_name")} />
            </Field>

            <Field label="Nama Bank" error={errors.bank_name?.message}>
              <Input {...register("bank_name")} />
            </Field>

            <Field label="Nomor Rekening" error={errors.bank_account_number?.message}>
              <Input {...register("bank_account_number")} />
            </Field>

            <Field label="Pemilik Rekening" error={errors.bank_account_holder?.message}>
              <Input {...register("bank_account_holder")} />
            </Field>

            <Field label="Kota Tanda Tangan" error={errors.signature_city?.message}>
              <Input {...register("signature_city")} />
            </Field>

            <Field label="Jabatan" error={errors.signature_role?.message}>
              <Input {...register("signature_role")} />
            </Field>

            <Field label="Nama Penandatangan" error={errors.signature_name?.message}>
              <Input {...register("signature_name")} />
            </Field>

            <Field label="Prefix Invoice" error={errors.invoice_prefix?.message}>
              <Input placeholder="DIGITAL-INV" {...register("invoice_prefix")} />
            </Field>

            <Field label="Nomor Terakhir Invoice Bulan Ini" error={errors.last_invoice_sequence?.message}>
              <Input min="0" step="1" type="number" {...register("last_invoice_sequence")} />
            </Field>

            <Field label="PPN (%)" error={errors.tax_percent?.message}>
              <Input step="0.01" type="number" {...register("tax_percent")} />
            </Field>

            <Field label="Potongan (%)" error={errors.deduction_percent?.message}>
              <Input step="0.01" type="number" {...register("deduction_percent")} />
            </Field>
          </div>

          <Field label="Label Potongan" error={errors.deduction_label?.message}>
            <Input {...register("deduction_label")} />
          </Field>

          <Field label="Alamat" error={errors.address?.message}>
            <Textarea {...register("address")} />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Kop Atas (opsional)">
              <Input
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setHeaderFile(event.target.files?.[0] ?? null)}
                type="file"
              />
              <p className="text-xs text-[color:var(--muted)]">
                {headerFile
                  ? `File baru: ${headerFile.name}`
                  : initialData?.header_image_path
                    ? "File kop atas sudah tersimpan."
                    : "Belum ada file kop atas."}
              </p>
              {initialData?.header_image_path ? (
                <label className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
                  <input
                    checked={removeHeaderImage}
                    onChange={(event) => setRemoveHeaderImage(event.target.checked)}
                    type="checkbox"
                  />
                  Hapus kop atas lama
                </label>
              ) : null}
            </Field>

            <Field label="Kop Bawah (opsional)">
              <Input
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setFooterFile(event.target.files?.[0] ?? null)}
                type="file"
              />
              <p className="text-xs text-[color:var(--muted)]">
                {footerFile
                  ? `File baru: ${footerFile.name}`
                  : initialData?.footer_image_path
                    ? "File kop bawah sudah tersimpan."
                    : "Belum ada file kop bawah."}
              </p>
              {initialData?.footer_image_path ? (
                <label className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
                  <input
                    checked={removeFooterImage}
                    onChange={(event) => setRemoveFooterImage(event.target.checked)}
                    type="checkbox"
                  />
                  Hapus kop bawah lama
                </label>
              ) : null}
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Batal
            </Button>
            <Button disabled={submitting} type="submit">
              {submitting ? "Menyimpan..." : initialData ? "Perbarui" : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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

function isCurrentInvoiceSequencePeriod(senderCompany: SenderCompany): boolean {
  const today = new Date();

  return (
    senderCompany.invoice_sequence_year === today.getFullYear() &&
    senderCompany.invoice_sequence_month === today.getMonth() + 1
  );
}
