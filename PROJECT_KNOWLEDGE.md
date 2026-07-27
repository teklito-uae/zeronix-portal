# Zeronix Portal — Project Knowledge Base

> **Status:** Canonical, code-verified reference. Originally generated 2026-07-05 by direct inspection of the codebase (not from planning docs); **re-verified and updated 2026-07-27** after a run of 24 commits that added a full CRM/ERP layer (Leads, Companies/Contacts, Deals Kanban, Sales Orders, Deliveries, Purchasing, Inventory, Expenses, Reports, Marketing Automation) on top of the original quote/invoice CRM. Where older docs (`README.md`) disagree with this file, **this file is correct**.
>
> **2026-07-27 update — major expansion:** The product grew from a straight CRM (Customer → Enquiry → Quote → Invoice) into a fuller CRM/ERP: **Leads** were split out from Customers as a separate pre-conversion entity; **Customer** was renamed **Company** in the UI/permissions layer (with a new first-class **Contacts** sub-entity replacing "the customer as a single contact"); **Enquiry was merged into a new `Deal` model** (Kanban pipeline, drag-and-drop via dnd-kit) — the standalone `deals` table that briefly existed was dropped again in favor of pointing `Deal` at the original `enquiries` table; the Quote→Invoice flow grew a **Sales Order → Delivery** stage in between; a full **Purchasing** module (Purchase Bills, Supplier Payment Receipts, stock movements) and **Expenses**/**Reports** modules were added; and a **Marketing Automation** module (campaigns, templates, segments, suppressions, SMTP accounts, open/click tracking) was added wholesale. **Google Contacts sync** (OAuth) and **VCF/CSV/JSON lead import** were added for populating Leads. The public unauthenticated RFQ/inventory page was removed — Leads are now staff-created only.

---

## 1. What this project is

Zeronix Portal is a **multi-tenant B2B CRM/ERP platform** for an IT reseller/wholesale business model (capture lead → convert to company/contact → work a deal → quote → sales order → deliver → invoice → collect payment), plus a purchasing side (supplier → purchase bill → pay) and a marketing automation side (segment → campaign → track). It serves three distinct audiences from one Laravel API + one React SPA:

| Domain | Frontend URL prefix | Audience |
|---|---|---|
| Platform Portal | **`/saas-admin/*`** (not `/platform/*` — see Divergence #1) | Super Admin (platform owner) |
| Tenant Workspace | `/workspace/*` (legacy `/admin`, `/staff` redirect here) | Internal staff: admin, salesman, staff roles |
| Customer Portal | `/portal/:company/*` | External customers of a tenant |

Single shared codebase, single database, single deployed API — tenancy is a **data-scoping concern** (row-level, via `company_id`), not separate infrastructure per tenant.

**Note:** the previously-documented public unauthenticated `/inventory` RFQ landing page has been **removed**. Public self-service is now limited to `POST /public/register-company` (tenant onboarding) — Leads are created only by staff (manually, via CSV/VCF import, or via Google Contacts sync), not by anonymous website visitors.

---

## 2. Technology stack (re-verified 2026-07-27)

### Backend — `backend/`
- **Laravel 11**, PHP `^8.2`
- **laravel/sanctum ^4.0** — bearer-token API auth
- **barryvdh/laravel-dompdf ^3.1** — quote/invoice/receipt/purchase-bill PDF rendering
- **pusher/pusher-php-server**, **webklex/laravel-imap** — still present in composer.json, still unused (dead weight left over from the removed Chat module)
- New: Google OAuth client usage inside a custom `App\Services\GoogleOAuthService` (Google Contacts sync — see §3.10)
- Dev: PHPUnit 10.5, Pint, Sail, Faker, Mockery — present but essentially unused (see §9 Testing)
- **Not present:** spatie/laravel-permission, laravel/passport, maatwebsite/excel, laravel/horizon, any multi-tenancy package (tenancy is hand-rolled)

### Frontend — `frontend/`
- **React 19.2.5**, **TypeScript 6.0.3**, **Vite 8.0.9**, **react-router-dom 7.14**
- **Tailwind CSS v4.2.4** — CSS-first config, no `tailwind.config.js`
- **@tanstack/react-query 5.99**, **@tanstack/react-table 8.21**
- **New: `@tanstack/react-virtual` (^3.14.8)** — virtualization for the Deals Kanban board
- **New: `@dnd-kit/core` `@dnd-kit/sortable` `@dnd-kit/utilities`** — drag-and-drop for the Deals Kanban board
- **New: `react-hook-form` + `@hookform/resolvers` + `zod`** — the app finally has a form library (previously all forms were hand-rolled local state; this is now mixed, not yet fully migrated — check the specific page)
- **New: `@tiptap/*`** (starter-kit, react, extension-image/link/text-align/underline) — rich text editor, used by the Marketing template editor and the new Quote/Invoice split-view document editor
- **New: `react-hook-form`-adjacent libs `libphonenumber-js` + `react-phone-number-input`, `date-fns`, `framer-motion`, `boring-avatars`, `react-icons`**
- zustand 5.0, axios 1.15, Radix UI + shadcn/ui pattern, recharts 3.8, sonner (toasts), cmdk — unchanged
- **laravel-echo + pusher-js** — still present in package.json but still unused (dead weight from the removed Chat module)
- **No test runner** declared (no vitest/jest/playwright/testing-library)

---

## 3. Backend architecture

### 3.1 Folder shape (actual, not layered by the book)
```
backend/app/
  Console/Commands/    QuoteFollowupNotification, marketing:tick (campaign send worker)
  Helpers/              NumberHelper (amount-to-words for PDFs)
  Http/Controllers/     flat controllers, ~50 files — see full list in §3.1a
  Jobs/                 SyncGoogleContactsJob (new — Jobs/ directory now exists)
  Mail/                 InvoiceMail, PaymentReceiptMail, QuoteMail, WelcomeCustomerMail
  Models/               41 files, flat — see §3.4
  Notifications/        AdminNotification, SystemNotification
  Policies/             CustomerPolicy, EnquiryPolicy, InvoicePolicy, QuotePolicy, UserPolicy
  Providers/             AppServiceProvider only (Laravel 11 style, no RouteServiceProvider)
  Services/              DashboardService, MailConfigService, GoogleOAuthService, ContactFileParserService
  Traits/                BelongsToCompany, HasUserScope, LogsActivity
```
**Correction to prior doc:** `bootstrap/app.php` is **no longer empty**. It now registers:
- `withSchedule()` — the actual home of the cron schedule (see §3.7)
- `withMiddleware()` — overrides `redirectGuestsTo(fn () => null)`, because this is a pure JSON API with no login route, and Laravel's default guest-redirect throws `RouteNotFoundException` before an `AuthenticationException` can even be constructed
- `withExceptions()` — renders `Illuminate\Auth\AuthenticationException` as `response()->json(['message' => 'Unauthenticated.'], 401)` instead of a redirect/HTML error page

There is still **no** `Http/Middleware/`, `Http/Requests/`, or `Http/Resources/` directory, and no `Listeners/`. All validation is still inline `$request->validate()`; all JSON shaping is still inline `response()->json()`.

There is still **no Platform/Workspace/Portal controller namespace split** — the three-domain concept exists only at the route-prefix level and in frontend page folders.

### 3.1a Controllers (current full list)
`ActivityController`, `AdminAuthController`, `AttendanceController`, `BrandController`, `CategoryController`, **`CompanyController`**, `Customer/` subfolder (`DashboardController`, `EnquiryController`, `InvoiceController`, `NotificationController`, `ProductController`, `ProfileController`, `QuoteController`), `CustomerAuthController`, **`CustomerContactController`**, `CustomerController`, `CustomerImportController`, `CustomerLabelController`, `DashboardController`, **`DealController`**, **`DeliveryController`**, `DocumentController`, **`ExpenseController`**, **`GoogleContactsController`**, `InvoiceController`, **`LeadController`**, **`LeadImportController`**, **`MarketingActivityController`**, **`MarketingCampaignController`**, **`MarketingDashboardController`**, **`MarketingQueueController`**, **`MarketingReportController`**, **`MarketingSegmentController`**, **`MarketingSettingsController`**, **`MarketingSmtpAccountController`**, **`MarketingSuppressionController`**, **`MarketingTemplateController`**, **`MarketingTrackingController`**, `NotificationController`, `PaymentReceiptController`, `PlatformController`, `ProductController`, **`PurchaseBillController`**, `QuoteController`, **`ReportController`**, **`SalesOrderController`**, `StickyNoteController`, `SupplierController`, **`SupplierPaymentReceiptController`**, `SupplierProductController`, `TagController`, `TaskController`, `TemplateController`, `UserController`, `WorkspaceSettingsController`.

Notably, `App\Http\Controllers\Customer\EnquiryController` (the customer-portal-facing controller behind `/customer/enquiries`) still exists under its old name but now imports and operates on `App\Models\Deal`/`DealItem` internally — the customer portal's "Enquiries" tab is really reading/writing Deal pipeline rows.

### 3.2 Routes (`backend/routes/api.php`, ~475 lines)
- **`/customer/*`** — public `register`/`login`, then `auth:sanctum`: dashboard, logout, user, products, categories, `enquiries` (backed by `Customer\EnquiryController` → `Deal` model), profile/request-update, invoices (+confirm-delivery/download/view), quotes (+update-status/download/view), notifications, `settings/workspace`.
- **`throttle:public`** — portal quote/invoice view+download by number, legacy admin invoice/quote/receipt view/download by id, `POST /public/register-company` (tenant self-onboarding — the only remaining anonymous write endpoint), marketing tracking pixels/links (`/m/o/{token}`, `/m/c/{token}/{link}`, `/m/u/{token}`). **The old public RFQ/inventory routes are gone.**
- **Shared `admin`/`staff` `auth:sanctum` loop** — now much larger. In addition to the original dashboard/customers/companies/customer-labels/quotes/invoices/products/suppliers/users/notifications/attendance/tasks/sticky-notes set, it now also carries:
  - **`leads`** — CRUD + `/leads/{lead}/convert`
  - **`deals`** — `/deals/pipeline`, `/deals/pipeline/stats`, CRUD, `/move`, `/assign`, `/activities`, `/attachments`, `/contacts/{contact}` attach/detach, `/tags` attach/detach, `/timeline`
  - **`customers/{customer}/contacts`** (nested) + top-level `/contacts`, `/contacts/departments`, `/contacts/{contact}/activities`, `/tags`, `/attachments`
  - **`sales-orders`** — index/store/show/destroy + next-number, view/download, `convert-to-delivery`
  - **`deliveries`** — index/store/show/destroy + next-number, view/download, `mark-delivered`, `convert-to-invoice`
  - **`purchase-bills`** — CRUD + next-number, view/download, quick-update, duplicate, attachments
  - **`expenses`** — CRUD
  - **`reports`** — `/sales`, `/sales-by-staff`, `/receivables-aging`, `/crm-dashboard`, `/enquiries-by-source`, `/pipeline-summary`
  - **`marketing/*`** — dashboard, campaigns (CRUD + audience-preview, launch/pause/resume/cancel/duplicate/test-send, recipients + import), templates (CRUD + preview/duplicate/test-send/versions/restore), segments (CRUD + preview), suppressions (index/store/destroy), queue (index/retry/cancel), reports (overview/trends/campaign), activity
  - Quotes/invoices also grew: `convert-to-sales-order` (quotes), `convert-to-delivery` / `convert-to-sales-order` (invoices), quick-update, duplicate, attachments
- **`/admin/*`-only additions**: `POST /admin/login`; **`GET /admin/google-contacts/callback`** (deliberately **outside** `auth:sanctum` — see §3.10) then a sanctum group with the rest of Google Contacts (connect/status/sync/disconnect), **lead import** (preview/commit + `leads/bulk-update`), customer-import preview/commit, supplier-products update, users CRUD + SMTP settings/test-email, activity logs, `platform/stats`, `attendance/report`, payment-receipts, **`supplier-payment-receipts`**, **`reports/profit-loss`** (admin-only, cost/margin data), templates, workspace settings, **marketing admin** (SMTP accounts CRUD+test, settings), company approve/reject/suspend (tenant lifecycle).

### 3.3 Database schema (chronological highlights)
Original core tables unchanged: `users`, `customers`, `brands`, `suppliers`, `categories`, `enquiries` (+ `enquiry_items`), `products`, `quotes`/`quote_items`, `invoices`/`invoice_items`, `supplier_*`, `personal_access_tokens`, `activity_logs`, `templates`, `payment_receipts`, `notifications`, `customer_labels` (+ pivot), `attendances`, `staff_points`, `tasks`, `sticky_notes`, `companies` (tenant root, added 2026-06-16), and pivots `customer_user` / `enquiry_user`.

**New tables added 2026-07-05 through 2026-07-27:**
- **Purchasing/inventory/expenses:** `purchase_bills`, `purchase_bill_items`, `supplier_payment_receipts`, `expenses`; `products` gained `sku` + `stock_quantity`; `stock_movements` is a simple ledger table (`product_id, quantity, movement_type, reference_type, reference_id, user_id`) — there is **no dedicated "inventory item" table**, stock tracking is just a counter column plus this movement log.
- **Leads/CRM redesign:** `leads`, `customer_contacts`, `contact_activities`, `sales_orders`/`sales_order_items`, `deliveries`/`delivery_items`; `enquiries`/`quotes`/`invoices` gained a `contact_id`/`lead_id` column; invoice statuses were remapped to a workflow enum; `deliveries` gained an `invoice_id` (bill-first delivery flow) and `invoices` had its old inline delivery-tracking fields dropped in favor of the new `deliveries` table.
- **Marketing:** `marketing_settings`, `marketing_smtp_accounts`, `marketing_templates`/`marketing_template_versions`, `marketing_segments`, `marketing_campaigns`, `marketing_campaign_recipients`, `marketing_suppressions`, `marketing_events`.
- **Companies/Contacts/Deals/Tags redesign:** `tags` + polymorphic `taggables`; `deal_activities`; a standalone `deals` table was created 2026-07-22 **then dropped 2026-07-26** — see next paragraph; `google_contact_connections`; `customers` gained profile fields (industry, address, description, website) as it took on more of a "Company" identity; `users.permissions` strings were migrated from `customers.*` to `companies.*`.

**Important schema quirk — "Deal" is not a real table.** A standalone `deals` table was briefly created (2026-07-22), then two migrations (`merge_deals_into_enquiries`, `repoint_deal_foreign_keys_to_enquiries`) folded its data and FKs back onto the pre-existing `enquiries` table, and a final migration (`drop_old_deals_table`) dropped the standalone table. **`App\Models\Deal` is now an Eloquent model with `protected $table = 'enquiries'`** — it's an alias/rename of the original Enquiry concept, not a new physical entity. `App\Models\Enquiry` **no longer exists** as a model. Relations that look like they point at "deals" (`DealItem`, `enquiry_items`, the `enquiry_user` pivot) are still physically named after `enquiry`/`enquiries` in the database — only the model-layer name changed.

**Multi-tenancy root:** unchanged — `companies` table, `company_id` FK scoping via `BelongsToCompany`.

### 3.4 Key models & relationships (current — 41 model files)
Full list: `ActivityLog`, `Attendance`, `Brand`, `Category`, `Company`, `ContactActivity`, `Customer`, `CustomerContact`, `CustomerLabel`, `Deal`, `DealActivity`, `DealItem`, `Delivery`, `DeliveryItem`, `Expense`, `GoogleContactConnection`, `Invoice`, `InvoiceItem`, `Lead`, `MarketingCampaign`, `MarketingCampaignRecipient`, `MarketingEvent`, `MarketingSegment`, `MarketingSetting`, `MarketingSmtpAccount`, `MarketingSuppression`, `MarketingTemplate`, `MarketingTemplateVersion`, `PaymentReceipt`, `Product`, `PurchaseBill`, `PurchaseBillItem`, `Quote`, `QuoteItem`, `SalesOrder`, `SalesOrderItem`, `StaffPoint`, `StickyNote`, `StockMovement`, `Supplier`, `SupplierBroadcast`, `SupplierPaymentReceipt`, `SupplierPriceHistory`, `SupplierProduct`, `Tag`, `Task`, `Template`, `User`.

- **`User`** — unchanged core (Sanctum, role, permissions JSON, SMTP/IMAP creds), now also gained `manager_id` and `avatar_color`.
- **`Customer`** — still the customer-portal `Authenticatable`, but now functions more like a "Company account" in the UI: gained `company_id` (own field, distinct from tenant `Company`), `is_company_admin`, `industry`, `website`, `description`, and a large set of **appended, computed (not stored) balance/analytics fields**: `outstanding_balance`, `overdue_invoices_count/value`, `total_invoiced`, `total_volume`, `open_deals_count/value`, `open_quotes_count/value`, `open_invoices_count/value`. Relations now include `deals` (→ Deal), `salesOrders`, `contacts`/`activeContacts`/`primaryContact` (→ CustomerContact).
- **`Lead`** — new. Pre-conversion entity: `lead_code` (auto `ZRNX-LD-...`), `name, company, email, phone, phone_2, source, status, notes, user_id, converted_customer_id, converted_at, external_id, synced_at` (the last two support Google Contacts sync). `hasMany` `deals`; `convertedCustomer` → Customer; `assigned_users` pivot (`lead_user`).
- **`Deal`** (`$table = 'enquiries'`) — see the schema quirk above. Fillable includes `customer_id, lead_id, customer_contact_id, user_id, source, priority, status, title, value, stage, expected_close_date, closed_at, lost_reason, probability, deal_code, position, next_action_at`. `deal_code` auto-generated `ZRNX-DL-YYYYMMDD-NNN`. Relations: `customer`, `customerContact`/`primaryContact`, `lead`, `assigned_users` (pivot physically `enquiry_user`), `items` (→ `DealItem`, physically `enquiry_items`), `quotes`, `activities` (→ `DealActivity`), `additionalContacts` (pivot `deal_contacts`), `tags` (morphToMany via `taggables`).
- **`CustomerContact`** — new. A customer can now have multiple named contacts (`first_name, last_name, designation, department, email, phone, is_primary, is_active`), replacing the old "customer record = one contact" assumption. Auto-computes `full_name`, enforces a single `is_primary` per customer.
- **`SalesOrder`** / **`SalesOrderItem`** — new middle stage between Quote and Delivery/Invoice. `order_number, customer_id, customer_contact_id, deal_id, quote_id, user_id, status, subtotal, vat_amount, total`.
- **`Delivery`** / **`DeliveryItem`** — new. `delivery_number, customer_id, sales_order_id, invoice_id, delivered_by, status, customer_confirmation, customer_confirmed_at`. Supports both order-first (`sales_order_id`) and bill-first (`invoice_id`, i.e. delivery generated straight from an Invoice) flows.
- **`PurchaseBill`** / **`PurchaseBillItem`** — new. Mirrors Invoice on the buy side: `bill_number, supplier_id, subtotal, vat_amount, total, status, discount_percent, shipping_amount, tags, attachments`; appends `amount_paid`/`balance` computed from `SupplierPaymentReceipt`.
- **`SupplierPaymentReceipt`** — new, mirrors `PaymentReceipt` for the buy side.
- **`StockMovement`** — new, simple ledger (`product_id, quantity, movement_type, reference_type, reference_id`). `Product` gained `sku`, `stock_quantity`, and an appended `is_low_stock` flag (`stock_quantity <= 5`).
- **`Expense`** — new, simple record (`category, amount, date, paid_via, notes, user_id`).
- **`Tag`** — new, polymorphic (`taggables` pivot) shared across Deals/Contacts/etc.
- **`GoogleContactConnection`** — new, one per tenant/user pair: OAuth tokens, `sync_status`, `consecutive_failures`, `last_error`, `google_account_email`.
- **`MarketingCampaign`** and friends (`MarketingCampaignRecipient`, `MarketingTemplate`/`Version`, `MarketingSegment`, `MarketingSmtpAccount`, `MarketingSetting`, `MarketingSuppression`, `MarketingEvent`) — a full self-contained email-campaign subsystem: campaign → template + smtp account + segment/audience config → recipients, with counters (`sent_count, delivered_count, opened_count, clicked_count, bounced_count, unsubscribed_count`, etc.) recalculated by `recalcStatusCounters()` and driven by the `marketing:tick` scheduled command + `MarketingQueueController`.
- **`Quote`** / **`Invoice`** — same ad hoc controller-side numbering as before, but both gained `tags`, `attachments`, discount fields on line items, "editor fields" (supporting the new Tiptap-based split-view document editor), and conversion methods (`convert-to-sales-order`, `convert-to-delivery`).
- **`Company`** — unchanged as the tenant root model; gained `industry`, `address`, `settings` (JSON).

Consistent trait stack across tenant-scoped models remains: **`BelongsToCompany`** + **`HasUserScope`** + **`LogsActivity`**.

### 3.5 Multi-tenancy mechanism
Unchanged from prior doc — `BelongsToCompany` global scope on `company_id`, super_admin bypass, `HasUserScope` for per-salesman row visibility within a tenant. Still single-database, shared-schema, row-level multi-tenancy.

### 3.6 Auth & authorization
Unchanged mechanism (Sanctum bearer tokens, inline role-string checks, a handful of Policy classes, frontend-only `permissions` JSON enforcement — still not re-checked server-side). One naming change: `users.permissions` strings that used to reference `customers.*` were migrated to `companies.*` (migration `rename_customers_to_companies_in_user_permissions`), reflecting the Customer→Company rename in the UI.

### 3.7 Business logic services
- **`DocumentController`** — unchanged token-replacement PDF hub, now also renders Sales Orders, Deliveries, and Purchase Bills through the same template mechanism.
- **`MailConfigService`** — unchanged "send as yourself" per-staff SMTP design.
- **`DashboardService`** — unchanged core, joined by **`ReportController`** (sales/receivables-aging/CRM-dashboard/pipeline-summary/profit-loss reports) and **`MarketingDashboardController`**/**`MarketingReportController`** for the new modules' analytics.
- **`GoogleOAuthService`** — new. Builds the Google authorization URL, exchanges auth codes for tokens, used exclusively by `GoogleContactsController`.
- **`ContactFileParserService`** — new. Parses VCF/CSV (and likely JSON) contact exports for `LeadImportController`'s bulk lead import.
- **Scheduled commands — now defined in `bootstrap/app.php`'s `withSchedule()`, not `routes/console.php`:**
  - `quotes:notify-followup` — hourly (unchanged from before).
  - **`marketing:tick`** — every minute, `withoutOverlapping()` — drives campaign sending.
  - **`queue:work --stop-when-empty --max-time=50 --tries=3`** — every minute, `withoutOverlapping()` — because shared hosting has no persistent queue daemon, the scheduler itself drains the DB queue each tick (this is how `SyncGoogleContactsJob` and marketing send jobs actually get processed).
