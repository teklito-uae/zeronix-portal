<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withSchedule(function (\Illuminate\Console\Scheduling\Schedule $schedule) {
        $schedule->command('quotes:notify-followup')->hourly();
        $schedule->command('marketing:tick')->everyMinute()->withoutOverlapping();
    })
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // This backend is a pure JSON API (routes/web.php has no login page),
        // so unauthenticated requests must never fall through to Laravel's
        // default `route('login')` redirect — there is no such route, and
        // that lookup throws RouteNotFoundException, turning a plain 401
        // into an uncaught 500 for any request that doesn't send
        // Accept: application/json (e.g. a bare browser navigation).
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        });
    })->create();
