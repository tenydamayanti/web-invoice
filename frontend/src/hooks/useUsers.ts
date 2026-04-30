"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import type { PaginatedResponse, User } from "@/types";

interface UseUsersParams {
  search?: string;
  page?: number;
}

export function useUsers({ search = "", page = 1 }: UseUsersParams) {
  const [data, setData] = useState<PaginatedResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function fetchUsers() {
      setLoading(true);

      try {
        const response = await api.get<PaginatedResponse<User>>("/users", {
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

    void fetchUsers();

    return () => {
      mounted = false;
    };
  }, [page, refreshKey, search]);

  return {
    users: data?.data ?? [],
    pagination: data,
    loading,
    refresh: () => setRefreshKey((value) => value + 1),
  };
}