- `NumberHelper::toWords()` — unchanged.

### 3.8 Config gaps
Unchanged: `.env.example` still missing `PUSHER_*`, `FRONTEND_URL`, `MAIL_EHLO_DOMAIN`, IMAP vars, and now also missing Google OAuth client id/secret vars needed by `GoogleOAuthService`. `config('zeronix.default_per_page', 15)` reference still dead (no `config/zeronix.php`).

### 3.9 Testing
Unchanged — `backend/tests/` still only has the default Laravel skeleton. No coverage of any of the new Lead/Deal/SalesOrder/Delivery/PurchaseBill/Marketing flows.

### 3.10 Google Contacts integration (new)
`GoogleContactsController`, backed by `GoogleOAuthService`, `SyncGoogleContactsJob`, and the `GoogleContactConnection` model.
- `GET /admin/google-contacts/connect` (sanctum) — builds an **encrypted `state` payload** (`company_id`, `user_id`, nonce, 10-min expiry) and returns Google's OAuth `auth_url`.
- **`GET /admin/google-contacts/callback` is deliberately outside `auth:sanctum`** — Google's redirect is a bare browser navigation carrying no Bearer token, so identity/CSRF protection travels inside the encrypted `state` param instead of the auth middleware. Decrypts state, validates expiry, exchanges the code, upserts a `GoogleContactConnection` (bypassing the tenant global scope by design, since there's no authenticated request context), dispatches `SyncGoogleContactsJob`, redirects to `{FRONTEND_URL}/workspace/settings?google=connected` (or `denied`/`expired`/`error`/`state_mismatch`).
- `GET /admin/google-contacts/status` — connection state + count of pending unreviewed Leads (`source = 'google_contacts' AND status = 'new'`).
- `POST /admin/google-contacts/sync` (throttled 1/min) — re-dispatches the sync job.
- `POST /admin/google-contacts/disconnect`.

