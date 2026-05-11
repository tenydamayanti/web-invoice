"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import type { ManualInvoiceNumberLog, PaginatedResponse } from "@/types";

interface UseManualInvoiceNumberLogsParams {
  page?: number;
  search?: string;
}

export function useManualInvoiceNumberLogs({
  page = 1,
  search = "",
}: UseManualInvoiceNumberLogsParams) {
  const [data, setData] = useState<PaginatedResponse<ManualInvoiceNumberLog> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchLogs() {
      setLoading(true);

      try {
        const response = await api.get<PaginatedResponse<ManualInvoiceNumberLog>>(
          "/manual-invoice-number-logs",
          {
            params: {
              page,
              search: search || undefined,
            },
          },
        );

        if (mounted) {
          setData(response.data);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void fetchLogs();

    return () => {
      mounted = false;
    };
  }, [page, search]);

  return {
    loading,
    logs: data?.data ?? [],
    pagination: data,
  };
}
