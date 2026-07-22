import type { ComponentType } from 'react';
import { Receipt, PackageCheck, FileCheck2 } from 'lucide-react';

export type TransactionType = 'quote' | 'invoice' | 'sales-order' | 'purchase-bill';

export interface TransactionDateField {
  key: string;
  label: string;
}

export interface TransactionConversionConfig {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  isEligible: (doc: any) => boolean;
  endpoint: (id: string | number) => string;
  /** Omit for the "no body" convert-to-X actions; provide to POST a payload built from the source doc + its items (e.g. quote -> invoice). */
  buildPayload?: (doc: any, items: any[]) => any;
  resultRoute: (result: any) => string;
}

export interface TransactionTypeConfig {
  type: TransactionType;
  label: string;
  pluralLabel: string;
  newTitle: string;
  listRoute: string;
  apiBase: string;
  numberField: string;
  party: {
    kind: 'customer' | 'supplier';
    label: string;
    idField: 'customer_id' | 'supplier_id';
    contactIdField?: 'customer_contact_id';
    endpoint: string;
    searchMode: 'server' | 'client';
    hasContacts: boolean;
  };
  statusOptions: string[];
  defaultStatus: string;
  dateFields: TransactionDateField[];
  hasClosingRatio?: boolean;
  pdf: boolean;
  conversions?: TransactionConversionConfig[];
  isLocked?: (doc: any, adminRole?: string) => boolean;
  invalidateQueries: string[][];
}

