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
  if (loading) {
    return null;
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {senderCompanies.map((senderCompany) => (
              <div className="rounded-[24px] border border-border bg-[color:var(--card-strong)] p-4" key={senderCompany.id}>
                <p className="break-words text-base font-semibold text-teal-700 [overflow-wrap:anywhere]">
                  {senderCompany.company_name}
                </p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex flex-col gap-1.5">
                    <dt className="text-[color:var(--muted)]">Bank</dt>
                    <dd className="break-words text-left [overflow-wrap:anywhere]">{senderCompany.bank_name}</dd>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <dt className="text-[color:var(--muted)]">Rekening</dt>
                    <dd className="break-words text-left [overflow-wrap:anywhere]">{senderCompany.bank_account_number}</dd>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <dt className="text-[color:var(--muted)]">Penandatangan</dt>
                    <dd className="break-words text-left [overflow-wrap:anywhere]">{senderCompany.signature_name}</dd>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <dt className="text-[color:var(--muted)]">Prefix Invoice</dt>
                    <dd className="break-words text-left [overflow-wrap:anywhere]">{senderCompany.invoice_prefix}</dd>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <dt className="text-[color:var(--muted)]">Nomor Terakhir</dt>
                    <dd className="break-words text-left [overflow-wrap:anywhere]">
                      {formatLastInvoiceSequence(senderCompany)}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <dt className="text-[color:var(--muted)]">PPN</dt>
                    <dd className="break-words text-left [overflow-wrap:anywhere]">
                      {senderCompany.tax_percent}%
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <dt className="text-[color:var(--muted)]">Potongan</dt>
                    <dd className="break-words text-left [overflow-wrap:anywhere]">
                      {senderCompany.deduction_label} ({senderCompany.deduction_percent}%)
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button className="h-10 rounded-xl px-3" onClick={() => onEdit(senderCompany)} variant="outline">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button className="h-10 rounded-xl px-3" onClick={() => onDelete(senderCompany)} variant="danger">
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
                <TableHeaderCell>Perusahaan</TableHeaderCell>
                <TableHeaderCell>Bank</TableHeaderCell>
                <TableHeaderCell>Rekening</TableHeaderCell>
                <TableHeaderCell>Penandatangan</TableHeaderCell>
                <TableHeaderCell>Prefix Invoice</TableHeaderCell>
                <TableHeaderCell>Nomor Terakhir</TableHeaderCell>
                <TableHeaderCell>PPN</TableHeaderCell>
                <TableHeaderCell>Potongan</TableHeaderCell>
                <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {senderCompanies.map((senderCompany) => (
                    <TableRow key={senderCompany.id}>
                      <TableCell className="font-semibold text-teal-700">
                        {senderCompany.company_name}
                      </TableCell>
                      <TableCell>{senderCompany.bank_name}</TableCell>
                      <TableCell>{senderCompany.bank_account_number}</TableCell>
                      <TableCell>{senderCompany.signature_name}</TableCell>
                      <TableCell>{senderCompany.invoice_prefix}</TableCell>
                      <TableCell>{formatLastInvoiceSequence(senderCompany)}</TableCell>
                      <TableCell>{senderCompany.tax_percent}%</TableCell>
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
      </div>
    </>
  );
}

function formatLastInvoiceSequence(senderCompany: SenderCompany): string {
  if (!senderCompany.invoice_sequence_year || !senderCompany.invoice_sequence_month) {
    return "0";
  }

  return `${senderCompany.last_invoice_sequence} (${String(senderCompany.invoice_sequence_month).padStart(2, "0")}/${senderCompany.invoice_sequence_year})`;
}
