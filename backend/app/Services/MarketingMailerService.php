<?php

namespace App\Services;

use App\Models\MarketingCampaignRecipient;
use App\Models\MarketingSmtpAccount;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Carbon;

class MarketingMailerService
{
    /**
     * Apply a marketing SMTP account's settings to the mail configuration.
     * Mirrors MailConfigService::applyUserSmtp but for pool accounts.
     */
    public static function applyMarketingSmtp(MarketingSmtpAccount $account)
    {
        $encryption = $account->encryption ?: 'tls';

        $config = [
            'transport' => 'smtp',
            'host' => $account->host,
            'port' => $account->port ?? 587,
            'encryption' => $encryption === 'none' ? null : $encryption,
            'username' => $account->username,
            'password' => $account->password,
            'timeout' => null,
            'local_domain' => env('MAIL_EHLO_DOMAIN', 'zeronix.com'),
        ];

        Config::set('mail.mailers.smtp_marketing', $config);
        Config::set('mail.default', 'smtp_marketing');
        Config::set('mail.from.address', $account->from_email);
        Config::set('mail.from.name', $account->from_name);

        app()->forgetInstance('mail.manager');
        Mail::clearResolvedInstances();
    }

    /**
     * Pick the next SMTP account for a company: active, healthy, under its own
     * rate windows; rotation = priority DESC then least-recently-used.
     * Scope-independent (safe inside queue jobs).
     */
    public static function pickAccount(int $companyId, ?int $forcedAccountId = null): ?MarketingSmtpAccount
    {
        $query = MarketingSmtpAccount::withoutGlobalScope('company')
            ->where('company_id', $companyId)
            ->where('is_active', true)
            ->where('health_status', '!=', 'failed');

        if ($forcedAccountId) {
            $query->where('id', $forcedAccountId);
        }

        $accounts = $query->orderByDesc('priority')->orderByRaw('last_used_at IS NULL DESC')->orderBy('last_used_at')->get();

        foreach ($accounts as $account) {
            if (self::isUnderLimits($account)) {
                return $account;
            }
        }

        return null;
    }

    /**
     * Check the account's own per-minute / hourly / daily send limits
     * against actual sent rows (null limit = unlimited).
     */
    public static function isUnderLimits(MarketingSmtpAccount $account): bool
    {
        $windows = [
            ['limit' => $account->per_minute_limit, 'since' => Carbon::now()->subMinute()],
            ['limit' => $account->hourly_limit, 'since' => Carbon::now()->subHour()],
            ['limit' => $account->daily_limit, 'since' => Carbon::now()->subDay()],
        ];

        foreach ($windows as $window) {
            if (!$window['limit']) {
                continue;
            }
            $sent = MarketingCampaignRecipient::withoutGlobalScope('company')
                ->where('smtp_account_id', $account->id)
                ->where('sent_at', '>=', $window['since'])
                ->count();
            if ($sent >= $window['limit']) {
                return false;
            }
        }

        return true;
    }

    public static function recordSuccess(MarketingSmtpAccount $account): void
    {
        $account->newQueryWithoutScopes()->whereKey($account->id)->update([
            'consecutive_failures' => 0,
            'health_status' => 'healthy',
            'last_used_at' => now(),
            'total_sent' => $account->total_sent + 1,
            'updated_at' => now(),
        ]);
    }

    public static function recordFailure(MarketingSmtpAccount $account, string $error): void
    {
        $failures = $account->consecutive_failures + 1;
        $account->newQueryWithoutScopes()->whereKey($account->id)->update([
            'consecutive_failures' => $failures,
            'health_status' => $failures >= 5 ? 'failed' : 'warning',
            'last_error' => mb_substr($error, 0, 2000),
            'last_failure_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
