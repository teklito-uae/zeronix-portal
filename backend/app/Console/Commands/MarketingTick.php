<?php

namespace App\Console\Commands;

use App\Jobs\SendMarketingEmailJob;
use App\Models\MarketingCampaign;
use App\Models\MarketingCampaignRecipient;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * Per-minute pacing engine for marketing campaigns:
 *  1. Promote due scheduled campaigns to sending.
 *  2. Release the next batch of pending recipients for each sending campaign,
 *     respecting business hours, per-minute/hour/day rates, per-domain caps
 *     and randomized send intervals.
 *  3. Mark drained campaigns completed.
 *
 * Central release-based pacing (instead of pre-computed delayed jobs) keeps
 * at most ~a minute of jobs in flight, so pause/cancel/rate changes apply
 * almost immediately.
 */
class MarketingTick extends Command
{
    protected $signature = 'marketing:tick';

    protected $description = 'Promote, pace and complete marketing campaigns (runs every minute)';

    public function handle(): int
    {
        $this->promoteScheduled();
        $this->recoverStaleDeferred();

        $campaigns = MarketingCampaign::withoutGlobalScope('company')
            ->where('status', 'sending')
            ->get();

        foreach ($campaigns as $campaign) {
            $this->paceCampaign($campaign);
            $this->completeIfDrained($campaign);
        }

        return self::SUCCESS;
    }

    private function promoteScheduled(): void
    {
        MarketingCampaign::withoutGlobalScope('company')
            ->where('status', 'scheduled')
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->get()
            ->each(function (MarketingCampaign $campaign) {
                $campaign->newQueryWithoutScopes()->whereKey($campaign->id)->update([
                    'status' => 'sending',
                    'started_at' => $campaign->started_at ?? now(),
                    'updated_at' => now(),
                ]);
                $this->info("Campaign #{$campaign->id} promoted to sending");
            });
    }

    /**
     * Safety net: deferred rows whose retry job was lost (e.g. worker crash,
     * queue purge) go back to pending so pacing picks them up again.
     */
    private function recoverStaleDeferred(): void
    {
        MarketingCampaignRecipient::withoutGlobalScope('company')
            ->where('status', 'deferred')
            ->where('updated_at', '<', Carbon::now()->subHours(2))
            ->update(['status' => 'pending', 'updated_at' => now()]);
    }

    private function paceCampaign(MarketingCampaign $campaign): void
    {
        $snapshot = $campaign->settings_snapshot ?? [];

        if (!$this->withinSendWindow($snapshot, $campaign->timezone)) {
            return;
        }

        $allowance = $this->allowance($campaign, $snapshot);
        if ($allowance <= 0) {
            return;
        }

        $candidates = MarketingCampaignRecipient::withoutGlobalScope('company')
            ->where('campaign_id', $campaign->id)
            ->where('status', 'pending')
            ->orderBy('id')
            ->limit($allowance * 3) // headroom for domain-cap filtering
            ->get(['id', 'email']);

        if ($candidates->isEmpty()) {
            return;
        }

        $selected = $this->filterDomainCaps($campaign, $snapshot, $candidates, $allowance);
        if (empty($selected)) {
            return;
        }

        MarketingCampaignRecipient::withoutGlobalScope('company')
            ->whereIn('id', $selected)
            ->update(['status' => 'queued', 'queued_at' => now(), 'updated_at' => now()]);

        // Randomized intervals: each message gets a cumulative random delay
        $minInterval = max(0, (int) ($snapshot['min_interval_seconds'] ?? 20));
        $maxInterval = max($minInterval, (int) ($snapshot['max_interval_seconds'] ?? 90));

        $delay = 0;
        foreach ($selected as $recipientId) {
            SendMarketingEmailJob::dispatch($recipientId)->delay(now()->addSeconds($delay));
            $delay += rand($minInterval, $maxInterval);
        }

        $campaign->recalcStatusCounters();

        $this->info("Campaign #{$campaign->id}: released " . count($selected) . ' message(s)');
    }

