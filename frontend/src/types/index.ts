export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff";
}

export interface Vendor {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  company_name: string;
  npwp: string | null;
  header_image_path: string | null;
  footer_image_path: string | null;
  created_at: string;
}

export interface SenderCompany {
  id: number;
  company_name: string;
  address: string | null;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
  signature_city: string;
  signature_role: string;
  signature_name: string;
  invoice_prefix: string;
  invoice_sequence_year: number | null;
  invoice_sequence_month: number | null;
  last_invoice_sequence: number;
  tax_percent: number;
  deduction_label: string;
  deduction_percent: number;
  is_default: boolean;
  header_image_path: string | null;
  footer_image_path: string | null;
  created_at: string;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface InvoiceTemplateData {
  issuer_company_name: string;
  issuer_address: string;
  recipient_company_name: string;
  recipient_address: string;
  recipient_npwp: string;
  document_number: string;
  contract_number: string;
  payment_bank_name: string;
  payment_account_number: string;
  payment_account_holder: string;
  signature_city: string;
  signature_date: string;
  signature_role: string;
  signature_name: string;
  tax_percent: number;
  deduction_label: string;
  deduction_percent: number;
}

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "overdue"
  | "cancelled";

export interface Invoice {
  id: number;
  invoice_number: string;
  vendor_id: number;
  sender_company_id: number | null;
  vendor: Vendor;
  sender_company: SenderCompany | null;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  subtotal: number;
  tax_percent: number;
  tax_amount: number;
  deduction_amount: number;
  total: number;
  notes: string | null;
  template_data: InvoiceTemplateData;
  items: InvoiceItem[];
  created_at: string;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface InvoiceDetailResponse {
  data: Invoice;
  available_transitions: InvoiceStatus[];
}

export interface DashboardStats {
  total_invoice: number;
  counts: Record<InvoiceStatus, number>;
  paid_total: number;
  paid_this_month: number;
  due_this_month: number;
  recent_invoices: Invoice[];
}
