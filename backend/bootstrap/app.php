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
        // Laravel's ApplicationBuilder wires guests to redirectGuestsTo(fn () =>
        // route('login')) by default, and that callback runs unconditionally
        // while Authenticate::unauthenticated() is building the
        // AuthenticationException (to compute its redirect path) — even for
        // requests that expect JSON. This backend is a pure JSON API with no
        // login route (routes/web.php has no login page), so that route()
        // lookup throws RouteNotFoundException before AuthenticationException
        // is ever thrown. Overriding it to null stops that crash entirely.
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        });
    })->create();
