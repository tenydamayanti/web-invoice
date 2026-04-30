"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/axios";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { InvoiceDetailResponse } from "@/types";

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<InvoiceDetailResponse | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchInvoice() {
      try {
        const response = await api.get<InvoiceDetailResponse>(`/invoices/${params.id}`);

        if (mounted) {
          setInvoice(response.data);
        }
      } catch {
        toast.error("Gagal memuat data invoice.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void fetchInvoice();

    return () => {
      mounted = false;
    };
  }, [params.id]);

  return (
    <div className="space-y-6">
      <Button asChild variant="outline">
        <Link href={`/invoices/${params.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Detail Invoice
        </Link>
      </Button>

      {loading || !invoice ? (
        <Card className="fade-up">
          <Skeleton className="h-[680px] w-full" />
        </Card>
      ) : (
        <div className="fade-up">
          <InvoiceForm initialData={invoice.data} mode="edit" />
        </div>
      )}
    </div>
  );
}
