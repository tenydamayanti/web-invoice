"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import api from "@/lib/axios";
import { isAuthenticated, setToken } from "@/lib/auth";
import { BrandMark } from "@/components/layout/BrandMark";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { User } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@invoice.com",
      password: "password123",
    },
  });

  useEffect(() => {
    async function verifyToken() {
      if (!isAuthenticated()) {
        return;
      }

      try {
        await api.get<{ user: User }>("/auth/me");
        router.replace("/");
      } catch {
        // Interceptor akan membersihkan token jika tidak valid.
      }
    }

    void verifyToken();
  }, [router]);

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);

    try {
      const response = await api.post<{ token: string }>("/auth/login", values);
      setToken(response.data.token);
      router.replace("/");
    } catch {
      toast.error("Email atau password salah");
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
    <main className="page-frame flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md rounded-[36px] border border-white/80 p-8 shadow-[0_36px_80px_rgba(15,23,42,0.14)]">
        <div className="mb-6 flex justify-center">
          <BrandMark compact />
        </div>

        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Akses Lokal
          </p>
          <CardTitle className="mt-3 text-3xl tracking-[-0.05em]">
            Masuk
          </CardTitle>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Email" error={errors.email?.message}>
            <Input {...register("email")} />
          </Field>

          <Field label="Password" error={errors.password?.message}>
            <Input type="password" {...register("password")} />
          </Field>

          <Button className="w-full" disabled={submitting} type="submit">
            {submitting ? "Memproses..." : "Masuk"}
          </Button>
        </form>
      </Card>
    </main>
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
