"use client";

import { useEffect, useState, type ReactNode } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { User } from "@/types";

const userSchema = z
  .object({
    name: z.string().min(1, "Nama wajib diisi"),
    email: z.string().trim().email("Format email tidak valid"),
    role: z.enum(["admin", "staff"]),
    password: z.string().optional(),
    password_confirmation: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.password && values.password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password minimal 8 karakter",
        path: ["password"],
      });
    }

    if ((values.password || values.password_confirmation) && values.password !== values.password_confirmation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Konfirmasi password belum sama",
        path: ["password_confirmation"],
      });
    }
  });

type UserFormValues = z.infer<typeof userSchema>;

export function UserFormModal({
  open,
  onOpenChange,
  initialData,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: User | null;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "staff",
      password: "",
      password_confirmation: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        email: initialData.email,
        role: initialData.role,
        password: "",
        password_confirmation: "",
      });
      return;
    }

    form.reset({
      name: "",
      email: "",
      role: "staff",
      password: "",
      password_confirmation: "",
    });
  }, [form, initialData, open]);

  async function onSubmit(values: UserFormValues) {
    const password = values.password?.trim() || "";
    const passwordConfirmation = values.password_confirmation?.trim() || "";

    if (!initialData && password === "") {
      form.setError("password", {
        message: "Password wajib diisi",
      });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: values.name,
        email: values.email.trim(),
        role: values.role,
        password: password || undefined,
        password_confirmation: password ? passwordConfirmation : undefined,
      };

      if (initialData) {
        await api.put(`/users/${initialData.id}`, payload);
        toast.success("User berhasil diperbarui.");
      } else {
        await api.post("/users", payload);
        toast.success("User berhasil ditambahkan.");
      }

      onSaved();
      onOpenChange(false);
    } catch {
      toast.error("Gagal menyimpan data user.");
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
          <DialogTitle>{initialData ? "Edit User" : "Tambah User"}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nama" error={errors.name?.message}>
              <Input {...register("name")} />
            </Field>

            <Field label="Email" error={errors.email?.message}>
              <Input {...register("email")} type="email" />
            </Field>

            <Field label="Role" error={errors.role?.message}>
              <Select {...register("role")}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>

            <Field
              label={initialData ? "Password Baru" : "Password"}
              error={errors.password?.message}
              hint={initialData ? "Kosongkan jika tidak ingin mengganti password." : undefined}
            >
              <Input {...register("password")} type="password" />
            </Field>
          </div>

          <Field label="Konfirmasi Password" error={errors.password_confirmation?.message}>
            <Input {...register("password_confirmation")} type="password" />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
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
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint ? <p className="text-xs text-[color:var(--muted)]">{hint}</p> : null}
      {error ? <p className="text-sm text-amber-700">{error}</p> : null}
    </label>
  );
}