export const TRANSACTION_CONFIGS: Record<TransactionType, TransactionTypeConfig> = {
  quote: {
    type: 'quote',
    label: 'Quote',
    pluralLabel: 'Quotes',
    newTitle: 'New Quote',
    listRoute: 'quotes',
    apiBase: 'quotes',
    numberField: 'quote_number',
    party: {
      kind: 'customer',
      label: 'Customer',
      idField: 'customer_id',
      contactIdField: 'customer_contact_id',
      endpoint: '/admin/customers',
      searchMode: 'server',
      hasContacts: true,
    },
    statusOptions: ['draft', 'sent', 'accepted', 'rejected', 'converted', 'invoiced'],
    defaultStatus: 'draft',
    dateFields: [
      { key: 'valid_until', label: 'Valid Until' },
      { key: 'due_date', label: 'Follow-up Due' },
    ],
    hasClosingRatio: true,
    pdf: true,
    conversions: [
      {
        label: 'Convert to Sales Order',
        icon: Receipt,
        isEligible: (doc) => doc.status === 'accepted',
        endpoint: (id) => `/admin/quotes/${id}/convert-to-sales-order`,
        resultRoute: (result) => `/sales-orders/${result.id}`,
      },
      {
        label: 'Convert to Invoice',
        icon: FileCheck2,
        isEligible: (doc) => doc.status === 'accepted',
        endpoint: () => `/admin/invoices`,
        buildPayload: (doc, items) => ({
          customer_id: doc.customer_id,
          customer_contact_id: doc.customer_contact_id,
          quote_id: doc.id,
          date: new Date().toISOString().split('T')[0],
          status: 'draft',
          items: items.map((i: any) => ({
            product_id: i.product_id || null,
            description: i.description,
            quantity: i.quantity,
            unit_price: i.unit_price,
            tax_percent: i.tax_percent,
          })),
        }),
        resultRoute: (result) => `/invoices/${result.id}`,
      },
    ],
    invalidateQueries: [['quotes'], ['admin-dashboard']],
  },
  invoice: {
    type: 'invoice',
    label: 'Invoice',
    pluralLabel: 'Invoices',
    newTitle: 'New Invoice',
    listRoute: 'invoices',
    apiBase: 'invoices',
    numberField: 'invoice_number',
    party: {
      kind: 'customer',
      label: 'Customer',
      idField: 'customer_id',
      contactIdField: 'customer_contact_id',
      endpoint: '/admin/customers',
      searchMode: 'server',
      hasContacts: true,
    },
    // Workflow only — payment state (unpaid/partially_paid/paid/overdue) is
    // computed from receipts (Invoice.payment_status), not part of this enum.
    statusOptions: ['draft', 'sent', 'accepted', 'on_hold', 'cancelled'],
    defaultStatus: 'draft',
    dateFields: [{ key: 'due_date', label: 'Settlement Due' }],
    pdf: true,
    conversions: [
      {
        label: 'Convert to Sales Order',
        icon: Receipt,
        isEligible: (doc) => doc.status === 'accepted' && !doc.sales_order_id,
        endpoint: (id) => `/admin/invoices/${id}/convert-to-sales-order`,
        resultRoute: (result) => `/sales-orders/${result.id}`,
      },
      {
        label: 'Create Delivery',
        icon: PackageCheck,
        isEligible: (doc) => doc.status === 'accepted' && !doc.linked_delivery,
        endpoint: (id) => `/admin/invoices/${id}/convert-to-delivery`,
        resultRoute: (result) => `/deliveries/${result.id}`,
      },
    ],
    // Once accepted and a delivery note exists, staff can no longer edit —
    // it's a live fulfillment record. Admins are never blocked.
    isLocked: (doc, adminRole) => doc.status === 'accepted' && !!doc.linked_delivery && adminRole !== 'admin',
    invalidateQueries: [['invoices'], ['admin-dashboard']],
  },
  'sales-order': {
    type: 'sales-order',
    label: 'Sales Order',
    pluralLabel: 'Sales Orders',
    newTitle: 'New Sales Order',
    listRoute: 'sales-orders',
    apiBase: 'sales-orders',
    numberField: 'order_number',
    party: {
      kind: 'customer',
      label: 'Customer',
      idField: 'customer_id',
      contactIdField: 'customer_contact_id',
      endpoint: '/admin/customers',
      searchMode: 'server',
      hasContacts: true,
    },
    statusOptions: ['draft', 'confirmed', 'processing', 'completed', 'cancelled'],
    defaultStatus: 'draft',
    dateFields: [],
    pdf: false,
    conversions: [
      {
        label: 'Create Delivery',
        icon: PackageCheck,
        isEligible: (doc) => doc.status === 'confirmed',
        endpoint: (id) => `/admin/sales-orders/${id}/convert-to-delivery`,
        resultRoute: (result) => `/deliveries/${result.id}`,
      },
      {
        label: 'Convert to Invoice',
        icon: FileCheck2,
        isEligible: (doc) => !['draft', 'cancelled'].includes(doc.status),
        endpoint: () => `/admin/invoices`,
        buildPayload: (doc) => ({
          customer_id: doc.customer_id,
          customer_contact_id: doc.customer_contact_id,
          quote_id: doc.quote_id,
          sales_order_id: doc.id,
          date: new Date().toISOString().split('T')[0],
          status: 'draft',
          // No items: the server copies them from sales_order_id.
        }),
        resultRoute: (result) => `/invoices/${result.id}`,
      },
    ],
    invalidateQueries: [['sales-orders']],
  },
  'purchase-bill': {
    type: 'purchase-bill',
    label: 'Purchase Bill',
    pluralLabel: 'Purchases',
    newTitle: 'New Purchase Bill',
    listRoute: 'purchases',
    apiBase: 'purchase-bills',
    numberField: 'bill_number',
    party: {
      kind: 'supplier',
      label: 'Supplier',
      idField: 'supplier_id',
      endpoint: '/admin/suppliers',
      searchMode: 'client',
      hasContacts: false,
    },
    statusOptions: ['unpaid', 'partial', 'paid', 'cancelled'],
    defaultStatus: 'unpaid',
    dateFields: [{ key: 'due_date', label: 'Due Date' }],
    pdf: false,
    invalidateQueries: [['purchase-bills'], ['products']],
  },
};
