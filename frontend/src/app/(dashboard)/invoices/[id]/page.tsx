"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { InvoiceDetail } from "@/components/invoices/InvoiceDetail";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getInvoiceDownloadFileName } from "@/lib/invoice-template";
import type { InvoiceDetailResponse, InvoiceStatus } from "@/types";

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [data, setData] = useState<InvoiceDetailResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function fetchInvoice() {
      setLoading(true);

      try {
        const response = await api.get<InvoiceDetailResponse>(`/invoices/${params.id}`);

        if (mounted) {
          setData(response.data);
        }
      } catch {
        toast.error("Gagal memuat detail invoice.");
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
  }, [params.id, refreshKey]);

  async function handleDownload() {
    if (!data) {
      return;
    }

    try {
      const blobUrl = await getPdfBlobUrl(data.data.id);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = getInvoiceDownloadFileName(data.data);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      toast.error("Gagal mengunduh PDF invoice.");
    }
  }

  async function handlePreview() {
    if (!data) {
      return;
    }

    try {
      const blobUrl = await getPdfBlobUrl(data.data.id);
      const previewWindow = window.open(blobUrl, "_blank", "noopener,noreferrer");

      if (!previewWindow) {
        toast.error("Browser memblokir preview PDF.");
        window.URL.revokeObjectURL(blobUrl);
        return;
      }

      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
    } catch {
      toast.error("Gagal membuka preview PDF invoice.");
    }
  }

  async function handleStatusChange(status: InvoiceStatus) {
    if (!data) {
      return;
    }

    setStatusUpdating(true);

    try {
      await api.patch(`/invoices/${data.data.id}/status`, { status });
      toast.success("Status invoice berhasil diperbarui.");
      setRefreshKey((value) => value + 1);
    } catch {
      toast.error("Gagal memperbarui status invoice.");
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleDelete() {
    if (!data) {
      return;
    }

    const confirmed = window.confirm("Hapus invoice draft ini?");

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/invoices/${data.data.id}`);
      toast.success("Invoice berhasil dihapus.");
      router.push("/invoices");
    } catch {
      toast.error("Gagal menghapus invoice.");
    }
  }

  return loading || !data ? (
    <Card className="fade-up">
      <Skeleton className="h-[720px] w-full" />
    </Card>
  ) : (
    <div className="fade-up">
      <InvoiceDetail
        availableTransitions={data.available_transitions}
        invoice={data.data}
        onDelete={handleDelete}
        onDownload={handleDownload}
        onPreview={handlePreview}
        onStatusChange={handleStatusChange}
        statusUpdating={statusUpdating}
      />
    </div>
  );
}

async function getPdfBlobUrl(invoiceId: number) {
  const response = await api.get(`/invoices/${invoiceId}/pdf`, {
    responseType: "blob",
  });

  return window.URL.createObjectURL(response.data);
}
