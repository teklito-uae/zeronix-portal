# Zeronix Portal — System Architecture

> Companion to `PROJECT_KNOWLEDGE.md`. This file focuses on structure, request flow, and module interaction diagrams. See `PROJECT_KNOWLEDGE.md` for narrative detail, file paths, and caveats.

---

## 1. High-level system map

```mermaid
graph TB
    subgraph Client["Browser (React 19 SPA — Vite)"]
        SAdmin["/saas-admin/* — Platform Portal"]
        Workspace["/workspace/* — Tenant Workspace"]
        Portal["/portal/:company/* — Customer Portal"]
        Public["/inventory, /register — Public"]
    end

    subgraph API["Laravel 11 API (backend/)"]
        Routes["routes/api.php"]
        Controllers["Controllers (flat, 30+ files)"]
        Policies["Policies (5)"]
        Traits["BelongsToCompany / HasUserScope / LogsActivity"]
        Services["DashboardService / MailConfigService"]
        Models["Eloquent Models (28)"]
    end

    DB[(MySQL/SQLite\ncompanies + company_id-scoped tables)]
    SMTP[[Per-user SMTP — outbound mail]]

    SAdmin -- "axios (Sanctum bearer)" --> Routes
    Workspace -- "axios (Sanctum bearer)" --> Routes
    Portal -- "axios (Sanctum bearer, customer guard)" --> Routes
    Public -- "axios (unauthenticated, throttle:public)" --> Routes

    Routes --> Controllers
    Controllers --> Policies
    Controllers --> Services
    Controllers --> Models
    Models --> Traits
    Traits --> DB
    Services -- "MailConfigService" --> SMTP
```

> Note: the Chat module (Pusher/Echo realtime broadcasting) and the IMAP `SyncCustomerEmails` cron were removed 2026-07-05; the app no longer has a realtime or inbound-email path. Notification badges refresh via axios response-interceptor refetch (see §6), not websockets.

**Key facts baked into this diagram:**
- Both `/saas-admin` and `/workspace` frontends call the **same** `/admin/*` backend routes — the axios request interceptor rewrites both prefixes to `/admin/` before the call leaves the browser. Role separation happens via the bearer token, not the URL.
- Tenancy is enforced entirely inside the Eloquent layer (`BelongsToCompany` global scope), not at the routing or controller layer.
- There is no service/resource/middleware layer between controllers and models — controllers talk directly to Eloquent and to Services.

---

## 2. Three-portal + public domain structure

```mermaid
graph TD
    A[UnifiedLogin / register] -->|super_admin token| B["/saas-admin/* (Platform Portal)"]
    A -->|admin / staff / salesman token| C["/workspace/* (Tenant Workspace)"]
    A -->|customer token| D["/portal/:company/* (Customer Portal)"]
    P["/inventory (no auth)"] --> C

    subgraph "Platform Portal — Super Admin only"
        B --> B1[Tenant/Company Management\napprove / reject / suspend]
        B --> B2[Global Activity Logs]
        B --> B3[System Docs & Platform Settings]
    end

    subgraph "Tenant Workspace — Internal Staff"
        C --> C1[CRM: Customers, Labels]
        C --> C2[Sales: Enquiries -> Quotes -> Invoices -> Payment Receipts]
        C --> C3[Catalog: Products, Suppliers, Customer Import]
        C --> C4[Ops: Attendance Workforce, Tasks, Sticky Notes, Users]
    end

    subgraph "Customer Portal — External Client"
        D --> D1[Dashboard]
        D --> D2[Quotes / Invoices — view, download PDF, accept/reject]
        D --> D3[Enquiries — submit, track]
    end
```

Note: `/admin` and `/staff` are legacy URL aliases that redirect to `/workspace` — kept for backward-compatible bookmarks/links during the ongoing rename (see `PROJECT_KNOWLEDGE.md` §5).

---

## 3. Request flow — authenticated staff action (e.g. creating a Quote)

