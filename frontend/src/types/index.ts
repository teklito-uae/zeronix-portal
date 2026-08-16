// ── Enums ──────────────────────────────────────────────

export type QuoteStatus =
  | 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted' | 'invoiced' | 'approved' | 'superseded';
export type SalesOrderStatus = 'draft' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
export type DeliveryStatus = 'pending' | 'processing' | 'delivered' | 'cancelled';
export type InvoiceStatus = 'draft' | 'sent' | 'accepted' | 'on_hold' | 'cancelled';
/** Computed from payment receipts (Invoice::getPaymentStatusAttribute) — never written directly. */
export type InvoicePaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'overdue';
export type PurchaseBillStatus = 'unpaid' | 'partial' | 'paid' | 'cancelled';

/**
 * Standard paginated-list envelope returned by controller `index()` methods
 * across the backend, e.g.:
 *   return response()->json([
 *     'data' => $items->items(),
 *     'total' => $items->total(),
 *     'current_page' => $items->currentPage(),
 *     'last_page' => $items->lastPage(),
 *     'per_page' => $items->perPage(),
 *   ]);
 * Not every `/admin/*` list endpoint uses this shape — a few (e.g.
 * `/admin/tags`, `/admin/customers/industries`, `/admin/contacts/departments`)
 * return a plain array instead. Check the specific controller before assuming
 * this envelope applies.
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
}

// ── Core Models ────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  manager_id?: number | null;
  manager?: User;
  designation?: string;
  avatar_color?: string | null;
  permissions?: string[];
  is_active?: boolean;
  shift_start?: string;
  shift_end?: string;
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

export interface CustomerLabel {
  id: number;
  name: string;
  color: string;
  customers_count?: number;
  created_by?: number;
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
  user_ids?: number[];
  assigned_users?: User[];
  labels?: CustomerLabel[];
  industry?: string;
  website?: string;
  description?: string;
  // Computed / relationship counts
  quotes_count?: number;
  invoices_count?: number;
  outstanding_balance?: number;
  overdue_invoices_count?: number;
  overdue_invoices_value?: number;
  contacts?: CustomerContact[];
  contacts_count?: number;
  deals_count?: number;
  total_invoiced?: number;
  total_volume?: number;
  open_deals_count?: number;
  open_deals_value?: number;
  open_quotes_count?: number;
  open_quotes_value?: number;
  open_invoices_count?: number;
  open_invoices_value?: number;
  type?: 'business' | 'individual';
}

export interface CustomerContact {
  id: number;
  customer_id: number;
  first_name: string;
  last_name?: string;
  full_name: string;
  designation?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  extension?: string;
  is_primary: boolean;
  is_active: boolean;
  notes?: string;
  attachments?: QuoteAttachment[] | null;
  created_at?: string;
  updated_at?: string;
  customer?: Customer;
  // Computed / relationship data (loaded on GET /admin/contacts/{id} and, for
  // deals_count/lifetime_value, on the GET /admin/contacts list endpoint)
  tags?: Tag[];
  deals_count?: number;
  deals_value?: number;
  quotes_count?: number;
  invoices_count?: number;
  lifetime_value?: number;
}

export interface Tag {
  id: number;
  company_id?: number;
  name: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContactActivity {
  id: number;
  customer_contact_id: number;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  notes?: string;
  due_date?: string | null;
  completed_at?: string | null;
  user_id?: number | null;
  created_at?: string;
  updated_at?: string;
  user?: User;
}


export interface Supplier {
  id: number;
  supplier_code?: string;
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
  sku?: string;
  stock_quantity?: number;
  is_low_stock?: boolean;
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

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'unresponsive';

export interface Lead {
  id: number;
  lead_code?: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  phone_2?: string;
  source?: string;
  status: LeadStatus;
  notes?: string;
  user_id?: number | null;
  converted_customer_id?: number | null;
  converted_at?: string;
  external_id?: string | null;
  synced_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  owner?: User;
  convertedCustomer?: Customer;
  deals_count?: number;
}

export interface GoogleContactConnectionStatus {
  connected: boolean;
  google_account_email: string | null;
  sync_status: 'idle' | 'syncing' | 'error';
  last_synced_at: string | null;
  last_error: string | null;
  pending_leads_count: number;
}

export type DealStage =
  | 'new' | 'qualified' | 'requirement' | 'proposal_sent' | 'negotiation' | 'won' | 'lost' | 'cancelled';

export type DealLostReason =
  | 'price' | 'competitor' | 'no_budget' | 'requirements_changed' | 'customer_cancelled' | 'no_response'
  | 'duplicate' | 'other';

export type DealSource = 'manual' | 'website' | 'email' | 'referral' | 'import' | 'other';
export type DealPriority = 'normal' | 'high' | 'urgent';

/**
 * The merged Enquiry+Deal entity (backend: `App\Models\Deal`, table
 * `enquiries`). Release B folded the old Enquiry lifecycle (source,
 * priority, notes, attachments, cancellation) into this one model, keyed by
 * `stage` instead of separate enquiry `status` + deal `stage` fields.
 */
