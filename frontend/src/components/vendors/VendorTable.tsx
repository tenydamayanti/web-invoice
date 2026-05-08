import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import type { Vendor } from "@/types";

export function VendorTable({
  vendors,
  loading,
  onEdit,
  onDelete,
}: {
  vendors: Vendor[];
  loading: boolean;
  onEdit: (vendor: Vendor) => void;
  onDelete: (vendor: Vendor) => void;
}) {
  if (loading) {
    return null;
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {vendors.map((vendor) => (
              <div className="rounded-[24px] border border-border bg-[color:var(--card-strong)] p-4" key={vendor.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link className="block break-words text-base font-semibold text-teal-700 [overflow-wrap:anywhere]" href={`/vendors/${vendor.id}`}>
                      {vendor.name}
                    </Link>
                    <p className="mt-1 break-words text-sm text-[color:var(--muted)] [overflow-wrap:anywhere]">
                      {vendor.company_name}
                    </p>
                  </div>
                </div>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex flex-col gap-1.5">
                    <dt className="text-[color:var(--muted)]">Email</dt>
                    <dd className="break-words text-left [overflow-wrap:anywhere]">{vendor.email || "-"}</dd>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <dt className="text-[color:var(--muted)]">Telepon</dt>
                    <dd className="break-words text-left [overflow-wrap:anywhere]">{vendor.phone}</dd>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <dt className="text-[color:var(--muted)]">NPWP</dt>
                    <dd className="break-words text-left [overflow-wrap:anywhere]">{vendor.npwp || "-"}</dd>
                  </div>
                </dl>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button className="h-10 rounded-xl px-3" onClick={() => onEdit(vendor)} variant="outline">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button className="h-10 rounded-xl px-3" onClick={() => onDelete(vendor)} variant="danger">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                  </Button>
                </div>
              </div>
        ))}
      </div>

      <div className="hidden md:block">
        <div className="table-scroll">
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Nama</TableHeaderCell>
                <TableHeaderCell>Perusahaan</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Telepon</TableHeaderCell>
                <TableHeaderCell>NPWP</TableHeaderCell>
                <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {vendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <Link className="font-semibold text-teal-700" href={`/vendors/${vendor.id}`}>
                          {vendor.name}
                        </Link>
                      </TableCell>
                      <TableCell>{vendor.company_name}</TableCell>
                      <TableCell>{vendor.email || "-"}</TableCell>
                      <TableCell>{vendor.phone}</TableCell>
                      <TableCell>{vendor.npwp || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button className="h-9 rounded-xl px-3" onClick={() => onEdit(vendor)} variant="outline">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button className="h-9 rounded-xl px-3" onClick={() => onDelete(vendor)} variant="danger">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
