"use client";

import { useEffect, useState } from "react";
import { Search, UserCog } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import api from "@/lib/axios";
import { UserFormModal } from "@/components/users/UserFormModal";
import { UserTable } from "@/components/users/UserTable";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { useUsers } from "@/hooks/useUsers";
import type { User } from "@/types";

export default function UsersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { loading, pagination, refresh, users } = useUsers({ page, search });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  async function handleDelete(user: User) {
    const confirmed = window.confirm(`Hapus user ${user.name}?`);

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/users/${user.id}`);
      toast.success("User berhasil dihapus.");
      void refresh();
    } catch (error) {
      const message =
        axios.isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "Gagal menghapus user.";

      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="fade-up">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <CardTitle>Manajemen User</CardTitle>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full min-w-0 sm:min-w-[280px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
              <Input
                className="pl-10"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari nama, email, atau role"
                value={searchInput}
              />
            </div>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setEditingUser(null);
                setModalOpen(true);
              }}
            >
              Tambah User
            </Button>
          </div>
        </div>
      </Card>

      <Card className="fade-up">
        {users.length === 0 && !loading ? (
          <EmptyState
            description="Belum ada akun pengguna yang tersimpan di workspace ini."
            icon={UserCog}
            title="Belum ada user"
          />
        ) : (
          <>
            <UserTable
              loading={loading}
              onDelete={handleDelete}
              onEdit={(user) => {
                setEditingUser(user);
                setModalOpen(true);
              }}
              users={users}
            />
            <Pagination
              currentPage={pagination?.current_page ?? 1}
              from={pagination?.from}
              lastPage={pagination?.last_page ?? 1}
              onPageChange={setPage}
              to={pagination?.to}
              total={pagination?.total}
            />
          </>
        )}
      </Card>

      <UserFormModal
        initialData={editingUser}
        onOpenChange={setModalOpen}
        onSaved={() => {
          void refresh();
          setEditingUser(null);
        }}
        open={modalOpen}
      />
    </div>
  );
}
