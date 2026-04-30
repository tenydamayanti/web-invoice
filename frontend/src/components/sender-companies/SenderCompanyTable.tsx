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
import type { SenderCompany } from "@/types";

export function SenderCompanyTable({
  senderCompanies,
  loading,
  onEdit,
  onDelete,
}: {
  senderCompanies: SenderCompany[];
  loading: boolean;
  onEdit: (senderCompany: SenderCompany) => void;
  onDelete: (senderCompany: SenderCompany) => void;
}) {
  return (
    <div className="table-scroll">
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Perusahaan</TableHeaderCell>
            <TableHeaderCell>Bank</TableHeaderCell>
            <TableHeaderCell>Rekening</TableHeaderCell>
            <TableHeaderCell>Penandatangan</TableHeaderCell>
            <TableHeaderCell>Potongan</TableHeaderCell>
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
            : senderCompanies.map((senderCompany) => (
                <TableRow key={senderCompany.id}>
                  <TableCell className="font-semibold text-teal-700">
                    {senderCompany.company_name}
                  </TableCell>
                  <TableCell>{senderCompany.bank_name}</TableCell>
                  <TableCell>{senderCompany.bank_account_number}</TableCell>
                  <TableCell>{senderCompany.signature_name}</TableCell>
                  <TableCell>
                    {senderCompany.deduction_label} ({senderCompany.deduction_percent}%)
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        className="h-9 rounded-xl px-3"
                        onClick={() => onEdit(senderCompany)}
                        variant="outline"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        className="h-9 rounded-xl px-3"
                        onClick={() => onDelete(senderCompany)}
                        variant="danger"
                      >
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