    private function withinSendWindow(array $snapshot, ?string $timezoneOverride): bool
    {
        if (!($snapshot['enforce_business_hours'] ?? true)) {
            return true;
        }

        $timezone = $timezoneOverride ?: ($snapshot['timezone'] ?? config('app.timezone'));
        try {
            $now = Carbon::now($timezone);
        } catch (\Exception $e) {
            $now = Carbon::now();
        }

        $businessDays = $snapshot['business_days'] ?? [1, 2, 3, 4, 5];
        if (!in_array($now->isoWeekday(), array_map('intval', $businessDays), true)) {
            return false;
        }

        $start = substr((string) ($snapshot['send_start_time'] ?? '09:00:00'), 0, 5);
        $end = substr((string) ($snapshot['send_end_time'] ?? '18:00:00'), 0, 5);
        $time = $now->format('H:i');

        return $time >= $start && $time < $end;
    }

    /**
     * This-minute allowance = min(per-minute rate, remaining hourly, remaining daily),
     * measured against actual sent+queued volume for the whole company (all campaigns
     * share the tenant's pipeline).
     */
    private function allowance(MarketingCampaign $campaign, array $snapshot): int
    {
        $perMinute = max(1, (int) ($snapshot['rate_per_minute'] ?? 10));
        $perHour = max(1, (int) ($snapshot['rate_per_hour'] ?? 200));
        $perDay = max(1, (int) ($snapshot['rate_per_day'] ?? 1000));

        $volumeSince = function (Carbon $since) use ($campaign) {
            return MarketingCampaignRecipient::withoutGlobalScope('company')
                ->where('company_id', $campaign->company_id)
                ->where(function ($q) use ($since) {
                    $q->where('sent_at', '>=', $since)
                        ->orWhere(function ($q2) use ($since) {
                            $q2->whereIn('status', ['queued', 'sending'])->where('queued_at', '>=', $since);
                        });
                })
                ->count();
        };

        $remainingHour = $perHour - $volumeSince(Carbon::now()->subHour());
        $remainingDay = $perDay - $volumeSince(Carbon::now()->subDay());

        return max(0, min($perMinute, $remainingHour, $remainingDay));
    }

    /**
     * Drop candidates whose recipient domain has hit its hourly cap.
     * Skipped candidates simply stay pending for a later minute.
     */
    private function filterDomainCaps(MarketingCampaign $campaign, array $snapshot, $candidates, int $allowance): array
    {
        $domainLimits = $snapshot['per_domain_limits'] ?? [];
        $selected = [];
        $plannedPerDomain = [];
        $sentPerDomain = [];

        foreach ($candidates as $candidate) {
            if (count($selected) >= $allowance) {
                break;
            }

            $domain = strtolower(substr(strrchr($candidate->email, '@'), 1) ?: '');

            if (isset($domainLimits[$domain])) {
                if (!isset($sentPerDomain[$domain])) {
                    $sentPerDomain[$domain] = MarketingCampaignRecipient::withoutGlobalScope('company')
                        ->where('company_id', $campaign->company_id)
                        ->where('email', 'like', '%@' . $domain)
                        ->where('sent_at', '>=', Carbon::now()->subHour())
                        ->count();
                }

                $planned = $plannedPerDomain[$domain] ?? 0;
                if ($sentPerDomain[$domain] + $planned >= (int) $domainLimits[$domain]) {
                    continue; // domain at capacity this hour — stays pending
                }
                $plannedPerDomain[$domain] = $planned + 1;
            }

            $selected[] = $candidate->id;
        }

        return $selected;
    }

    private function completeIfDrained(MarketingCampaign $campaign): void
    {
        $active = MarketingCampaignRecipient::withoutGlobalScope('company')
            ->where('campaign_id', $campaign->id)
            ->whereIn('status', ['pending', 'queued', 'sending', 'deferred'])
            ->exists();

        if (!$active) {
            $campaign->recalcStatusCounters();
            $campaign->newQueryWithoutScopes()->whereKey($campaign->id)->update([
                'status' => 'completed',
                'completed_at' => now(),
                'updated_at' => now(),
            ]);
            $this->info("Campaign #{$campaign->id} completed");
        }
    }
}
