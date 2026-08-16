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

        // Shared hosting has no persistent queue:work daemon, so the
        // scheduler itself drains the database queue on every tick instead.
        // --stop-when-empty exits once the queue is empty rather than
        // idling, and --max-time bounds it well under the 1-minute cadence
        // so it can't overlap the next scheduler run.
        // --queue must list every named queue jobs dispatch onto (marketing
        // campaigns, Google contacts sync) plus "default" — without it,
        // queue:work only drains the implicit "default" queue and jobs sent
        // to other queues (onQueue('marketing'), etc.) sit unprocessed forever.
        $schedule->command('queue:work --queue=marketing,google-sync,default --stop-when-empty --max-time=50 --tries=3')
            ->everyMinute()
            ->withoutOverlapping();
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

        // Role gate, layered on top of auth:sanctum — see
        // App\Http\Middleware\EnsureUserHasRole for why this exists.
        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        });
    })->create();
