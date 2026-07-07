<?php

namespace App\Jobs;

use App\Models\MarketingCampaign;
use App\Models\MarketingCampaignRecipient;
use App\Models\MarketingSetting;
use App\Services\MarketingAudienceService;
use App\Services\MarketingTemplateRenderService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Resolves a launched campaign's audience into recipient rows, applies
 * suppression / cool-off / frequency-cap / duplicate-protection skips,
 * snapshots content + settings, and moves the campaign to sending/scheduled.
 *
 * Runs unauthenticated: every query is explicit about company_id.
 */
class PrepareMarketingCampaignJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 2;
    public $timeout = 600;

    public function __construct(public int $campaignId)
    {
        $this->onQueue('marketing');
    }

    public function handle(): void
    {
        $campaign = MarketingCampaign::withoutGlobalScope('company')->find($this->campaignId);

        if (!$campaign || !in_array($campaign->status, ['draft', 'scheduled', 'sending'], true)) {
            return;
        }

        $settings = MarketingSetting::forCompany($campaign->company_id);

        // Snapshot template content + sending settings at launch time
        $updates = ['settings_snapshot' => $settings->only([
            'timezone', 'business_days', 'send_start_time', 'send_end_time', 'enforce_business_hours',
            'min_interval_seconds', 'max_interval_seconds', 'rate_per_minute', 'rate_per_hour', 'rate_per_day',
            'per_domain_limits', 'cool_off_hours', 'max_emails_per_recipient_per_month',
            'duplicate_protection_days', 'track_opens', 'track_clicks', 'append_unsubscribe_footer',
            'unsubscribe_footer_html',
        ])];

        if ($campaign->template_id && !$campaign->body_html) {
            $template = $campaign->template()->withoutGlobalScope('company')->first();
            if ($template) {
                $updates['subject'] = $campaign->subject ?: $template->subject;
                $updates['body_html'] = $template->body_html;
                $updates['preheader'] = $campaign->preheader ?: $template->preheader;
            }
        }

        $bodyForLinks = $updates['body_html'] ?? $campaign->body_html;
        $updates['links'] = MarketingTemplateRenderService::extractLinks($bodyForLinks);

        $campaign->newQueryWithoutScopes()->whereKey($campaign->id)->update(array_merge(
            collect($updates)->map(fn ($v) => is_array($v) ? json_encode($v) : $v)->all(),
            ['updated_at' => now()]
        ));
        $campaign->refresh();

        // Resolve audience → recipient rows (unique (campaign_id, email) dedupes)
        $batch = [];
        foreach (MarketingAudienceService::resolveRecipients($campaign) as $recipient) {
            $batch[] = [
                'company_id' => $campaign->company_id,
                'campaign_id' => $campaign->id,
                'channel' => $campaign->channel,
                'source_type' => $recipient['source_type'],
                'source_id' => $recipient['source_id'],
                'email' => $recipient['email'],
                'name' => $recipient['name'],
                'merge_data' => json_encode($recipient['merge_data']),
                'token' => Str::random(40),
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ];

            if (count($batch) >= 500) {
                MarketingCampaignRecipient::insertOrIgnore($batch);
                $batch = [];
            }
        }
        if (!empty($batch)) {
            MarketingCampaignRecipient::insertOrIgnore($batch);
        }

        $this->applySkips($campaign, $settings);

        $campaign->recalcStatusCounters();

        $statusUpdate = $campaign->schedule_type === 'scheduled' && $campaign->scheduled_at && $campaign->scheduled_at->isFuture()
            ? ['status' => 'scheduled']
            : ['status' => 'sending', 'started_at' => now()];

        $campaign->newQueryWithoutScopes()->whereKey($campaign->id)->update(array_merge($statusUpdate, [
            'launched_at' => $campaign->launched_at ?? now(),
            'updated_at' => now(),
        ]));
    }

    private function applySkips(MarketingCampaign $campaign, MarketingSetting $settings): void
    {
        $companyId = $campaign->company_id;
        $base = MarketingCampaignRecipient::withoutGlobalScope('company')
            ->where('campaign_id', $campaign->id)
            ->where('status', 'pending');

        // 1. Suppressed emails
        (clone $base)->whereIn('email', function ($q) use ($companyId) {
            $q->select('value')->from('marketing_suppressions')
                ->where('company_id', $companyId)->where('kind', 'email');
        })->update(['status' => 'skipped', 'skipped_reason' => 'suppressed', 'updated_at' => now()]);

        // 2. Blocked domains
        (clone $base)->whereRaw("SUBSTRING_INDEX(email, '@', -1) IN (SELECT value FROM marketing_suppressions WHERE company_id = ? AND kind = 'domain')", [$companyId])
            ->update(['status' => 'skipped', 'skipped_reason' => 'suppressed', 'updated_at' => now()]);

        // 3. Cool-off: anyone emailed (any campaign) within the window.
        // MySQL forbids selecting from the table being updated in a subquery,
        // so the matching emails are materialized into a PHP array first.
        if ($settings->cool_off_hours > 0) {
            $since = Carbon::now()->subHours($settings->cool_off_hours);
            $emails = MarketingCampaignRecipient::withoutGlobalScope('company')
                ->where('company_id', $companyId)
                ->where('campaign_id', '!=', $campaign->id)
                ->whereNotNull('sent_at')
                ->where('sent_at', '>=', $since)
                ->distinct()
                ->pluck('email');

            if ($emails->isNotEmpty()) {
                (clone $base)->whereIn('email', $emails)
                    ->update(['status' => 'skipped', 'skipped_reason' => 'cool_off', 'updated_at' => now()]);
            }
        }

        // 4. Monthly frequency cap
        if ($settings->max_emails_per_recipient_per_month > 0) {
            $since = Carbon::now()->subDays(30);
            $emails = MarketingCampaignRecipient::withoutGlobalScope('company')
                ->where('company_id', $companyId)
                ->whereNotNull('sent_at')
                ->where('sent_at', '>=', $since)
                ->groupBy('email')
                ->havingRaw('COUNT(*) >= ?', [$settings->max_emails_per_recipient_per_month])
                ->pluck('email');

            if ($emails->isNotEmpty()) {
                (clone $base)->whereIn('email', $emails)
                    ->update(['status' => 'skipped', 'skipped_reason' => 'frequency_cap', 'updated_at' => now()]);
            }
        }

        // 5. Duplicate protection: same template already sent to this email recently
        if ($settings->duplicate_protection_days > 0 && $campaign->template_id) {
            $since = Carbon::now()->subDays($settings->duplicate_protection_days);
            $emails = MarketingCampaignRecipient::withoutGlobalScope('company')
                ->select('marketing_campaign_recipients.email')
                ->join('marketing_campaigns', 'marketing_campaigns.id', '=', 'marketing_campaign_recipients.campaign_id')
                ->where('marketing_campaign_recipients.company_id', $companyId)
                ->where('marketing_campaigns.template_id', $campaign->template_id)
                ->where('marketing_campaigns.id', '!=', $campaign->id)
                ->whereNotNull('marketing_campaign_recipients.sent_at')
                ->where('marketing_campaign_recipients.sent_at', '>=', $since)
                ->distinct()
                ->pluck('email');

            if ($emails->isNotEmpty()) {
                (clone $base)->whereIn('email', $emails)
                    ->update(['status' => 'skipped', 'skipped_reason' => 'duplicate_protection', 'updated_at' => now()]);
            }
        }
    }
}
