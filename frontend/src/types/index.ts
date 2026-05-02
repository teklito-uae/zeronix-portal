// ── Enums ──────────────────────────────────────────────

export type EnquiryStatus = 'new' | 'in_progress' | 'quoted' | 'closed' | 'cancelled';
export type EnquiryPriority = 'normal' | 'high' | 'urgent';
export type EnquirySource = 'portal' | 'chat' | 'email' | 'phone' | 'whatsapp' | 'referral';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'invoiced';
export type InvoiceStatus = 'draft' | 'unpaid' | 'partial' | 'sent' | 'paid' | 'delivered' | 'overdue' | 'cancelled';

// ── Core Models ────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  designation?: string;
  permissions?: string[];
  is_active?: boolean;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_encryption?: string;
  imap_host?: string;
  imap_port?: number;
  imap_username?: string;
  imap_password?: string;
  imap_encryption?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: number;
  customer_code?: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  address?: string;
  trn?: string;
  password?: string;
  created_at?: string;
  updated_at?: string;
  is_portal_active?: boolean;
  user_id?: number;
  assigned_user?: User;
  // Computed / relationship counts
  enquiries_count?: number;
  quotes_count?: number;
  invoices_count?: number;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
  // Relations
  brands?: Brand[];
  brands_count?: number;
  products_count?: number;
}

export interface Brand {
  id: number;
  name: string;
  logo?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  name: string;
  parent_id?: number | null;
  parent?: Category;
  children?: Category[];
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  brand_id?: number | null;
  category_id?: number | null;
  model_code?: string;
  part_number?: string;
  model_number?: string;
  name: string;
  slug?: string;
  description?: string;
  specs?: Record<string, string>;
  image?: string;
  is_active?: boolean;
  price?: number;
  created_at?: string;
  updated_at?: string;
  // Relations
  brand?: Brand;
  category?: Category;
  supplier_products?: SupplierProduct[];
  suppliers_count?: number;
  supplier_products_count?: number;
}

export interface SupplierProduct {
  id: number;
  supplier_id: number;
  product_id?: number | null;
  category_id?: number | null;
  name: string;
  model_code?: string | null;
  identifier_hash: string;
  price?: number | null;
  currency: string;
  raw_text: string;
  specs: Record<string, string>;
  is_active: boolean;
  availability: boolean;
  last_pasted_at?: string;
  created_at?: string;
  updated_at?: string;
  // Relations
  supplier?: Supplier;
  product?: Product;
  category?: Category;
}

export interface Enquiry {
  id: number;
  customer_id?: number | null;
  user_id?: number | null;
  assigned_to?: number | null;
  source: EnquirySource;
  priority: EnquiryPriority;
  status: EnquiryStatus;
  notes?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  created_at?: string;
  updated_at?: string;
  // Relations
  customer?: Customer;
  user?: User;
  assignedUser?: User;
  items?: EnquiryItem[];
  items_count?: number;
}

export interface EnquiryItem {
  id: number;
  enquiry_id: number;
  product_id?: number | null;
  quantity: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
  // Relations
  product?: Product;
}

export interface Quote {
  id: number;
  quote_number?: string;
  enquiry_id?: number | null;
  customer_id?: number | null;
  status: QuoteStatus;
  date?: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  valid_until?: string;
  reference_id?: string;
  email_sent_at?: string;
  created_at?: string;
  updated_at?: string;
  // Relations
  customer?: Customer;
  enquiry?: Enquiry;
  items?: QuoteItem[];
}

export interface QuoteItem {
  id: number;
  quote_id: number;
  product_id?: number | null;
  description: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  tax_percent?: number;
  total: number;
  product?: Product;
}

export interface Invoice {
  id: number;
  invoice_number?: string;
  quote_id?: number | null;
  customer_id?: number | null;
  status: InvoiceStatus;
  date?: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  due_date?: string;
  paid_at?: string;
  notes?: string;
  delivery_status?: string;
  delivery_confirmed_at?: string;
  delivery_notes?: string;
  email_sent_at?: string;
  created_at?: string;
  updated_at?: string;
  // Computed
  days_due: number;
  amount_paid: number;
  balance: number;
  // Relations
  customer?: Customer;
  quote?: Quote;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_id?: number | null;
  description: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  tax_percent?: number;
  total: number;
  product?: Product;
}

export interface PaymentReceipt {
  id: number;
  invoice_id?: number;
  customer_id: number;
  receipt_number: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'bank';
  reference_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  invoice?: Invoice;
}

// ── Pagination ─────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ── Chat System ────────────────────────────────────────

export interface ChatRoom {
  id: number;
  customer_id: number;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  customer?: Customer;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: number;
  chat_conversation_id: number;
  sender_id?: number; // admin user id if sender_type is user
  sender_type: 'user' | 'customer';
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
}
export interface Template {
  id: number;
  name: string;
  type: 'quote' | 'invoice' | 'receipt' | 'enquiry';
  key: string;
  subject?: string;
  content: string;
  email_body?: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}