export interface Deal {
  id: number;
  deal_code?: string;
  title: string;
  description?: string;
  lead_id?: number | null;
  customer_id?: number | null;
  company_id?: number;
  customer_contact_id?: number | null;
  value: number;
  stage: DealStage;
  position: number;
  tags?: Tag[];
  expected_close_date?: string | null;
  closed_at?: string | null;
  lost_reason?: DealLostReason | null;
  lost_notes?: string | null;
  probability: number;
  forecast_value?: number;
  next_action_at?: string | null;
  next_action_note?: string | null;
  source: DealSource;
  priority: DealPriority;
  notes?: string;
  attachments?: QuoteAttachment[] | null;
  cancellation_reason?: string;
  cancelled_at?: string;
  user_id?: number | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  lead?: Lead;
  customer?: Customer;
  customerContact?: CustomerContact;
  user?: User;
  assigned_users?: User[];
  primary_assignee?: User;
  additionalContacts?: CustomerContact[];
  items?: DealItem[];
  items_count?: number;
  quotes?: Quote[];
  activities?: DealActivity[];
}

export interface DealActivity {
  id: number;
  deal_id: number;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  notes?: string;
  due_date?: string | null;
  completed_at?: string | null;
  user_id?: number | null;
  created_at?: string;
  updated_at?: string;
  user?: User;
}

export interface DealItem {
  id: number;
  // Physical column is still `enquiry_id` (Release B did not rename the
  // `enquiry_items` table/column), so that's the real JSON key.
  enquiry_id: number;
  product_id?: number | null;
  product?: Product;
  quantity: number;
  description?: string;
  unit_price: number;
  tax_percent?: number;
  tax_amount?: number;
  discount_percent?: number;
  discount_amount?: number;
  total: number;
  created_at?: string;
  updated_at?: string;
}

export interface QuoteAttachment {
  name: string;
  path: string;
  size?: number;
  uploaded_at?: string;
}

export interface Quote {
  id: number;
  quote_number?: string;
  deal_id?: number | null;
  customer_id?: number | null;
  customer_contact_id?: number | null;
  user_id?: number | null;
  status: QuoteStatus;
  date?: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  valid_until?: string;
  reference_id?: string;
  email_sent_at?: string;
  due_date?: string;
  closing_ratio?: number;
  last_notified_at?: string;
  tags?: string[] | null;
  attachments?: QuoteAttachment[] | null;
  payment_terms?: string | null;
  delivery_date?: string | null;
  notes?: string | null;
  terms?: string | null;
  discount_percent?: number;
  shipping_amount?: number;
  created_at?: string;
  updated_at?: string;
  // Relations
  customer?: Customer;
  customerContact?: CustomerContact;
  deal?: Deal;
  items?: QuoteItem[];
  user?: User;
  activities?: ActivityLogEntry[];
}

export interface ActivityLogEntry {
  id: number;
  user_id?: number | null;
  customer_id?: number | null;
  action: string;
  subject_type?: string;
  subject_id?: number;
  description: string;
  properties?: { changes?: Record<string, unknown> } | null;
  created_at?: string;
  user?: User;
  customer?: Customer;
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
  discount_percent?: number;
  discount_amount?: number;
  total: number;
  product?: Product;
}

export interface SalesOrder {
  id: number;
  order_number?: string;
  customer_id: number;
  customer_contact_id?: number | null;
  enquiry_id?: number | null;
  deal_id?: number | null;
  quote_id?: number | null;
  user_id?: number | null;
  date?: string;
  status: SalesOrderStatus;
  subtotal: number;
  vat_amount: number;
  total: number;
  created_at?: string;
  updated_at?: string;
  // Relations
  customer?: Customer;
  customerContact?: CustomerContact;
  user?: User;
  items?: SalesOrderItem[];
  items_count?: number;
}

export interface SalesOrderItem {
  id: number;
  sales_order_id: number;
  product_id?: number | null;
  description?: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  tax_percent?: number;
  total: number;
  product?: Product;
}

export interface Delivery {
  id: number;
  delivery_number?: string;
  customer_id: number;
  sales_order_id?: number | null;
  invoice_id?: number | null;
  delivered_by?: number | null;
  delivery_date?: string;
  status: DeliveryStatus;
  notes?: string;
  delivered_at?: string;
  customer_confirmation?: 'accepted' | 'rejected' | null;
  customer_confirmed_at?: string | null;
  customer_notes?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  customer?: Customer;
  salesOrder?: SalesOrder;
  invoice?: Invoice;
  invoices?: Invoice[];
  deliveredBy?: User;
  items?: DeliveryItem[];
  items_count?: number;
}