Separately, **`LeadImportController` + `ContactFileParserService`** handle one-off VCF/CSV bulk lead import (`/admin/leads/import/preview`, `/admin/leads/import/commit`) — distinct from the live Google sync, surfaced at `/workspace/leads/import`.

---

## 4. Frontend architecture

### 4.1 Folder shape (`frontend/src`)
```
App.tsx                     single router entry, all pages eagerly imported (no lazy loading)
components/
  auth/ProtectedRoute.tsx   AdminRoute + CustomerRoute guards
  layout/                   AdminLayout, Sidebar (now: CRM/Sales/Purchasing/Marketing/Insights/
                             Workforce/System groups), Topbar, GlobalSearch, MobileBottomNav
  shared/                   ~20 generic building blocks (DataTable, ResourceListingPage, ...)
  ui/                       shadcn/ui primitives
hooks/                      useApi.ts, useBasePath.ts, useBreadcrumb.ts (unchanged)
lib/                        axios.ts, queryClient.ts, mockData.ts (still dead code)
pages/
  UnifiedLogin.tsx, NotFound.tsx        (no more public/Inventory.tsx — removed)
  platform/                 unchanged (PlatformDashboard, TenantManagement, SystemDocs,
                             GlobalActivities, PlatformSettings)
  workspace/                see §4.1a — grew substantially
  portal/                   unchanged (CustomerDashboard, CustomerProducts, CustomerEnquiries,
                             CustomerQuotes, CustomerInvoices, CustomerProfile,
                             CustomerNotifications, Register, RequestForm)
store/                      useAuthStore, useCartStore, useSidebarStore, useThemeStore,
                             useBreadcrumbStore
types/index.ts
```

