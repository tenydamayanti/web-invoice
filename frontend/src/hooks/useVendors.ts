"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import type { PaginatedResponse, Vendor } from "@/types";

interface UseVendorsParams {
  search?: string;
  page?: number;
}

export function useVendors({ search = "", page = 1 }: UseVendorsParams) {
  const [data, setData] = useState<PaginatedResponse<Vendor> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function fetchVendors() {
      setLoading(true);

      try {
        const response = await api.get<PaginatedResponse<Vendor>>("/vendors", {
          params: {
            q: search || undefined,
            page,
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

    void fetchVendors();

    return () => {
      mounted = false;
    };
  }, [page, refreshKey, search]);

  return {
    vendors: data?.data ?? [],
    pagination: data,
    loading,
    refresh: () => setRefreshKey((value) => value + 1),
  };
}
