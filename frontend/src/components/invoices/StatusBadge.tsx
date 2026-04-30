import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusLabel } from "@/lib/utils";
import type { InvoiceStatus } from "@/types";

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge className={getStatusColor(status)}>{getStatusLabel(status)}</Badge>;
}
