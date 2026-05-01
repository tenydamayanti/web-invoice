"use client";

import { useEffect, useState } from "react";
import { Search, Users } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { VendorFormModal } from "@/components/vendors/VendorFormModal";
import { VendorTable } from "@/components/vendors/VendorTable";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { useVendors } from "@/hooks/useVendors";
import type { Vendor } from "@/types";

export default function VendorsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const { loading, pagination, refresh, vendors } = useVendors({ page, search });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  async function handleDelete(vendor: Vendor) {
    const confirmed = window.confirm(`Hapus vendor ${vendor.company_name}?`);

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/vendors/${vendor.id}`);
      toast.success("Vendor berhasil dihapus.");
      void refresh();
    } catch {
      toast.error("Gagal menghapus vendor.");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="fade-up">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <CardTitle>Daftar Vendor</CardTitle>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full min-w-0 sm:min-w-[280px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-10"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari nama, email, atau perusahaan"
                value={searchInput}
              />
            </div>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setEditingVendor(null);
                setModalOpen(true);
              }}
            >
              Tambah Vendor
            </Button>
          </div>
        </div>
      </Card>

      <Card className="fade-up">
        {vendors.length === 0 && !loading ? (
          <EmptyState icon={Users} title="Belum ada vendor" />
        ) : (
          <>
            <VendorTable
              loading={loading}
              onDelete={handleDelete}
              onEdit={(vendor) => {
                setEditingVendor(vendor);
                setModalOpen(true);
              }}
              vendors={vendors}
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

      <VendorFormModal
        initialData={editingVendor}
        onOpenChange={setModalOpen}
        onSaved={() => {
          void refresh();
          setEditingVendor(null);
        }}
        open={modalOpen}
      />
    </div>
  );
}
