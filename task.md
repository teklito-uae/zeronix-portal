# Task List

## Phase 1 — Project Setup
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
- [x] TailwindCSS + Shadcn UI init
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

## Phase 2 — Core Admin
- [ ] Dashboard
- [x] Customers
- [x] Suppliers
- [x] Brands & Categories
- [x] Products
- [x] Enquiries

## Phase 3 — Quote & Invoice Engine
- [x] Quote Create/Edit
- [x] Quotes list
- [x] Quote → Invoice conversion
- [x] Invoice list + detail
- [x] PDF generation (UI mockup)
- [x] Email sending (UI mockup)

## Phase 4 — Customer Portal
- [x] Update Layout (Reuse AdminLayout + Sidebar)
- [x] Customer Dashboard
- [x] Products Table (Wholesale view, Add to Enquiry)
- [x] Manual Enquiry Form & List
- [x] Quotes & Invoices View (with Delivered status update)

## Phase 5 — Chat System
- [x] Admin Chat page
- [x] Customer Chat Support page
- [x] Pusher integration (UI Logic Ready)
- [x] Polling fallback (Simulated in UI)
- [x] Unread count badge in Topbar

## Phase 6 — Polish & Deployment
- [x] Mobile responsiveness audit (Dynamic Mobile Navigation)
- [x] Loading skeletons + composite components
- [x] Empty states reusable component
- [x] SEO meta tags management component
- [x] GitHub Actions `deploy.yml`
- [ ] Production smoke test (Final verification)
