# Zeronix Portal — Project Plan & Roadmap

## Overview
Zeronix Portal is transitioning from a mock-data UI shell to a fully functional, API-driven CRM and Sales pipeline application. The primary focus is on enabling a smooth journey from Lead/Enquiry to Quote and Invoice, with granular access control for different team members.

## Phase 1 — CRM & Customer Management (Current)
- [x] **Customer Backend APIs** — Full CRUD, auto-generating ZRNX-CUS codes, search, TRN/VAT support.
- [x] **Customer UI Migration** — Replace mock data with React Query, real pagination, and live profile stats.
- [x] **Enquiry Backend APIs** — Full CRUD, nested enquiry items, status tracking.
- [x] **Enquiry UI Migration** — Real data tables, dynamic sheet details, updatable statuses.
- [ ] **CRM Lead Generation** — Modify the "Add Enquiry" flow to allow creating an enquiry for a *new* customer on-the-fly (CRM style) without needing to pre-register them.

## Phase 2 — Advanced User & Role Management
- [ ] **Admin User Management** — Dedicated page for Super Admins to create new users (Salesmen, Managers).
- [ ] **Designations & Permissions** — Assign specific module access (e.g., Salesman can view Quotes and Products but not Settings or Users).
- [ ] **Dynamic Sidebar** — Re-engineer `Sidebar.tsx` to conditionally render menu items based on the logged-in user's assigned permissions.
- [ ] **Data Scoping/Isolation** — Restrict Salesmen to only view and interact with their own Customers, Enquiries, Quotes, and Invoices. Admins retain full global visibility.
- [ ] **Global Activity Log** — Implement an Activity Logger to track user interactions (e.g., "User A sent Quote #123 to Customer XYZ"), accessible via a master feed for Admins.
- [ ] **Per-User SMTP Settings** — Provide a settings interface where each Salesman can input their own SMTP credentials, so quotes and invoices are emailed directly from their personal business address.

## Phase 3 — Quote & Invoice APIs
- [ ] **Quote Engine Backend** — `QuoteController`, auto-generating ZRNX-QT codes, line-item margin calculations, VAT.
- [ ] **Quote UI Migration** — Connect `QuoteDetail.tsx` to live backend, fetch real product data, calculate margins accurately.
- [ ] **Invoice Engine Backend** — `InvoiceController`, ZRNX-INV codes, payment status tracking.
- [ ] **Invoice UI Migration** — Convert Quote to Invoice flow using real APIs.
- [ ] **PDF Generation** — Implement Laravel DomPDF for real-time, branded Quote and Invoice PDF generation.
- [ ] **Email Dispatch** — Integrate the user's personal SMTP settings to fire off emails with PDF attachments.

## Phase 4 — Customer Portal API Migration
- [ ] **Customer Dashboard APIs** — Return real aggregate stats for the logged-in customer.
- [ ] **Products View** — Live feed of available products for wholesale viewing.
- [ ] **Customer Quote/Invoice Viewer** — Allow customers to securely view their PDFs and update invoice status to "Received".

## Phase 5 — Real-time Chat
- [ ] **Pusher/Laravel Echo** — Setup WebSocket infrastructure.
- [ ] **Admin & Customer Chat UI** — Connect the existing chat shells to live websockets for real-time messaging and notifications.