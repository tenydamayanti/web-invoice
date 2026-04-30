"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { Button } from "@/components/ui/button";

export default function CreateInvoicePage() {
  return (
    <div className="space-y-6">
      <Button asChild variant="outline">
        <Link href="/invoices">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Invoice
        </Link>
      </Button>

      <div className="fade-up">
        <InvoiceForm mode="create" />
      </div>
    </div>
  );
}
