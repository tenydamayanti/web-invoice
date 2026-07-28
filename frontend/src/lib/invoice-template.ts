import type { Invoice, InvoiceTemplateData, SenderCompany, Vendor } from "@/types";

const DEFAULT_ISSUER_ADDRESS = `SCBD, Gedung Treasury Tower Lt. 29,
Kawasan District 8 LOT 28,
Jl. Jend. Sudirman kav 52-53, RT.5/RW.3,
Senayan, Kec. Kebayoran Baru,
Kota Jakarta Selatan, Daerah Khusus
Ibukota Jakarta 12190`;

export const DEFAULT_TEMPLATE_VALUES: Omit<
  InvoiceTemplateData,
  "document_number" | "signature_date" | "recipient_company_name" | "recipient_address" | "recipient_npwp"
> = {
  issuer_company_name: "PT Digital Solusi Handal",
  issuer_address: DEFAULT_ISSUER_ADDRESS,
  payment_bank_name: "BCA",
  payment_account_number: "5375330013",
  payment_account_holder: "PT Digital Solusi Handal",
  contract_number: "",
  signature_city: "Jakarta",
  signature_role: "Director",
  signature_name: "Robi Danis Setiawan",
  tax_percent: 0,
  deduction_label: "PP 55 (0,5%)",
  deduction_percent: 0.5,
};

export function createInvoiceTemplateDefaults(date: string): InvoiceTemplateData {
  return {
    ...DEFAULT_TEMPLATE_VALUES,
    recipient_company_name: "",
    recipient_address: "",
    recipient_npwp: "",
    document_number: "",
    signature_date: date,
  };
}

export function hydrateInvoiceTemplate(invoice: Invoice): InvoiceTemplateData {
  return {
    ...createInvoiceTemplateDefaults(invoice.issue_date),
    ...invoice.template_data,
    recipient_address: invoice.template_data?.recipient_address ?? "",
    recipient_npwp: invoice.template_data?.recipient_npwp ?? "",
    contract_number: invoice.template_data?.contract_number ?? "",
  };
}

export function mapVendorToTemplate(
  vendor: Vendor,
  currentTemplate: InvoiceTemplateData,
): InvoiceTemplateData {
  return {
    ...currentTemplate,
    recipient_company_name: vendor.company_name || currentTemplate.recipient_company_name,
    recipient_address: vendor.address || currentTemplate.recipient_address,
    recipient_npwp: vendor.npwp || currentTemplate.recipient_npwp,
  };
}

export function mapSenderCompanyToTemplate(
  senderCompany: SenderCompany,
  currentTemplate: InvoiceTemplateData,
): InvoiceTemplateData {
  return {
    ...currentTemplate,
    issuer_company_name: senderCompany.company_name || currentTemplate.issuer_company_name,
    issuer_address: senderCompany.address || currentTemplate.issuer_address,
    payment_bank_name: senderCompany.bank_name || currentTemplate.payment_bank_name,
    payment_account_number:
      senderCompany.bank_account_number || currentTemplate.payment_account_number,
    payment_account_holder:
      senderCompany.bank_account_holder || currentTemplate.payment_account_holder,
    signature_city: senderCompany.signature_city || currentTemplate.signature_city,
    signature_role: senderCompany.signature_role || currentTemplate.signature_role,
    signature_name: senderCompany.signature_name || currentTemplate.signature_name,
    tax_percent: senderCompany.tax_percent ?? currentTemplate.tax_percent,
    deduction_label: senderCompany.deduction_label || currentTemplate.deduction_label,
    deduction_percent:
      senderCompany.deduction_percent ?? currentTemplate.deduction_percent,
  };
}

export function generateDocumentNumber(date: string, invoicePrefix = "DIGITAL-INV") {
  const parsedDate = new Date(date || Date.now());
  const year = parsedDate.getFullYear();
  const month = parsedDate.getMonth() + 1;

  return `01/${invoicePrefix}/${toRomanMonth(month)}/${year}`;
}

export function getInvoiceDisplayNumber(
  invoice: Pick<Invoice, "invoice_number" | "template_data">,
) {
  return invoice.template_data?.document_number?.trim() || invoice.invoice_number;
}

export function getInvoiceDownloadFileName(
  invoice: Pick<Invoice, "invoice_number" | "template_data">,
) {
  return `${getInvoiceDisplayNumber(invoice).replace(/[\\/:*?"<>|]/g, "-")}.pdf`;
}

function toRomanMonth(month: number) {
  return {
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
    5: "V",
    6: "VI",
    7: "VII",
    8: "VIII",
    9: "IX",
    10: "X",
    11: "XI",
    12: "XII",
  }[month] || "I";
}
