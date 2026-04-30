"use client";

import { useEffect, useState, type ReactNode } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import api from "@/lib/axios";
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
      deduction_label: "",
      deduction_percent: 0,
    },
  });

  useEffect(() => {
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
      deduction_label: "",
      deduction_percent: 0,
    });
  }, [form, initialData, open]);

  async function onSubmit(values: SenderCompanyFormOutput) {
    setSubmitting(true);

    try {
      if (initialData) {
        await api.put(`/sender-companies/${initialData.id}`, values);
        toast.success("Perusahaan pengirim berhasil diperbarui.");
      } else {
        await api.post("/sender-companies", values);
        toast.success("Perusahaan pengirim berhasil ditambahkan.");
      }

      onSaved();
      onOpenChange(false);
    } catch {
      toast.error("Gagal menyimpan perusahaan pengirim.");
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