### 4.1a `pages/workspace/` (current — substantially expanded)
Root files: `AttendanceReport, Calendar, Companies, CompanyImport, CompanyProfile, Contacts, Dashboard, Deliveries, DeliveriesSplitView, DeliveryDetail, Expenses, InvoiceDetail, Invoices, InvoicesSplitView, LeadImport, Leads, Notifications, PaymentReceiptDetail, PaymentReceipts, PaymentReceiptsSplitView, PaymentsMade, Products, PurchaseBillDetail, Purchases, PurchasesSplitView, QuoteDetail, Quotes, QuotesSplitView, Reports, SalesOrderDetail, SalesOrders, Settings, SupplierProfile, Suppliers, Users`.

Sub-folders: `deals/DealsPage.tsx` (the Kanban board — single file); `marketing/` (11 files: dashboard, campaigns list/detail/wizard, templates list/editor, segments, suppressions, queue, reports, activity); `settings/DocumentDesigner.tsx` + `GoogleContactsSettings.tsx`.

**⚠ Dead code note:** `Purchases.tsx`, `Invoices.tsx`, `Quotes.tsx`, `PaymentReceipts.tsx`, `Deliveries.tsx` (the plain, non-`SplitView` versions) still exist in the tree but **App.tsx now routes to their `*SplitView` counterparts instead** — these older files look orphaned and are candidates for deletion, but verify via git blame before removing (may still be referenced by something not yet migrated).

