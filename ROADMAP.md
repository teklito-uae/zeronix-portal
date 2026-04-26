# Zeronix Portal — Feature Roadmap & Next Steps

> **Last Updated:** 2026-04-26  
> **Business Model:** IT reseller (no stock). Source from suppliers → add margin → quote customer → invoice → deliver.

---

## Current Status Audit

### ✅ Fully Working (Backend + Frontend + Real Data)
| Module | Status | Notes |
|--------|--------|-------|
| Admin Auth | ✅ | Login, session persistence, token refresh |
| Suppliers CRUD | ✅ | List, add, edit, profile page, auto-generated ZRNX-SUP codes |
| Bulk Import | ✅ | Parse supplier data → sync to DB, auto-create master products |
| Supplier Products | ✅ | Synced products table, inline price edit, price history tracking |
| Products Catalog | ✅ | List with search, filters, pagination, relative dates, detail page |
| Brands & Categories | ✅ | Seeded, used in dropdowns/filters |

### ⚠️ Frontend Shell Only (Still Using Mock Data — No Backend API)
| Module | Status | What's Missing |
|--------|--------|----------------|
| **Enquiries** | ⚠️ | Uses mockEnquiries. No EnquiryController. No real CRUD API |
| **Quotes** | ⚠️ | Uses mockQuotes. No QuoteController. No create/edit flow |
| **Invoices** | ⚠️ | Uses mockInvoices. No InvoiceController. No real CRUD |
| **Customers** | ⚠️ | Uses mockCustomers. No CustomerController for admin CRUD |
| **Dashboard** | ⚠️ | Hardcoded stats. Needs real aggregate queries |
| **Chat** | ⚠️ | UI shell only. No Pusher integration, no real messages |
| **Customer Portal** | ⚠️ | All pages use mock data. No customer-facing APIs |

### ❌ Not Started
| Feature | Priority |
|---------|----------|
| Email integration (IMAP/SMTP for quotes & invoices) | HIGH |
| PDF generation (Quote & Invoice) | HIGH |
| Margin calculator | HIGH |
| Quote → Invoice conversion | MEDIUM |
| Mobile responsiveness | MEDIUM |

---

## Priority Feature List (Ordered by Sales Flow)

### Phase A — Complete the Sales Pipeline (CRITICAL)

#### A1. Customer Management API
- CustomerController — full CRUD (index, store, show, update, delete)
- Auto-generate customer code: ZRNX-CUS-YYYYMMDD-XXX
- Migrate Customers.tsx and CustomerProfile.tsx from mock to API
- Add customer search/filter (by company name,address, email, phone, TRN/VAT number)

#### A2. Enquiry System
- EnquiryController — CRUD + status management
- Admin can create enquiry on behalf of customer (phone/email source)
- Enquiry items linked to master products 
- Status flow: New → In Progress → Quoted → Delivered → Closed → Won/Lost
- Migrate Enquiries.tsx from mock data to real API

#### A4. Quote Engine
- QuoteController — create, edit, send, convert to invoice
- Auto-generate quote number: ZRNX-QT-YYYYMMDD-XXX
- Quote builder page:
  - Select customer (from customer DB)
  - Add line items (search products → pick supplier price → set margin)
  - VAT calculation (default 5% UAE)
  - Terms & conditions (editable template)
  - Valid until date, notes field
- Status flow: Draft → Sent → Accepted → Rejected → Expired
- Duplicate Quote action for repeat orders

#### A5. Invoice Engine
- InvoiceController — create from quote, standalone create, mark paid
- Auto-generate invoice number: ZRNX-INV-YYYYMMDD-XXX
- Quote → Invoice one-click conversion (copies line items, customer, totals)
- Status flow: Draft → Sent → Paid → Overdue → Cancelled
- Payment tracking (partial payments, payment date, payment method)
- Due date with overdue highlighting

#### A6. PDF Generation
- Quote PDF — branded template with logo, line items, totals, terms
- Invoice PDF — branded template with payment details, bank info
- Use Laravel DomPDF or Browsershot
- Download + preview (in-browser) support

#### A7. Email Integration (SMTP)
- Send quote PDF to customer email directly from the portal
- Send invoice PDF to customer email
- Payment reminder emails (manual trigger)
- Use Laravel Mail with Hostinger SMTP settings
- Email log: track what was sent, to whom, when
- Later: IMAP inbox monitoring to auto-create enquiries from incoming emails

---

### Phase B — Efficiency & Intelligence

#### B1. Dashboard with Real Data
- Total enquiries (by status breakdown), quotes (value by status), invoices (paid vs outstanding)
- Revenue this month vs last month
- Top 5 products by enquiry count, top 5 customers by quote value
- Recent activity feed

#### B2. Quick Quote from Supplier Profile
- From supplier products table, select items → Create Quote
- Pre-fills quote with selected products and supplier prices ( will do this later)

#### B3. Product Price History Chart
- On product detail page, show price trend over time (per supplier)
- Use Recharts (already installed) - (will plan this later)

#### B4. Customer Portal — Real APIs
- Customer can view quotes and invoices, accept/reject quotes
- Customer can submit enquiries, download PDFs

---

### Phase C — Advanced Features

#### C1. Email IMAP Integration
- Connect to Zeronix email inbox, auto-parse incoming emails into enquiries

#### C2. Chat System (Pusher)
- Real-time chat, create enquiry from chat, notification badges


#### C4. Multi-User Admin
- Role-based access, activity log, assign enquiries to sales reps

---

## Technical Debt

| Issue | Priority |
|-------|----------|
| Enquiries, Quotes, Invoices, Customers still import from mockData.ts | HIGH |
| Missing controllers: Enquiry, Quote, Invoice, Customer (admin) | HIGH |
| mockData.ts exports empty arrays but is still imported in 6+ files | MEDIUM |
| No form validation feedback on frontend | MEDIUM |
| No loading skeletons — only spinner states | LOW |

---

## Suggested Coding Order

```
1. CustomerController + migrate Customers.tsx       (2-3 hours)
2. EnquiryController + migrate Enquiries.tsx        (3-4 hours)
3. QuoteController + Quote builder with margins     (4-6 hours)
4. InvoiceController + Invoice from quote           (3-4 hours)
5. PDF templates (quote + invoice)                  (2-3 hours)
6. Email sending (quote/invoice via SMTP)           (2-3 hours)
7. Dashboard real data                              (2 hours)
8. Customer Portal migration                        (3-4 hours)
```

**Total estimated: ~25-30 hours of development**
