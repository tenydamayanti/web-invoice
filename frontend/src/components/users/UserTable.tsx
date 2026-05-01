import { Pencil, Trash2, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import type { User } from "@/types";

export function UserTable({
  users,
  loading,
  onEdit,
  onDelete,
}: {
  users: User[];
  loading: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton className="h-36 w-full rounded-[24px]" key={index} />
            ))
          : users.map((user) => (
              <div className="rounded-[24px] border border-border bg-[color:var(--card-strong)] p-4" key={user.id}>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-[color:var(--input)] text-primary">
                    <UserCog className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-semibold text-foreground [overflow-wrap:anywhere]">
                      {user.name}
                    </p>
                    <p className="mt-1 break-words text-sm text-[color:var(--muted)] [overflow-wrap:anywhere]">
                      {user.email}
                    </p>
                  </div>
                  <Badge
                    className={
                      user.role === "admin"
                        ? "border-sky-200 bg-sky-50 text-sky-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }
                  >
                    {user.role === "admin" ? "Admin" : "Staff"}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button className="h-10 rounded-xl px-3" onClick={() => onEdit(user)} variant="outline">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button className="h-10 rounded-xl px-3" onClick={() => onDelete(user)} variant="danger">
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
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-[color:var(--input)] text-primary">
                            <UserCog className="h-4 w-4" />
                          </span>
                          <span className="font-semibold text-foreground">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.role === "admin"
                              ? "border-sky-200 bg-sky-50 text-sky-700"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          }
                        >
                          {user.role === "admin" ? "Admin" : "Staff"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button className="h-9 rounded-xl px-3" onClick={() => onEdit(user)} variant="outline">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button className="h-9 rounded-xl px-3" onClick={() => onDelete(user)} variant="danger">
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