### 4.2 Routing (`App.tsx`)
Still classic `<Routes>/<Route>` tree (react-router-dom v7), no code splitting.

```
/                 → redirect /login
/login, /saas-admin/login → UnifiedLogin
/register         → CustomerRegister
(no /inventory route — removed)

/saas-admin/*  (AdminRoute) → dashboard, companies, system-docs, activities, settings

/workspace/*   (AdminRoute) → dashboard, leads, leads/import, companies(+/:id), contacts,
                                customers → redirect to companies, customers/:id → redirect,
                                customers/import → redirect, companies/import,
                                suppliers(+:id), products, deals, calendar,
                                quotes → QuotesSplitView (+/:id),
                                sales-orders(+/:id),
                                deliveries → DeliveriesSplitView (+/:id),
                                invoices → InvoicesSplitView (+/:id),
                                payment-receipts → PaymentReceiptsSplitView,
                                purchases → PurchasesSplitView (+/:id),
                                expenses, reports, users, settings, notifications, attendance,
                                marketing/{dashboard,campaigns(+new,:id,:id/edit),templates(+new,:id/edit),
                                           segments,suppressions,queue,activity,reports,settings}

/admin, /staff → redirect to /workspace   (legacy compat, unchanged)

/portal/:company/* (CustomerRoute) → dashboard, products, request-form, enquiries, quotes,
                                       invoices, profile, notifications   (unchanged)

*  → NotFound
```

