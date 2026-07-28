"use client";

import { useEffect, useState, type ReactNode } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Vendor } from "@/types";

const vendorSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z
    .string()
    .trim()
    .refine((value) => value === "" || z.string().email().safeParse(value).success, {
      message: "Format email tidak valid",
    }),
  phone: z.string().min(1, "Telepon wajib diisi"),
  company_name: z.string().min(1, "Nama perusahaan wajib diisi"),
  address: z.string().optional(),
  npwp: z.string().optional(),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

export function VendorFormModal({
  open,
  onOpenChange,
  initialData,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Vendor | null;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [footerFile, setFooterFile] = useState<File | null>(null);
  const [removeHeaderImage, setRemoveHeaderImage] = useState(false);
  const [removeFooterImage, setRemoveFooterImage] = useState(false);
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company_name: "",
      address: "",
      npwp: "",
    },
  });

  useEffect(() => {
    setHeaderFile(null);
    setFooterFile(null);
    setRemoveHeaderImage(false);
    setRemoveFooterImage(false);

    if (initialData) {
      form.reset({
        name: initialData.name,
        email: initialData.email ?? "",
        phone: initialData.phone,
        company_name: initialData.company_name,
        address: initialData.address ?? "",
        npwp: initialData.npwp ?? "",
      });
      return;
    }

    form.reset({
      name: "",
      email: "",
      phone: "",
      company_name: "",
      address: "",
      npwp: "",
    });
  }, [form, initialData, open]);

  async function onSubmit(values: VendorFormValues) {
    setSubmitting(true);

    try {
      const payload = new FormData();

      Object.entries(values).forEach(([key, value]) => {
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
        await api.post(`/vendors/${initialData.id}?_method=PUT`, payload);
        toast.success("Vendor berhasil diperbarui.");
      } else {
        await api.post("/vendors", payload);
        toast.success("Vendor berhasil ditambahkan.");
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Gagal menyimpan data vendor."));
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
          <DialogTitle>{initialData ? "Edit Vendor" : "Tambah Vendor"}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nama" error={errors.name?.message}>
              <Input {...register("name")} />
            </Field>

            <Field label="Email" error={errors.email?.message}>
              <Input {...register("email")} />
            </Field>

            <Field label="Telepon" error={errors.phone?.message}>
              <Input {...register("phone")} />
            </Field>

            <Field label="Nama Perusahaan" error={errors.company_name?.message}>
              <Input {...register("company_name")} />
            </Field>
          </div>

          <Field label="Alamat" error={errors.address?.message}>
            <Textarea {...register("address")} />
          </Field>

          <Field label="NPWP" error={errors.npwp?.message}>
            <Input {...register("npwp")} />
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
