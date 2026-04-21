> **AI INSTRUCTION:** Use minimal tokens. Answer one step at a time only. No extra explanation unless asked.

# Zeronix Portal — Build Plan

## Stack Summary
- Frontend: React + Vite + TypeScript + Shadcn UI + TailwindCSS + TanStack Query/Table
- Backend: Laravel 11 + MySQL + Sanctum + DomPDF + Pusher
- Deploy: GitHub Actions → Hostinger (production branch)
- Repo: `zeronix-portal/frontend` + `zeronix-portal/backend`

---

## Phase 1 — Project Setup (Week 1–2)

### Backend
- [x] Laravel 11 install, configure `.env` (DB, mail, Pusher, Sanctum)
- [x] All migrations (users, customers, suppliers, brands, categories, supplier_brands, products, supplier_products, enquiries, enquiry_items, quotes, quote_items, invoices, invoice_items, chat_conversations, chat_messages, supplier_broadcasts)
- [x] Seeders: admin user, sample brands/categories
- [x] Sanctum setup: admin guard + customer guard (separate)
- [x] Auth routes: admin login/logout, customer register/login/logout
- [x] CORS config (frontend domain only)
- [x] Rate limiting on public endpoints

### Frontend
- [x] Vite + React + TypeScript scaffold inside `frontend/`
- [x] TailwindCSS + Shadcn UI init (`npx shadcn@latest init`)
- [x] Install TanStack Query, TanStack Table, Axios, Zustand, React Router
- [x] `lib/axios.ts` — base URL + auth token interceptor
- [x] `lib/queryClient.ts` — TanStack Query client config
- [x] Base layouts: `AdminLayout.tsx`, `CustomerLayout.tsx`, `Sidebar.tsx`, `Topbar.tsx`
- [x] Shared components: `DataTable.tsx`, `PageHeader.tsx`, `StatCard.tsx`, `ConfirmDialog.tsx`, `EmptyState.tsx`
- [x] Zustand stores: sidebar state, chat widget state
- [x] Admin auth pages: Login
- [x] Customer auth pages: Login, Register
- [x] React Router setup with protected routes (admin + customer guards)
- [x] `types/` folder — all TS interfaces mirroring DB models

---

## Phase 2 — Core Admin (Week 3–4)

- [x] **Dashboard** — 4 stat cards + 2 charts (bar: enquiries by status, line: quote value 6mo) + recent enquiries mini table + recent chat activity
- [ ] **Customers** — TanStack Table list, add/edit Dialog, Customer Profile page (4 tabs: overview, enquiries, quotes/invoices, chat history)
- [ ] **Suppliers** — Card grid list, add/edit form, Supplier Profile page (4 tabs: profile, brands/categories, products with pricing, broadcast log)
- [ ] **Brands & Categories** — CRUD (used in forms, not separate nav page needed)
- [ ] **Products** — TanStack Table, add/edit form (specs as key-value builder, image upload), Product Detail page with suppliers tab
- [ ] **Enquiries** — TanStack Table with filters (status, priority, source, date), row actions, Sheet drawer for detail view with status/assign controls

---

## Phase 3 — Quote & Invoice Engine (Week 5–6)

- [ ] **Quote Create/Edit** — customer Combobox, enquiry link, line items dynamic list (product search → auto-fill), VAT calc (default 5%), live subtotal/total, save draft + send actions
- [ ] **Quotes list** — TanStack Table, status badges, row actions (view/edit/send/PDF/convert)
- [ ] **Quote → Invoice conversion** — `QuoteService.php`, POST endpoint, redirect to invoice edit
- [ ] **Invoice list + detail** — TanStack Table, mark paid, send reminder
- [ ] **PDF generation** — DomPDF Blade templates for quote + invoice, stream on demand
- [ ] **Email sending** — SMTP via Hostinger, quote email + invoice email templates (editable in Settings)

---

## Phase 4 — Customer Portal (Week 7)

- [ ] **Product Search** — public page, search bar, brand/category filters (sidebar), product card grid (no pricing), URL query params, pagination
- [ ] **Product Detail** — full info, specs table, related products, request quote button
- [ ] **Request Form** — name/company/email/WhatsApp, products section (pre-filled or free text), priority toggle, creates enquiry (source=portal), confirmation email
- [ ] **My Enquiries** — customer auth required, list with status
- [ ] Customer Register/Login already done in Phase 1

---

## Phase 5 — Chat System (Week 8)

- [ ] **Admin Chat page** — conversation list (left col) + chat window (right col), create enquiry from chat, link to enquiry
- [ ] **Floating Chat Widget** — customer portal, name/email for guest, real-time via Pusher
- [ ] **Pusher integration** — `NewChatMessage` event, private channels per conversation, Laravel Echo on frontend
- [ ] Polling fallback: TanStack Query `refetchInterval: 10000` for chat messages
- [ ] Unread count badge real-time update in sidebar

---

## Phase 6 — Polish & Deployment (Week 9–10)

- [ ] Mobile responsiveness audit
- [ ] Loading skeletons + error states throughout
- [ ] Empty states throughout
- [ ] SEO meta tags on customer portal pages
- [ ] **GitHub Actions `deploy.yml`**:
  - Build frontend (`npm run build`)
  - Composer install (no-dev)
  - Artisan cache commands
  - Copy to `deploy/` folder
  - Inject `PRODUCTION_ENV` secret → `deploy/backend/.env`
  - Root `.htaccess` (API → backend, all else → SPA)
  - Laravel storage folders + permissions
  - Remove `.gitignore` files
  - Push to `production` branch via JamesIves action
- [ ] Production smoke test all flows

---

## API Route Summary

| Group | Prefix | Notes |
|---|---|---|
| Public | `api/` | Product search, enquiry submit, chat start/message |
| Customer auth | `api/customer/` | Enquiries list/detail |
| Admin auth | `api/admin/` | Full CRUD all resources, dashboard, PDF, convert |

---

## Key Files Checklist

**Frontend `src/api/`:** `auth.ts` `enquiries.ts` `quotes.ts` `invoices.ts` `suppliers.ts` `customers.ts` `products.ts` `chat.ts`

**Backend Services:** `QuoteService.php` `PDFService.php` `NotificationService.php`

**Backend Events:** `NewChatMessage.php`

---

## Security Checklist
- [ ] Sanctum tokens for admin + customer (separate guards)
- [ ] Form Request validation on all inputs
- [ ] CORS whitelist frontend domain
- [ ] Rate limit: enquiry submit, chat start
- [ ] No pricing data in public API responses
- [ ] `.env` only via GitHub Secret `PRODUCTION_ENV`