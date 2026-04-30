"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import type { PaginatedResponse, SenderCompany } from "@/types";

interface UseSenderCompaniesParams {
  page?: number;
  search?: string;
}

export function useSenderCompanies({
  page = 1,
  search = "",
}: UseSenderCompaniesParams) {
  const [data, setData] = useState<PaginatedResponse<SenderCompany> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function fetchSenderCompanies() {
      setLoading(true);

      try {
        const response = await api.get<PaginatedResponse<SenderCompany>>("/sender-companies", {
          params: {
            page,
            q: search || undefined,
          },
        });

        if (mounted) {
          setData(response.data);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void fetchSenderCompanies();

    return () => {
      mounted = false;
    };
  }, [page, refreshKey, search]);

  return {
    senderCompanies: data?.data ?? [],
    pagination: data,
    loading,
    refresh: () => setRefreshKey((value) => value + 1),
  };
}
