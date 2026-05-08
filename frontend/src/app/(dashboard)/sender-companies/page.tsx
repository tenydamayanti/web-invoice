"use client";

import { useEffect, useState } from "react";
import { Building2, Search } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { SenderCompanyFormModal } from "@/components/sender-companies/SenderCompanyFormModal";
import { SenderCompanyTable } from "@/components/sender-companies/SenderCompanyTable";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { useSenderCompanies } from "@/hooks/useSenderCompanies";
import type { SenderCompany } from "@/types";

export default function SenderCompaniesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSenderCompany, setEditingSenderCompany] = useState<SenderCompany | null>(null);
  const { loading, pagination, refresh, senderCompanies } = useSenderCompanies({ page, search });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  async function handleDelete(senderCompany: SenderCompany) {
    const confirmed = window.confirm(`Hapus perusahaan pengirim ${senderCompany.company_name}?`);

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/sender-companies/${senderCompany.id}`);
      toast.success("Perusahaan pengirim berhasil dihapus.");
      void refresh();
    } catch {
      toast.error("Gagal menghapus perusahaan pengirim.");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="fade-up">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <CardTitle>Perusahaan Pengirim</CardTitle>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full min-w-0 sm:min-w-[280px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
              <Input
                className="pl-10"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari perusahaan atau bank"
                value={searchInput}
              />
            </div>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setEditingSenderCompany(null);
                setModalOpen(true);
              }}
            >
              Tambah Pengirim
            </Button>
          </div>
        </div>
      </Card>

      <Card className="fade-up">
        {loading ? null : senderCompanies.length === 0 ? (
          <EmptyState icon={Building2} title="Belum ada perusahaan pengirim" />
        ) : (
          <>
            <SenderCompanyTable
              loading={loading}
              onDelete={handleDelete}
              onEdit={(senderCompany) => {
                setEditingSenderCompany(senderCompany);
                setModalOpen(true);
              }}
              senderCompanies={senderCompanies}
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

      <SenderCompanyFormModal
        initialData={editingSenderCompany}
        onOpenChange={setModalOpen}
        onSaved={() => {
          void refresh();
          setEditingSenderCompany(null);
        }}
        open={modalOpen}
      />
    </div>
  );
}
