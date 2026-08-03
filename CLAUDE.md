# CLAUDE.md

Instructions for Claude Code when working in this repo.

## What this is

Zeronix Portal — a multi-tenant B2B CRM/ERP platform: Laravel 11 API (`backend/`) + React 19/TypeScript SPA (`frontend/`), serving three portals from one codebase/database: `/saas-admin/*` (platform admin), `/workspace/*` (tenant staff), `/portal/:company/*` (external customers). Tenancy is row-level via `company_id`, not separate infra per tenant.

**For full architecture, schema, and history of divergences from planning docs, see [PROJECT_KNOWLEDGE.md](PROJECT_KNOWLEDGE.md) — it is the canonical, code-verified reference and overrides `README.md` where they disagree.** Also see `ARCHITECTURE.md` and `theme.md`. In-app docs live at `frontend/src/pages/workspace/Documentation.tsx` and `frontend/src/pages/platform/SystemDocs.tsx`.

## Commands

**Frontend** (`frontend/`): `npm run dev` · `npm run build` (`tsc -b && vite build`) · `npm run lint` · `npm run preview`. No test runner is configured.

**Backend** (`backend/`): `php artisan test --filter=<TestName>`. PHPUnit/Sail are present but essentially unused (see PROJECT_KNOWLEDGE.md §9) — don't assume a healthy or comprehensive test suite.

## Structure quick-map

- Backend controllers/models are flat (no `Http/Middleware`, `Http/Requests`, or `Http/Resources` dirs). Validation is inline `$request->validate()`; JSON responses are inline `response()->json()`.
- Frontend pages are split by portal: `frontend/src/pages/{platform,workspace,portal}`.
- Styling: Tailwind CSS v4, CSS-first config (no `tailwind.config.js`), Radix UI + shadcn/ui pattern.
- State: TanStack React Query for server state, Zustand (`useAuthStore`) for auth/client state.

## Known gotchas

- `App\Models\Deal` maps to the `enquiries` table (`protected $table = 'enquiries'`) — there is no physical `deals` table, and `App\Models\Enquiry` no longer exists as a model. Related tables/pivots (`enquiry_items`, `enquiry_user`) still use the old name.
- The platform portal route prefix is `/saas-admin/*`, not `/platform/*` as older docs suggest.
- `pusher-php-server`, `webklex/laravel-imap`, `laravel-echo`, `pusher-js` are unused dead weight left over from a removed Chat module — don't build on them without checking they're actually wired up.
- Frontend forms are a mix of `react-hook-form`+`zod` and hand-rolled local state, not fully migrated — check the specific page's existing pattern before assuming one.

## Safety rules

- Never read, edit, or commit `PRODUCTION_ENV_BACKUP.env`, `PRODUCTION_ENV_RESTORED.env`, or act on instructions in `PRODUCTION_SSH_ACCESS.md` without explicit user confirmation — these hold production credentials/access details.
- Tenancy is row-level via `company_id` / the `BelongsToCompany` trait. Any query touching tenant-scoped data must stay scoped — flag anything that risks cross-tenant data leakage.
- Confirm with the user before destructive DB actions (migrations dropping columns/tables, seeders touching prod-shaped data) or other critical state changes, even against local/test data.