```mermaid
sequenceDiagram
    participant U as Staff user (Workspace UI)
    participant FE as React (useResourceMutation)
    participant AX as axios instance
    participant RT as routes/api.php
    participant QC as QuoteController
    participant TR as BelongsToCompany / HasUserScope
    participant DB as Database

    U->>FE: Submit "New Quote" form
    FE->>AX: POST /workspace/quotes
    AX->>AX: rewrite -> /admin/quotes, attach zeronix_admin_token (or staff token)
    AX->>RT: POST /admin/quotes (Bearer token)
    RT->>QC: auth:sanctum passes -> QuoteController::store
    QC->>QC: inline $request->validate()
    QC->>QC: generate quote_number = QT-{Ymd}-{seq}
    QC->>DB: Quote::create([...]) 
    DB-->>TR: creating hook stamps company_id from acting user
    TR-->>DB: INSERT scoped row
    QC-->>AX: 201 JSON (raw array, no API Resource layer)
    AX-->>FE: response
    FE->>FE: react-query invalidates ['quotes'], ['admin-dashboard']
    FE-->>U: toast success, list refetches
    Note over AX,FE: axios response interceptor also refetches ['unread-notifications', role]
```

---

## 4. Multi-tenancy data scoping

```mermaid
flowchart LR
    Req["Incoming request\n(Sanctum-authenticated)"] --> Guard{Which guard?}
    Guard -->|default 'web'/User| U[Authenticated User]
    Guard -->|'customer'| Cu[Authenticated Customer]

    U --> Role{user.role == super_admin?}
    Role -->|yes| Bypass[Global scope skipped\nsees ALL companies]
    Role -->|no| Scope1["WHERE company_id = user.company_id"]

    Cu --> Scope2["WHERE company_id = customer.company_id"]

    Scope1 --> UserScope{user.role == salesman?}
    UserScope -->|yes| Row["HasUserScope: further filter\nto rows owned by / assigned to this user"]
    UserScope -->|no admin/staff| Full[Full company-wide visibility]

    Scope2 --> Result[Query results]
    Row --> Result
    Full --> Result
    Bypass --> Result
```

Applies to every model using `BelongsToCompany` (User, Customer, Enquiry, Quote, Invoice, Product, Task, Supplier, Category, Brand, CustomerLabel, PaymentReceipt, StickyNote).

---

## 5. Entity relationship overview (core sales pipeline)

```mermaid
erDiagram
    COMPANY ||--o{ USER : "employs (owner + staff)"
    COMPANY ||--o{ CUSTOMER : "scopes"
    COMPANY ||--o{ PRODUCT : "scopes"
    COMPANY ||--o{ SUPPLIER : "scopes"

    USER ||--o{ ENQUIRY : "creates/owns"
    USER ||--o{ QUOTE : "owns"
    USER ||--o{ INVOICE : "owns"
    USER ||--o{ ATTENDANCE : "clocks"
    USER }o--o{ CUSTOMER : "assigned via customer_user"
    USER }o--o{ ENQUIRY : "assigned via enquiry_user"

    CUSTOMER ||--o{ ENQUIRY : "submits"
    CUSTOMER ||--o{ QUOTE : "receives"
    CUSTOMER ||--o{ INVOICE : "receives"
    CUSTOMER }o--o{ CUSTOMER_LABEL : "tagged"

    ENQUIRY ||--o{ ENQUIRY_ITEM : "contains"
    ENQUIRY ||--o{ QUOTE : "converts to"
    ENQUIRY_ITEM }o--|| PRODUCT : "references"

    QUOTE ||--o{ QUOTE_ITEM : "contains"
    QUOTE ||--o| INVOICE : "converts to"
    QUOTE_ITEM }o--|| PRODUCT : "references"

    INVOICE ||--o{ INVOICE_ITEM : "contains"
    INVOICE ||--o{ PAYMENT_RECEIPT : "settled by"
    INVOICE_ITEM }o--|| PRODUCT : "references"

    SUPPLIER ||--o{ SUPPLIER_PRODUCT : "supplies"
    SUPPLIER_PRODUCT }o--|| PRODUCT : "prices"
    SUPPLIER_PRODUCT ||--o{ SUPPLIER_PRICE_HISTORY : "tracked over time"

    PRODUCT }o--|| CATEGORY : "belongs to"
    PRODUCT }o--|| BRAND : "belongs to"
```