**⚠ Divergence #1 (still applies):** Platform Portal's real prefix is `/saas-admin/*`, not `/platform/*`.

**New divergence:** the old doc's "Customers" module is now "Companies" in both the sidebar and routes (`/workspace/customers` and `/workspace/customers/:id` are kept only as redirects to `/workspace/companies` / `/companies/:id` for back-compat).

### 4.3 State management
Unchanged core (`useAuthStore`, React Query defaults, `useApi.ts`'s generic resource-driven CRUD hooks, `ResourceListingPage`). The generic `useResourceList/useResourceDetail/useResourceMutation` pattern from `useApi.ts` is still how most of the new modules (Leads, Deals, Sales Orders, Deliveries, Purchase Bills, Expenses) are wired — no per-entity hook files were introduced despite the module growth.

### 4.4 API/HTTP layer (`lib/axios.ts`)
Unchanged (`/workspace/` and `/saas-admin/` both rewritten to `/admin/` server-side; FormData handling; route-pattern token selection; notification refetch on success; no global 401 interceptor).

### 4.5 Auth & RBAC on the frontend
Unchanged mechanism (`ProtectedRoute.tsx`'s `AdminRoute`/`CustomerRoute`, `Sidebar.tsx`'s per-role nav builders). Still UX-only — not re-checked server-side (§3.6).

**Sidebar nav groups changed significantly.** Current `getTenantAdminNavGroups`:
- **Overview**
- **CRM** ("Lead → Account → Deal"): Leads, Companies, Contacts, Deals, Calendar
- **Sales** ("Quote → Order → Delivery → Invoice → Receipt"): Quotes, Sales Orders, Deliveries, Invoices, Payment Receipts
- **Purchasing**: Suppliers, Purchases, Expenses, Payments Made
- **Management**: Products, Team
- **Marketing**: single "Marketing" entry → `marketing/dashboard`
- **Insights**: Reports
- **Workforce**: Attendance
- **System**: Settings

(Super Admin groups unchanged: Overview / Platform Management / System.)

### 4.6 Mock data status
Unchanged — `lib/mockData.ts` still dead code, still zero imports.

### 4.7 Design system
Unchanged three-token-layer setup (`--brand-*` / legacy `--admin-*` / shadcn HSL tokens). `MobileBottomNav` colors were unified onto the `--brand-*` tokens in commit `5827421` (previously mixed).

### 4.8 Multi-tenancy on the frontend
Unchanged.

### 4.9 Testing
Unchanged — still zero frontend test infrastructure.

---

## 5. Cross-cutting notes on legacy migration

- `/admin` + `/staff` → `/workspace` (unchanged, in-flight)
- `--admin-*` CSS tokens alongside `--brand-*` (unchanged, in-flight)
- **New in-flight rename: `Customer` → `Company`** at the UI/permissions layer — the underlying `customers` table and `Customer` model/Authenticatable are unchanged (the customer portal still authenticates as `Customer`), but staff-facing nav/routes/permission strings now say "Company". `/workspace/customers*` routes are redirect shims to the new `/workspace/companies*` paths.
- **New in-flight rename: `Enquiry` → `Deal`** — the `enquiries` DB table and `enquiry_items`/`enquiry_user` table names are unchanged, but the model layer, UI, and route (`/workspace/deals`) all now say "Deal". A standalone `deals` table existed briefly (2026-07-22 to 2026-07-26) before being merged back into `enquiries` — do not be surprised to find `deal_id` columns on other tables (`sales_orders`) sitting alongside legacy `enquiry_id` columns that mean the same thing.
- Several `*SplitView`-suffixed pages (Quotes, Invoices, Deliveries, Purchases, PaymentReceipts) have superseded their non-suffixed counterparts, which appear to be dead code still sitting in `pages/workspace/` (§4.1a).
- Multi-tenancy (`companies` + `company_id`) — stable since 2026-06-16, no further changes.

Treat any of the above as **in-flight cleanup opportunities**, not accidents to "fix" without checking git history/blame first.

---

## 6. Documented divergences from existing planning docs

| Doc claim | Reality |
|---|---|
| Platform Portal at `/platform/*` (README) | Actual prefix is `/saas-admin/*` |
| Quotes/Invoices/Customers "still mock data" (ROADMAP) | Fully live API-backed; `mockData.ts` is dead code, zero imports |
| `ZRNX-QT`/`ZRNX-INV` code prefixes implied | `Customer` uses `ZRNX-CUS-...`, `Lead` uses `ZRNX-LD-...`, `Deal` uses `ZRNX-DL-...`; Quote/Invoice use plain `QT-`/`INV-`-style prefixes generated ad hoc in controllers, not models |
| Backend layered via Requests/Resources/Middleware (README) | Still no such directories; all validation/serialization is inline in controllers |
| React 18 (README) | Actual: React 19.2.5 |
| Tailwind config file-based | Actual: Tailwind v4 CSS-first, no `tailwind.config.js` |
| `bootstrap/app.php` hooks empty (prior version of this doc) | **No longer true** — `withSchedule()`, `withMiddleware()`, and `withExceptions()` are all populated (§3.1, §3.7) |
| Product is "Customer → Enquiry → Quote → Invoice" (prior version of this doc) | Now "Lead → Company/Contact → Deal → Quote → Sales Order → Delivery → Invoice → Payment", plus parallel Purchasing and Marketing modules |

---

## 7. Missing documentation identified

1. No API reference (Postman/OpenAPI) for `routes/api.php` — now 50+ controllers, no generated docs.
2. No ER diagram reflects the current schema (the Deal/Enquiry table-aliasing quirk in particular is easy to get wrong without one).
3. No onboarding doc for a fresh dev environment given `.env.example` gaps (Pusher, IMAP, `FRONTEND_URL`, and now Google OAuth client credentials).
4. No documented policy on when to use `Policy` classes vs inline role checks (still inconsistent).
5. No test-writing guide/expectations, since no tests exist to model from (now covering a much larger surface area: Leads, Deals, Sales Orders, Deliveries, Purchase Bills, Marketing campaigns).
6. No documentation of the `marketing:tick` campaign-send state machine (recipient statuses, retry/backoff behavior) — currently only readable from `MarketingCampaign`'s counter columns and the controller/job code itself.
7. No documentation of the Deal/Enquiry table-aliasing history — a future contributor grepping for "Enquiry" will find the DB table but not the model, and vice versa for "Deal" in the schema; this file's §3.3/§3.4/§5 notes are currently the only record of why.
