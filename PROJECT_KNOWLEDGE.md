# Zeronix Portal — Project Knowledge Base

> **Status:** Canonical, code-verified reference. Generated 2026-07-05 by direct inspection of the codebase (not from planning docs). Where older docs (`README.md`) disagree with this file, **this file is correct** — those docs describe intent/history and have drifted from the live code in several places (called out explicitly below).
>
> **2026-07-05 update — modules removed:** The **Chat** module (admin↔customer realtime messaging via Pusher/Echo) and the **Bulk-Import** module (supplier product paste/parse importer) were removed in full (backend controllers/models/events/routes + frontend pages/routes/sidebar). The IMAP `emails:sync` command (`SyncCustomerEmails`), which only threaded inbound email into chat tables, was removed with it. The chat DB migrations remain in history (tables not dropped). The duplicate `/admin/attendance/report` route bug was fixed, and the sidebar's Attendance item now lives in its own **"Workforce"** group. References below have been updated to match.

---

## 1. What this project is

Zeronix Portal is a **multi-tenant B2B CRM and sales-pipeline platform** for an IT reseller/wholesale business model (source from suppliers → add margin → quote customer → invoice → deliver). It serves three distinct audiences from one Laravel API + one React SPA:

| Domain | Frontend URL prefix | Audience |
|---|---|---|
| Platform Portal | **`/saas-admin/*`** (not `/platform/*` — see Divergence #1) | Super Admin (platform owner) |
| Tenant Workspace | `/workspace/*` (legacy `/admin`, `/staff` redirect here) | Internal staff: admin, salesman, staff roles |
| Customer Portal | `/portal/:company/*` | External customers of a tenant |
| Public site | `/inventory`, `/register`, `/login` | Unauthenticated visitors (RFQ + public catalog) |

Single shared codebase, single database, single deployed API — tenancy is a **data-scoping concern** (row-level, via `company_id`), not separate infrastructure per tenant.

---

## 2. Technology stack (verified from lockfiles, 2026-07-05)

### Backend — `backend/`
- **Laravel 11**, PHP `^8.2`
- **laravel/sanctum ^4.0** — bearer-token API auth (not session/cookie auth, despite `config/auth.php` still declaring unused session guards)
- **barryvdh/laravel-dompdf ^3.1** — quote/invoice/receipt PDF rendering
- **pusher/pusher-php-server ^7.2** — now **unused** (only the removed Chat module broadcast; kept in composer.json for now, prunable)
- **webklex/laravel-imap ^6.2** — now **unused** (only the removed `SyncCustomerEmails` command used it; prunable)
- Dev: PHPUnit 10.5, Pint, Sail, Faker, Mockery — present but essentially unused (see §9 Testing)
- **Not present:** spatie/laravel-permission, laravel/passport, maatwebsite/excel, laravel/horizon, any multi-tenancy package (tenancy is hand-rolled)

### Frontend — `frontend/`
- **React 19.2.5**, **TypeScript 6.0.3**, **Vite 8.0.9**
- **Tailwind CSS v4.2.4** — CSS-first config (`@theme` block in `src/index.css`), no `tailwind.config.js`
- **@tanstack/react-query 5.99** — server state; **@tanstack/react-table 8.21** — data tables
- **zustand 5.0** — client/auth state (manual localStorage persistence, no `persist` middleware)
- **axios 1.15** — single shared instance with interceptors
- **react-router-dom 7.14** — classic `<Routes>/<Route>` JSX (no `createBrowserRouter`, no route-level code splitting)
- **Radix UI + shadcn/ui pattern** (`components/ui/*`, `components.json`) — CVA, clsx, tailwind-merge, sonner (toasts), cmdk
- **recharts 3.8** — dashboard charts
- **laravel-echo 2.3 + pusher-js 8.5** — now **unused** (only the removed Chat module used Echo/Pusher; `lib/echo.ts` deleted; prunable from package.json)
- **No form library** (no react-hook-form/zod) — forms are hand-rolled local state
- **No test runner** declared (no vitest/jest/playwright/testing-library)

---

## 3. Backend architecture

### 3.1 Folder shape (actual, not layered by the book)
```
backend/app/
  Console/Commands/    QuoteFollowupNotification  (SyncCustomerEmails removed with Chat)
  Helpers/              NumberHelper (amount-to-words for PDFs)
  Http/Controllers/     flat controllers — plus Customer/ (8 controllers). (Admin/ChatController + the
                        two ChatControllers + BulkImportController removed; Admin/ and Events/ dirs now gone)
  Mail/                 InvoiceMail, PaymentReceiptMail, QuoteMail, WelcomeCustomerMail
  Models/               flat  (ChatConversation, ChatMessage removed)
  Notifications/        AdminNotification, SystemNotification
  Policies/             CustomerPolicy, EnquiryPolicy, InvoicePolicy, QuotePolicy, UserPolicy
  Providers/            AppServiceProvider only (Laravel 11 style, no RouteServiceProvider)
  Services/             DashboardService, MailConfigService
  Traits/               BelongsToCompany, HasUserScope, LogsActivity
```
(The `Events/` directory and its `MessageSent` event were removed with the Chat module.)
There is **no** `Http/Middleware/`, `Http/Requests/`, `Http/Resources/`, `Jobs/`, or `Listeners/` directory. `bootstrap/app.php`'s `withMiddleware()` and `withExceptions()` hooks are both empty. All validation is inline `$request->validate()`, all JSON shaping is inline `response()->json()` — there is no API Resource layer despite what design docs describe.

There is also **no Platform/Workspace/Portal controller namespace split**. The three-domain concept exists only at the **route-prefix** level (`/admin`, `/staff`, `/customer`, `/portal/{number}`) and in the frontend's page folders — not as a backend directory taxonomy.

### 3.2 Routes (`backend/routes/api.php`)
- `/customer/*` — public `register`/`login`, then `auth:sanctum` group: dashboard, logout, user, products, categories, enquiries, profile updates, invoices (index/show/confirm-delivery/download/view), quotes (index/show/update-status/download/view), notifications. (Customer chat routes removed.)
- `throttle:public` group — the actual public "portal" surface: numbered (not ID-based) unauthenticated quote/invoice view+download by document number, public inventory (`/public/products|categories|brands`), `POST /public/rfq` (public enquiry submission), `POST /public/register-company` (self-service tenant onboarding).
- Shared `foreach (['admin','staff'] as $prefix)` loop — both prefixes get an identical `auth:sanctum` route set: dashboard, enquiries CRUD+assign, customers CRUD+register-portal, companies resource, customer-labels, quotes CRUD+send-email, invoices CRUD+send-email, products/categories/brands (read), users (read), suppliers CRUD, notifications, attendance (clock-in/out/status/statistics/export), tasks, sticky-notes. (Chat routes removed.)
- `/admin/*`-only additions: login, product write/bulk-update/delete, customer-import, supplier-product update, users CRUD + SMTP settings + test-email, activity logs, `/platform/stats` (super-admin only), `attendance/report` → `AttendanceController::index` (admin-only paginated report), payment-receipts, templates, company approve/reject/suspend (tenant lifecycle). (Bulk-import route removed.)
- `Broadcast::routes()` and `routes/channels.php`'s `chat.{roomId}` channel were removed with Chat; only the generic `App.Models.User.{id}` channel remains in `channels.php`.

**Note:** The previously-documented duplicate `/admin/attendance/report` registration (one pointing to a non-existent `AttendanceController::report`) has been **fixed** — the erroneous line in the shared loop was deleted; `attendance/report` now resolves unambiguously to `AttendanceController::index` (admin-only). The frontend `AttendanceReport` page calls `GET /admin/attendance/report` via `ResourceListingPage resource="attendance/report"`.

### 3.3 Database schema (chronological highlights)
Core tables: `users`, `customers`, `brands`, `suppliers`, `categories`, `enquiries` (+ `enquiry_items`), `products`, `quotes`/`quote_items`, `invoices`/`invoice_items`, `supplier_brands`/`supplier_broadcasts`/`supplier_products`/`supplier_price_history`, `personal_access_tokens` (Sanctum), `activity_logs`, `templates`, `payment_receipts`, `notifications`, `customer_labels` (+ pivot), `attendances`, `staff_points`, `tasks`, `sticky_notes`, and pivots `customer_user` / `enquiry_user` (salesman assignment). (The `chat_conversations`/`chat_messages` tables' migrations remain in history but the Chat module and its models were removed; the tables are now unused and can be dropped with a follow-up migration.)

**Multi-tenancy root:** `companies` table (added **2026-06-16**, the newest migration group in the repo) — its columns (`parent_client_id`, `stage_id`, `crm_source_id`, `opening_balance`, `show_job_amount_to_worker`, etc.) read as a repurposed generic CRM "client" schema, not a purpose-built tenant table. `company_id` FKs were then retrofitted onto ~14 existing tables (`users`, `quotes`, `invoices`, `enquiries`, `tasks`, `products`, `suppliers`, `categories`, `brands`, `customer_labels`, `payment_receipts`, `sticky_notes`, `customers`) via two follow-up migrations. `companies.status` + `rejection_reason` implement an approve/reject/suspend tenant lifecycle.

### 3.4 Key models & relationships
- **`User`** — `Authenticatable`, `HasApiTokens, Notifiable, BelongsToCompany`. Fields include `role`, `designation`, `permissions` (json array, UI-only enforcement — see §3.6), `is_active`, `shift_start/end`, per-user `smtp_*`/`imap_*` credentials. `hasMany` enquiries/quotes/invoices/attendances/staffPoints/tasks/stickyNotes; `belongsToMany` `assigned_customers`, `assigned_enquiries`.
- **`Customer`** — a **separate first-class `Authenticatable`** (its own Sanctum guard), `LogsActivity, HasUserScope, BelongsToCompany`. Auto-generates `customer_code` as `ZRNX-CUS-{Ymd}-{seq}` in `boot()`'s `creating` hook. `hasMany` quotes/invoices/enquiries; `belongsToMany` `assigned_users`, `labels`.
- **`Enquiry`** — `belongsTo` customer/user, `belongsToMany` assigned_users, `hasMany` items/quotes. No auto-generated code.
- **`Quote`** — number generated **in the controller** (`QuoteController::store`), format `QT-{Ymd}-{seq}` — **not** `ZRNX-QT` prefixed, unlike what design docs imply. Inconsistent with `Customer`'s model-level generation.
- **`Invoice`** — same pattern (ad hoc controller-side numbering); `$appends = ['days_due','amount_paid','balance']` computed live from `PaymentReceipt` sums (no denormalized paid-amount column).
- **`Product`** — `specs` json cast, `belongsTo` category/brand, `hasMany` supplierProducts.
- **`Company`** — plain `Model` (no `BelongsToCompany`/`LogsActivity` — it *is* the tenant root), `belongsTo` owner (`User`), `hasMany` customers.

Consistent trait stack across tenant-scoped models: **`BelongsToCompany`** (tenancy) + **`HasUserScope`** (per-salesman row visibility) + **`LogsActivity`** (writes to `activity_logs` on create/update/delete).

### 3.5 Multi-tenancy mechanism
`app/Traits/BelongsToCompany.php` — a **global Eloquent scope**, not a package:
- Filters every query by the authenticated user's/customer's `company_id`, **except** `super_admin` role (bypasses — sees all tenants).
- Auto-stamps `company_id` on `creating` for non-super-admins.
- Adds a `company()` belongsTo relation.

`HasUserScope` layers a second restriction inside a tenant: salesmen only see rows tied to them (`->forUser($user)`), used throughout controllers and `DashboardService`.

This is **single-database, shared-schema, row-level multi-tenancy** — not schema-per-tenant or database-per-tenant.

### 3.6 Auth & authorization
- **Sanctum bearer tokens** are the real mechanism (`auth:sanctum` on all protected routes). `config/auth.php`'s `admin`/`customer` session guards are **dead/unused scaffolding**.
- `AdminAuthController::login` checks `role` + password, issues `createToken('admin-token', ['role:'.$role])` — but token *abilities* are never actually checked anywhere (`tokenCan()` unused); role gating is done by re-reading `$user->role` from the DB on each request.
- `CustomerAuthController` issues tokens against the separate `Customer` Authenticatable via the `customer` guard.
- Authorization beyond `auth:sanctum` is mostly **inline role-string checks in controllers** (`if (!in_array($user->role, [...])) abort(403)`), plus a handful of `Policy` classes (`QuotePolicy`, `EnquiryPolicy`, etc.) invoked via `$this->authorize()` — auto-discovered by Laravel 11 naming convention (no explicit registration).
- `users.permissions` (JSON array) exists but is **only enforced on the frontend** (`ProtectedRoute.tsx`, `Sidebar.tsx`) — not re-checked server-side in sampled controllers. Treat any frontend-only permission gate as UX, not security.

### 3.7 Business logic services
- **`DocumentController`** — the PDF hub. No Blade views; builds HTML by string-replacing placeholder tokens (`{items}`, `{tax_summary}`, `{logo_url}`, `{total_in_words}`) into a `Template` model's stored HTML, then renders via DomPDF. Payment receipts use fully hardcoded inline HTML instead of a template.
- **`MailConfigService`** — dynamically swaps the active Laravel mailer to the *currently authenticated staff member's own SMTP credentials* per request ("send as yourself" design). (Its IMAP client helper is now dead code — the only consumer, `SyncCustomerEmails`, was removed with Chat.)
- **`DashboardService`** — tenant + user-scoped analytics (6-month trend, 30-day revenue, monthly activity, recent feed, staff leaderboard, gamification points via `StaffPoint`).
- **`QuoteFollowupNotification`** (hourly cron) — only nags salesmen who are inside their shift window *and* currently clocked in, using a weighted random roll against each quote's `closing_ratio`. This is now the **only** scheduled command (the `emails:sync` schedule entry was removed).
- `NumberHelper::toWords()` — amount-in-words for PDFs.

### 3.8 Config gaps
- `.env.example` is a stock Laravel skeleton — it's **missing** `PUSHER_*`, `FRONTEND_URL`, `MAIL_EHLO_DOMAIN`, and IMAP vars, even though the app depends on all of them at runtime. A fresh environment setup must source these from code, not the example file.
- `config('zeronix.default_per_page', 15)` is referenced in controllers but no `config/zeronix.php` file exists — this silently always falls back to `15`. Likely a dead/unfinished config reference.

### 3.9 Testing
`backend/tests/` contains only the default Laravel skeleton (`ExampleTest.php` x2). **No real coverage** of Customer/Enquiry/Quote/Invoice flows, tenancy scoping, auth, or PDF generation exists despite PHPUnit/Mockery/Faker being installed.

---

## 4. Frontend architecture

### 4.1 Folder shape (`frontend/src`)
```
App.tsx                     single router entry, all pages eagerly imported (no lazy loading)
components/
  auth/ProtectedRoute.tsx   AdminRoute + CustomerRoute guards
  layout/                   AdminLayout (shell for ALL three domains), CustomerLayout (unused?),
                             Sidebar, Topbar, GlobalSearch, MobileBottomNav
  shared/                   ~20 generic building blocks: DataTable, ResourceListingPage,
                             DownloadButton, StatCard, ItemModal, DocumentEditor, StatusBadge, ...
  ui/                       shadcn/ui primitives
hooks/
  useApi.ts                 generic react-query CRUD hook factory (see 4.3)
  useBasePath.ts            resolves /saas-admin vs /workspace by role
  useBreadcrumb.ts
lib/
  axios.ts                  shared axios instance + interceptors
  mockData.ts                ⚠ dead code — every array empty, zero imports anywhere
  queryClient.ts
                            (echo.ts + parsingUtils.ts removed with Chat / Bulk-Import)
pages/
  UnifiedLogin.tsx, NotFound.tsx
  platform/                 PlatformDashboard, TenantManagement, SystemDocs, GlobalActivities, PlatformSettings
  workspace/                Dashboard, Customers(+Profile), Suppliers(+Profile), Products, Enquiries,
                             Quotes(+Detail), Invoices(+Detail), PaymentReceipts,
                             CustomerImport, Users, Settings, Notifications, AttendanceReport
    staff/StaffDashboard.tsx
  portal/                   CustomerDashboard, CustomerProducts, CustomerEnquiries, CustomerQuotes,
                             CustomerInvoices, CustomerProfile, CustomerNotifications,
                             Register, RequestForm
  public/Inventory.tsx      unauthenticated RFQ/inventory landing page (undocumented 4th domain)
store/                      useAuthStore, useCartStore, useSidebarStore, useThemeStore,
                             useBreadcrumbStore
                            (Chat.tsx, CustomerChat.tsx, BulkImport.tsx, useChatWidgetStore removed)
types/index.ts               shared domain types (ChatRoom/ChatMessage removed)
```

### 4.2 Routing (`App.tsx`)
Classic `<Routes>/<Route>` tree (react-router-dom v7), no code splitting.

```
/                 → redirect /login
/login            → UnifiedLogin
/saas-admin/login → UnifiedLogin (same component)
/register         → CustomerRegister
/inventory        → PublicInventory

/saas-admin/*  (AdminRoute) → dashboard, companies, system-docs, activities, settings
/workspace/*   (AdminRoute) → dashboard, customers(+:id), suppliers(+:id), products, enquiries,
                                quotes(+:id), invoices(+:id), payment-receipts,
                                users, settings, notifications, customers/import, attendance
/admin, /staff → redirect to /workspace   (legacy compat)

/portal        (CustomerRoute)
  /portal            → PortalRedirect (derives company slug, redirects to /portal/:slug/dashboard)
  /portal/:company/* → dashboard, products, request-form, enquiries, quotes, invoices, profile, notifications

*  → NotFound
```

**⚠ Divergence #1:** README.md's architecture diagram says the Platform Portal lives at `/platform/*`. The actual, live route prefix is **`/saas-admin/*`**. Trust the code, not the diagram.

`AdminLayout` is reused as the shell for all three authenticated domains (including the customer portal); `CustomerLayout.tsx` exists but appears unused in the current router — verify before deleting.

### 4.3 State management
- **`useAuthStore`** (zustand, manual localStorage persistence, no `persist` middleware): holds `admin`, `customer`, `adminToken`, `customerToken`. Separate localStorage keys: `zeronix_admin_token`, `zeronix_staff_token`, `zeronix_customer_portal_token`. `setAdmin` routes the token into the right key based on role and clears the other — prevents stale cross-role sessions. No explicit tenant/company object in the store; tenancy is implicit in `admin.role`/`admin.company_id` from the API.
- **React Query**: `staleTime: 30s`, `gcTime: 5min`, `retry: 1`, `refetchOnWindowFocus: false`. No persistence plugin.
- **`hooks/useApi.ts`** — a **generic, resource-name-driven** CRUD hook factory (there are no per-entity files like `useCustomers.ts`):
  - `useResourceList<T>(resource, params)` → `GET /admin/{resource}`
  - `useResourceDetail<T>(resource, id)` → `GET /admin/{resource}/{id}`
  - `useResourceMutation(resource, extraKeys)` → `{ create, update, remove, bulkUpdate }`, auto-invalidates queries + fires `sonner` toasts
  - `usePublicResourceList<T>(resource, params)` → `GET /public/{resource}`
  - Consumed directly and via `components/shared/ResourceListingPage.tsx` (used by 11 pages).
- Other stores: `useCartStore` (RFQ cart), `useSidebarStore`, `useThemeStore`, `useBreadcrumbStore`.

### 4.4 API/HTTP layer (`lib/axios.ts`)
- `baseURL` = `VITE_API_BASE_URL` or `http://localhost:8000/api`; `withCredentials: true`.
- **Request interceptor**: rewrites `/workspace/` and `/saas-admin/` → `/admin/` (both frontend domains hit the same Laravel `/admin/*` routes; role is carried by the token, not the URL). Strips `Content-Type` for `FormData`. Token selection is **route-pattern based**: `/customer/` → customer token; `/admin/` → admin token falling back to staff token.
- **Response interceptor**: on successful `/admin/*` or `/customer/*` calls, refetches `['unread-notifications', role]` — keeps notification badges live without polling.
- No global 401 interceptor on the axios instance; session-expiry handling lives in `App.tsx`'s `initAuth()` effect and `ProtectedRoute`'s redirect-on-null-user behavior.

### 4.5 Auth & RBAC on the frontend
`components/auth/ProtectedRoute.tsx`:
- **`AdminRoute`** — redirects unauthenticated users appropriately; bounces `super_admin` away from `/workspace/*` to `/saas-admin/dashboard` and non-super-admins away from `/saas-admin/*` to `/workspace/dashboard`. For regular staff inside `/workspace/*`, gates by path segment against a hardcoded `publicModules` allowlist (`dashboard, settings, profile, notifications`), a hardcoded `adminOnlyModules` blocklist (`users, activities, companies, system-docs`), and otherwise requires `admin.permissions.includes(path)`.
- **`CustomerRoute`** — redirects if no `customer` or `customer.is_portal_active === false`.
- `Sidebar.tsx` builds nav per role (`getSuperAdminNavGroups`, `getTenantAdminNavGroups`, `getTenantStaffNavGroups` — filtered by `permissions`, `getCustomerNavGroups` — parameterized by company slug). Nav groups are `{ label, items }`; the tenant-admin sidebar groups are Overview / Management / Operations / **Workforce** (Attendance) / System.

**Reminder:** this permission gating is UX only — the backend does not re-check `permissions` server-side (§3.6). Do not treat frontend route guards as a security boundary.

### 4.6 Mock data status
`lib/mockData.ts` exists but every exported array is empty and **nothing imports it** anywhere in `frontend/src` (verified by repo-wide grep). All business pages (Customers, Enquiries, Quotes, Invoices, Products, Suppliers, Dashboard, Attendance) are fully wired to live `react-query` + `axios` calls against the Laravel API — that migration is complete.

### 4.7 Design system
Tailwind v4 CSS-first config in `src/index.css` — three coexisting token layers: `--brand-*` (current design system), legacy `--admin-*` (kept for "graceful degradation" during an apparent in-progress token migration), and shadcn-standard HSL tokens (`--background`, `--primary`, etc. for `components/ui/*`). Brand accent violet `#8B5CF6`. Mobile-specific CSS (16px inputs to prevent iOS zoom, safe-area padding) supports `MobileBottomNav.tsx`.

### 4.8 Multi-tenancy on the frontend
No subdomain/URL-based tenant routing for staff — tenancy is implicit in the logged-in user's identity (role + server-side `company_id` scoping). For the customer portal, `/portal/:company/*` uses a client-derived slug (`customer.company.toLowerCase().replace(/\s+/g,'-')`) purely for routing/display; actual authorization is enforced server-side via the bearer token, not the URL slug.

### 4.9 Testing
No test infrastructure exists (`package.json` has zero test-related devDependencies; no `.test.`/`.spec.` files anywhere). Correctness currently rests on TypeScript's compiler plus manual QA.

---

## 5. Cross-cutting notes on legacy migration

The codebase shows clear signs of a recent, still-partial rename/restructure:
- `/admin` + `/staff` → `/workspace` (frontend redirects + `zeronix_staff_token` legacy key + `useAuthStore`'s path-based hydration branch)
- `--admin-*` CSS tokens kept alongside new `--brand-*` tokens
- `CustomerLayout.tsx` may be dead code post-consolidation onto `AdminLayout`
- Multi-tenancy (`companies` + `company_id`) was retrofitted onto a pre-existing single-tenant schema on 2026-06-16 — the newest work in the repo

Treat any of the above as **in-flight cleanup opportunities**, not accidents to "fix" without checking git history/blame first.

---

## 6. Documented divergences from existing planning docs

| Doc claim | Reality |
|---|---|
| Platform Portal at `/platform/*` (README) | Actual prefix is `/saas-admin/*` |
| Quotes/Invoices/Customers "still mock data" (ROADMAP) | Fully live API-backed; `mockData.ts` is dead code, zero imports |
| `ZRNX-QT`/`ZRNX-INV` code prefixes implied | Only `Customer` uses `ZRNX-CUS-...`; Quote/Invoice use plain `QT-`/(likely)`INV-` prefixes, generated ad hoc in controllers, not models |
| Backend layered via Requests/Resources/Middleware (implied by "strictly enforced API Resources" in README) | No such directories exist; all validation/serialization is inline in controllers |
| React 18 (README) | Actual: React 19.2.5 |
| Tailwind config file-based | Actual: Tailwind v4 CSS-first, no `tailwind.config.js` |

---

## 7. Missing documentation identified

1. No API reference (Postman/OpenAPI) for `routes/api.php` — 30+ controllers, no generated docs.
2. No ER diagram existed prior to this file (see `ARCHITECTURE.md`).
3. No onboarding doc for setting up a fresh dev environment given `.env.example` gaps (Pusher, IMAP, FRONTEND_URL).
4. No documented policy on when to use `Policy` classes vs inline role checks (currently inconsistent).
5. No test-writing guide/expectations, since no tests exist to model from.
