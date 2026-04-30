import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  return (
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
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-12 w-full" />
                  </TableCell>
                </TableRow>
              ))
            : vendors.map((vendor) => (
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
  );
}
