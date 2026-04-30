"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { isAuthenticated, removeToken } from "@/lib/auth";
import type { User } from "@/types";

export function useAuth() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchUser() {
      if (!isAuthenticated()) {
        if (pathname !== "/login") {
          router.replace("/login");
        }

        if (mounted) {
          setLoading(false);
        }

        return;
      }

      try {
        const response = await api.get<{ user: User }>("/auth/me");

        if (mounted) {
          setUser(response.data.user);
        }
      } catch {
        removeToken();

        if (mounted) {
          setUser(null);
          router.replace("/login");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void fetchUser();

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // Token lokal tetap akan dibersihkan agar pengguna tidak tersangkut.
    } finally {
      removeToken();
      setUser(null);
      toast.success("Logout berhasil.");
      router.replace("/login");
    }
  }

  return {
    user,
    loading,
    setUser,
    logout,
  };
}
