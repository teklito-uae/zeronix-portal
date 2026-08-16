<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Route-level role gate, layered on top of auth:sanctum.
 *
 * Usage: ->middleware('role:admin,super_admin')
 *
 * This app has no other role-checking middleware (see CLAUDE.md /
 * PROJECT_KNOWLEDGE.md) — most authorization historically lived as inline
 * `$request->user()->role !== 'admin'` checks inside controllers, or in
 * Policy classes. This middleware exists to enforce the same intent at the
 * route layer (defense in depth) and to close gaps where a route had no
 * role check at all despite living in a nominally "admin-only" group.
 *
 * Note: the `admin`/`staff` route-prefix split in routes/api.php is
 * cosmetic — the frontend rewrites both `/workspace/*` (used by every
 * staff role) and `/saas-admin/*` (super_admin) to the backend's `/admin/*`
 * prefix (see frontend/src/lib/axios.ts). So the prefix itself must never
 * be treated as a role signal; only this middleware (or an inline/Policy
 * check) actually restricts by role.
 */
class EnsureUserHasRole
{
    /**
     * @param  string  ...$roles  Allowed roles, e.g. role:admin,super_admin
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, $roles, true)) {
            return response()->json(['message' => 'Forbidden. You do not have permission to perform this action.'], 403);
        }

        return $next($request);
    }
}
