"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import type { Invoice, InvoiceStatus, PaginatedResponse } from "@/types";

interface UseInvoicesParams {
  page?: number;
  status?: InvoiceStatus | "all";
  search?: string;
  fromDate?: string;
  toDate?: string;
  vendorId?: number;
}

export function useInvoices({
  page = 1,
  status = "all",
  search = "",
  fromDate = "",
  toDate = "",
  vendorId,
}: UseInvoicesParams) {
  const [data, setData] = useState<PaginatedResponse<Invoice> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function fetchInvoices(showLoader = true) {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const response = await api.get<PaginatedResponse<Invoice>>("/invoices", {
          params: {
            page,
            status: status === "all" ? undefined : status,
            search: search || undefined,
            from_date: fromDate || undefined,
            to_date: toDate || undefined,
            vendor_id: vendorId || undefined,
          },
        });

        if (mounted) {
          setData(response.data);
        }
      } finally {
        if (mounted && showLoader) {
          setLoading(false);
        }
      }
    }

    function handleVisibilityRefresh() {
      if (document.visibilityState === "visible") {
        void fetchInvoices(false);
      }
    }

    void fetchInvoices();
    const timer = window.setInterval(() => {
      void fetchInvoices(false);
    }, 60000);
    window.addEventListener("focus", handleVisibilityRefresh);
    document.addEventListener("visibilitychange", handleVisibilityRefresh);

    return () => {
      mounted = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", handleVisibilityRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
    };
  }, [fromDate, page, refreshKey, search, status, toDate, vendorId]);

  return {
    invoices: data?.data ?? [],
    pagination: data,
    loading,
    refresh: () => setRefreshKey((value) => value + 1),
  };
}
