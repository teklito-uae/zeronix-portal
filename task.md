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
- [ ] Vite + React + TypeScript scaffold inside `frontend/`
- [ ] TailwindCSS + Shadcn UI init
- [ ] Install TanStack Query, TanStack Table, Axios, Zustand, React Router
- [ ] `lib/axios.ts` — base URL + auth token interceptor
- [ ] `lib/queryClient.ts` — TanStack Query client config
- [ ] Base layouts: `AdminLayout.tsx`, `CustomerLayout.tsx`, `Sidebar.tsx`, `Topbar.tsx`
- [ ] Shared components: `DataTable.tsx`, `PageHeader.tsx`, `StatCard.tsx`, `ConfirmDialog.tsx`, `EmptyState.tsx`
- [ ] Zustand stores: sidebar state, chat widget state
- [ ] Admin auth pages: Login
- [ ] Customer auth pages: Login, Register
- [ ] React Router setup with protected routes (admin + customer guards)
- [ ] `types/` folder — all TS interfaces mirroring DB models

## Phase 2 — Core Admin
- [ ] Dashboard
- [ ] Customers
- [ ] Suppliers
- [ ] Brands & Categories
- [ ] Products
- [ ] Enquiries

## Phase 3 — Quote & Invoice Engine
- [ ] Quote Create/Edit
- [ ] Quotes list
- [ ] Quote → Invoice conversion
- [ ] Invoice list + detail
- [ ] PDF generation
- [ ] Email sending

## Phase 4 — Customer Portal
- [ ] Product Search
- [ ] Product Detail
- [ ] Request Form
- [ ] My Enquiries
- [ ] Customer Register/Login (from Phase 1)

## Phase 5 — Chat System
- [ ] Admin Chat page
- [ ] Floating Chat Widget
- [ ] Pusher integration
- [ ] Polling fallback
- [ ] Unread count badge

## Phase 6 — Polish & Deployment
- [ ] Mobile responsiveness audit
- [ ] Loading skeletons + error states
- [ ] Empty states
- [ ] SEO meta tags
- [ ] GitHub Actions `deploy.yml`
- [ ] Production smoke test
