<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Http\Request;
use Illuminate\Cache\RateLimiting\Limit;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);

        // Shared hosting terminates TLS in front of PHP, so Laravel sees the
        // request as plain HTTP unless told otherwise — force https:// when
        // generating URLs so redirects/asset links don't downgrade the scheme.
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        RateLimiter::for('public', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('auth', function (Request $request) {
            $email = strtolower((string) $request->input('email'));

            return [
                Limit::perMinute(5)->by($email . '|' . $request->ip()),
                Limit::perMinute(20)->by($request->ip()),
            ];
        });
    }
}
