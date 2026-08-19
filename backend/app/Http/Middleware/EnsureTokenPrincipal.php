<?php

namespace App\Http\Middleware;

use App\Models\Customer;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restrict Sanctum routes to the principal model they are designed for.
 *
 * Sanctum authenticates every HasApiTokens model through the same middleware,
 * so route prefixes alone cannot distinguish staff tokens from customer tokens.
 * Usage: principal:staff or principal:customer.
 */
class EnsureTokenPrincipal
{
    public function handle(Request $request, Closure $next, string $principal): Response
    {
        $user = $request->user();

        $isExpectedPrincipal = match ($principal) {
            'staff' => $user instanceof User,
            'customer' => $user instanceof Customer,
            default => false,
        };

        if (!$isExpectedPrincipal) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