export interface DeliveryItem {
  id: number;
  delivery_id: number;
  sales_order_item_id?: number | null;
  product_id?: number | null;
  product_name?: string;
  quantity: number;
  product?: Product;
}

export interface Invoice {
  id: number;
  invoice_number?: string;
  quote_id?: number | null;
  sales_order_id?: number | null;
  delivery_id?: number | null;
  customer_id?: number | null;
  customer_contact_id?: number | null;
  user_id?: number | null;
  status: InvoiceStatus;
  date?: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  due_date?: string;
  paid_at?: string;
  reference_id?: string | null;
  deal_id?: number | null;
  notes?: string | null;
  terms?: string | null;
  payment_terms?: string | null;
  discount_percent?: number;
  shipping_amount?: number;
  tags?: string[] | null;
  attachments?: QuoteAttachment[] | null;
  email_sent_at?: string;
  created_at?: string;
  updated_at?: string;
  // Computed
  days_due: number;
  amount_paid: number;
  balance: number;
  payment_status: InvoicePaymentStatus;
  // The delivery tied to this invoice, whichever direction created the link.
  linked_delivery?: Delivery | null;
  // Relations
  customer?: Customer;
  customerContact?: CustomerContact;
  quote?: Quote;
  deal?: Deal;
  delivery?: Delivery;
  deliveries?: Delivery[];
  items?: InvoiceItem[];
  user?: User;
  activities?: ActivityLogEntry[];
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
  discount_percent?: number;
  discount_amount?: number;
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

export interface PurchaseBill {
  id: number;
  bill_number?: string;
  supplier_id: number;
  user_id?: number | null;
  status: PurchaseBillStatus;
  date?: string;
  due_date?: string;
  subtotal: number;
  vat_amount: number;
  total: number;
  reference_id?: string;
  notes?: string | null;
  terms?: string | null;
  discount_percent?: number;
  shipping_amount?: number;
  tags?: string[] | null;
  attachments?: QuoteAttachment[] | null;
  created_at?: string;
  updated_at?: string;
  // Computed
  amount_paid: number;
  balance: number;
  // Relations
  supplier?: Supplier;
  user?: User;
  items?: PurchaseBillItem[];
  items_count?: number;
  activities?: ActivityLogEntry[];
  receipts?: SupplierPaymentReceipt[];
}

export interface PurchaseBillItem {
  id: number;
  purchase_bill_id: number;
  product_id?: number | null;
  description: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  tax_percent?: number;
  discount_percent?: number;
  discount_amount?: number;
  total: number;
  product?: Product;
}

export interface SupplierPaymentReceipt {
  id: number;
  purchase_bill_id?: number;
  supplier_id: number;
  receipt_number: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'bank';
  reference_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  purchase_bill?: PurchaseBill;
}

export interface Expense {
  id: number;
  category: string;
  amount: number;
  date: string;
  paid_via?: string;
  notes?: string;
  user_id?: number | null;
  created_at?: string;
  updated_at?: string;
  user?: User;
}

// ── Supplier Broadcast ─────────────────────────────────

export interface SbCategory {
  id: number;
  company_id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface SbVendor {
  id: number;
  company_id: number;
  name: string;
  company_name?: string | null;
  phone_raw: string;
  phone_e164?: string | null;
  whatsapp_chat_name?: string | null;
  email?: string | null;
  address?: string | null;
  category_id?: number | null;
  category?: SbCategory;
  notes?: string | null;
  is_active: boolean;
  source: 'manual' | 'extension';
  created_by_user_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface SbBroadcast {
  id: number;
  company_id: number;
  vendor_id?: number | null;
  vendor?: SbVendor;
  category_id?: number | null;
  category?: SbCategory;
  source: 'manual_paste' | 'extension';
  raw_text: string;
  parsed_row_count: number;
  parse_warnings: string[] | null;
  imported_by_user_id?: number | null;
  whatsapp_message_ts?: string | null;
  created_at?: string;
  updated_at?: string;
  products?: SbProduct[];
}

export interface SbProduct {
  id: number;
  company_id: number;
  broadcast_id: number;
  vendor_id?: number | null;
  vendor?: SbVendor;
  category_id?: number | null;
  category?: SbCategory;
  raw_line: string;
  product_name?: string | null;
  specs_text?: string | null;
  spec_ram?: string | null;
  spec_storage?: string | null;
  spec_cpu?: string | null;
  price: number | null;
  currency: string | null;
  quantity_note?: string | null;
  parse_confidence: 'high' | 'medium' | 'low';
  is_reviewed: boolean;
  created_at?: string;
  updated_at?: string;
}

// ── Pagination ─────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface Template {
  id: number;
  name: string;
  type: 'quote' | 'invoice' | 'sales_order' | 'payment_slip' | 'purchase_bill' | 'delivery_note';
  key: string;
  subject?: string;
  content: string;
  email_body?: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

// ── Marketing Automation ───────────────────────────────

export type MarketingCampaignStatus =
  | 'draft' | 'scheduled' | 'sending' | 'paused' | 'completed' | 'cancelled' | 'failed';

export type MarketingRecipientStatus =
  | 'pending' | 'queued' | 'sending' | 'sent' | 'delivered' | 'failed'
  | 'deferred' | 'bounced' | 'spam' | 'unsubscribed' | 'skipped';

export type MarketingChannel = 'email';

export interface MarketingSettings {
  id: number;
  company_id: number;
  timezone: string;
  business_days: number[];
  send_start_time: string;
  send_end_time: string;
  enforce_business_hours: boolean;
  min_interval_seconds: number;
  max_interval_seconds: number;
  rate_per_minute: number;
  rate_per_hour: number;
  rate_per_day: number;
  per_domain_limits: Record<string, number> | null;
  cool_off_hours: number;
  max_emails_per_recipient_per_month: number;
  duplicate_protection_days: number;
  track_opens: boolean;
  track_clicks: boolean;
  append_unsubscribe_footer: boolean;
  unsubscribe_footer_html?: string | null;
  default_test_email?: string | null;
}

export interface MarketingTemplate {
  id: number;
  name: string;
  subject: string;
  preheader?: string | null;
  body_html: string;
  category: 'welcome' | 'introduction' | 'follow_up' | 'renewal' | 'promotional' | 'custom';
  channel: MarketingChannel;
  is_builtin: boolean;
  is_active: boolean;
  current_version: number;
  user?: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface MarketingTemplateVersion {
  id: number;
  template_id: number;
  version: number;
  subject: string;
  body_html: string;
  editor?: { id: number; name: string } | null;
  created_at?: string;
}

export interface MarketingSegment {
  id: number;
  name: string;
  description?: string | null;
  source: 'leads' | 'customers' | 'contacts';
  filters: Record<string, unknown> | null;
  cached_count?: number | null;
  counted_at?: string | null;
  user?: { id: number; name: string } | null;
  created_at?: string;
}

export interface MarketingAudienceSource {
  type: 'segment' | 'customers' | 'leads' | 'contacts' | 'manual' | 'csv';
  id?: number;
  filters?: Record<string, unknown>;
  recipients?: { email: string; name?: string }[];
}

export interface MarketingCampaign {
  id: number;
  name: string;
  channel: MarketingChannel;
  status: MarketingCampaignStatus;
  template_id?: number | null;
  subject?: string | null;
  body_html?: string | null;
  preheader?: string | null;
  audience_config?: { sources: MarketingAudienceSource[] } | null;
  schedule_type: 'immediate' | 'scheduled';
  scheduled_at?: string | null;
  timezone?: string | null;
  total_recipients: number;
  pending_count: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  deferred_count: number;
  bounced_count: number;
  skipped_count: number;
  opened_count: number;
  open_events_count: number;
  clicked_count: number;
  click_events_count: number;
  unsubscribed_count: number;
  retry_count: number;
  launched_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  user?: { id: number; name: string; smtp_host?: string | null } | null;
  template?: { id: number; name: string } | null;
  created_at?: string;
}

export interface MarketingRecipient {
  id: number;
  campaign_id: number;
  source_type: 'lead' | 'customer' | 'contact' | 'manual' | 'csv';
  email: string;
  name?: string | null;
  status: MarketingRecipientStatus;
  skipped_reason?: string | null;
  attempts: number;
  last_error?: string | null;
  sent_at?: string | null;
  opened_at?: string | null;
  open_count: number;
  clicked_at?: string | null;
  click_count: number;
  unsubscribed_at?: string | null;
  campaign?: { id: number; name: string; status: string; user?: { id: number; name: string } | null } | null;
  updated_at?: string;
}

export interface MarketingSuppression {
  id: number;
  kind: 'email' | 'domain';
  value: string;
  type: 'unsubscribe' | 'hard_bounce' | 'spam' | 'invalid' | 'blocked_domain' | 'manual';
  notes?: string | null;
  creator?: { id: number; name: string } | null;
  created_at?: string;
}

// ── Notifications ───────────────────────────────────────

/** Laravel database-notification envelope (`notifications` table). */
export interface AppNotification {
  id: string;
  data: {
    type?: 'success' | 'error' | 'warning' | 'info' | string;
    title?: string;
    message?: string;
    action_url?: string;
  };
  read_at?: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unread_count: number;
}

export interface MarketingVariableGroup {
  group: string;
  variables: { token: string; label: string }[];
}