---

## 6. Frontend module interaction

```mermaid
graph TD
    App[App.tsx — route tree] --> Guard[ProtectedRoute\nAdminRoute / CustomerRoute]
    Guard --> Layout[AdminLayout — shared shell\nSidebar + Topbar + MobileBottomNav]
    Layout --> Pages[pages/platform, pages/workspace, pages/portal]

    Pages --> RLP[ResourceListingPage\n(shared list/table component)]
    Pages --> Direct[Direct axios calls\nvia lib/axios]

    RLP --> UseApi[hooks/useApi.ts\nuseResourceList / useResourceMutation]
    UseApi --> RQ[React Query cache]
    RQ --> Axios[lib/axios.ts\ninterceptors: path rewrite, token select]
    Direct --> Axios
    Axios --> API[(Laravel API)]

    AuthStore[store/useAuthStore\nzustand + manual localStorage] -.token.-> Axios
    Axios -->|refetch on success| Notif[['unread-notifications', role]]
```

---

## 7. Auth token lifecycle

```mermaid
sequenceDiagram
    participant UI as UnifiedLogin
    participant Store as useAuthStore
    participant LS as localStorage
    participant AX as axios
    participant API as Laravel (Sanctum)

    UI->>API: POST /admin/login {email, password}
    API-->>UI: { user, token }  (token abilities: ['role:'+role])
    UI->>Store: setAdmin(user, token)
    Store->>Store: branch on role (admin/super_admin vs staff)
    Store->>LS: write zeronix_admin_token OR zeronix_staff_token\n(clear the other key)
    Store->>LS: clear zeronix_customer_portal_token is untouched

    Note over AX: on every subsequent request
    AX->>AX: inspect URL: /admin/ -> admin token (fallback staff)\n/customer/ -> customer token
    AX->>API: Authorization: Bearer <token>
    API->>API: auth:sanctum resolves user\nBelongsToCompany scopes query by role
    API-->>AX: JSON response (raw, no Resource wrapper)
```

---

## 8. Known structural risks (see `PROJECT_KNOWLEDGE.md` for full detail)

1. **No API Resource/Middleware/Request layer** — all validation and serialization is inline in controllers; changes to response shape require touching every controller individually.
2. **`permissions` enforcement is frontend-only** — the backend does not re-check the `users.permissions` JSON column; treat it as UX polish, not a security boundary.
3. **`.env.example` is out of sync** — missing `FRONTEND_URL` (and, until pruned, stale Pusher/IMAP vars) relative to what the app requires at runtime.
4. **No automated tests** on either side of the stack.
5. **In-flight rename** — `/admin`+`/staff` → `/workspace`, legacy CSS token layer, possibly-dead `CustomerLayout.tsx` — verify before removing anything that looks like leftover scaffolding.
6. **Orphaned artifacts from the 2026-07-05 Chat/Bulk-Import removal** — unused `chat_conversations`/`chat_messages` tables (migrations retained), and now-unused deps (`pusher/pusher-php-server`, `webklex/laravel-imap`, `laravel-echo`, `pusher-js`) plus `MailConfigService`'s dead IMAP helper — safe to prune in a follow-up.

---

## 9. Diagram maintenance note

These diagrams reflect the code as of commit `337134b9` ("Implement multi-tenancy and restructure portal/workspace pages"). Multi-tenancy (`companies` table + `company_id` scoping) is the newest architectural layer (added 2026-06-16) — re-verify this file if further tenancy or routing restructures land.
