// ── Enums ──────────────────────────────────────────────

export type EnquiryStatus = 'new' | 'in_progress' | 'quoted' | 'closed';
export type EnquiryPriority = 'normal' | 'high' | 'urgent';
export type EnquirySource = 'portal' | 'chat' | 'email' | 'phone';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'delivered' | 'overdue' | 'cancelled';

// ── Core Models ────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: number;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  password?: string;
  created_at?: string;
  updated_at?: string;
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
  part_number?: string;
  model_number?: string;
  name: string;
  description?: string;
  specs?: Record<string, string>;
  image?: string;
  created_at?: string;
  updated_at?: string;
  // Relations
  brand?: Brand;
  category?: Category;
  suppliers?: SupplierProduct[];
  suppliers_count?: number;
}

export interface SupplierProduct {
  id: number;
  supplier_id: number;
  product_id: number;
  price?: number;
  currency: string;
  availability: boolean;
  created_at?: string;
  updated_at?: string;
  // Relations
  supplier?: Supplier;
  product?: Product;
}

export interface Enquiry {
  id: number;
  customer_id?: number | null;
  source: EnquirySource;
  priority: EnquiryPriority;
  status: EnquiryStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Relations
  customer?: Customer;
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
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  valid_until?: string;
  reference_id?: string;
  notes?: string;
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
  total: number;
  product?: Product;
}

export interface Invoice {
  id: number;
  invoice_number?: string;
  quote_id?: number | null;
  customer_id?: number | null;
  status: InvoiceStatus;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  due_date?: string;
  paid_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
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
  total: number;
  product?: Product;
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
  chat_room_id: number;
  sender_id?: number; // admin user id if sender_type is user
  sender_type: 'user' | 'customer';
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
}
