<?php

namespace App\Jobs;

use App\Mail\MarketingCampaignMail;
use App\Models\MarketingCampaign;
use App\Models\MarketingCampaignRecipient;
use App\Models\MarketingEvent;
use App\Models\MarketingSetting;
use App\Models\MarketingSuppression;
use App\Services\MarketingMailerService;
use App\Services\MarketingTemplateRenderService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

/**
 * Sends one campaign email. Runs unauthenticated — all queries explicit.
 * Retries transient failures with exponential backoff; permanent recipient
 * rejections become bounces + automatic hard-bounce suppressions.
 */
class SendMarketingEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 4;

    public function __construct(public int $recipientId)
    {
        $this->onQueue('marketing');
    }

    public function backoff(): array
    {
        return [60, 300, 1800];
    }

    public function handle(): void
    {
        $recipient = MarketingCampaignRecipient::withoutGlobalScope('company')->find($this->recipientId);
        if (!$recipient) {
            return;
        }

        $campaign = MarketingCampaign::withoutGlobalScope('company')->find($recipient->campaign_id);
        if (!$campaign) {
            return;
        }

        // Campaign paused/cancelled while this job was queued
        if ($campaign->status !== 'sending') {
            if (in_array($campaign->status, ['cancelled', 'failed'], true)) {
                $this->updateRecipient($recipient, ['status' => 'skipped', 'skipped_reason' => 'cancelled']);
            } elseif ($recipient->status === 'queued') {
                $this->updateRecipient($recipient, ['status' => 'pending', 'queued_at' => null]);
            }
            return;
        }

        if (!in_array($recipient->status, ['queued', 'deferred'], true)) {
            return;
        }

        $snapshot = $campaign->settings_snapshot ?? [];

        // Last-second suppression re-check (unsubscribe raced the queue)
        if (!empty(MarketingSuppression::suppressedEmails($campaign->company_id, [$recipient->email]))) {
            $this->updateRecipient($recipient, ['status' => 'skipped', 'skipped_reason' => 'suppressed']);
            return;
        }

        // Cool-off re-check: prepare may have run long before this send
        $coolOffHours = (int) ($snapshot['cool_off_hours'] ?? 0);
        if ($coolOffHours > 0) {
            $recentlySent = MarketingCampaignRecipient::withoutGlobalScope('company')
                ->where('company_id', $campaign->company_id)
                ->where('campaign_id', '!=', $campaign->id)
                ->where('email', $recipient->email)
                ->where('sent_at', '>=', Carbon::now()->subHours($coolOffHours))
                ->exists();
            if ($recentlySent) {
                $this->updateRecipient($recipient, ['status' => 'skipped', 'skipped_reason' => 'cool_off']);
                return;
            }
        }

        $account = MarketingMailerService::pickAccount($campaign->company_id, $campaign->smtp_account_id);
        if (!$account) {
            // No account currently available (all failed or rate-capped) — retry later
            $this->markDeferred($recipient, $campaign, 'No SMTP account available');
            $this->release(120);
            return;
        }

        $this->updateRecipient($recipient, ['status' => 'sending', 'smtp_account_id' => $account->id]);

        $settings = new MarketingSetting($snapshot);

        $rendered = MarketingTemplateRenderService::render(
            $campaign->body_html,
            $campaign->subject,
            $recipient->merge_data ?? [],
            $snapshot['timezone'] ?? null
        );

        $recipient->refresh();
        $html = MarketingTemplateRenderService::injectTracking($rendered['html'], $recipient, $campaign, $settings);
        $unsubscribeUrl = MarketingTemplateRenderService::unsubscribeUrl($recipient);

        try {
            MarketingMailerService::applyMarketingSmtp($account);

            Mail::to($recipient->email, $recipient->name)
                ->send(new MarketingCampaignMail($rendered['subject'], $html, $unsubscribeUrl));

            MarketingMailerService::recordSuccess($account);

            $this->updateRecipient($recipient, [
                'status' => 'sent',
                'sent_at' => now(),
                'attempts' => $recipient->attempts + 1,
                'last_error' => null,
            ]);

            MarketingEvent::create([
                'company_id' => $campaign->company_id,
                'campaign_id' => $campaign->id,
                'recipient_id' => $recipient->id,
                'type' => 'sent',
                'meta' => ['smtp_account_id' => $account->id],
                'created_at' => now(),
            ]);
        } catch (TransportExceptionInterface $e) {
            $this->handleTransportFailure($recipient, $campaign, $account, $e);
        } catch (\Exception $e) {
            $this->handleTransportFailure($recipient, $campaign, $account, $e);
        }
    }

    private function handleTransportFailure(MarketingCampaignRecipient $recipient, MarketingCampaign $campaign, $account, \Throwable $e): void
    {
        $message = $e->getMessage();

        // Permanent recipient rejection → hard bounce + suppression
        if (preg_match('/\b55[0134]\b/', $message)) {
            $this->updateRecipient($recipient, [
                'status' => 'bounced',
                'bounce_type' => 'hard',
                'bounced_at' => now(),
                'failed_at' => now(),
                'attempts' => $recipient->attempts + 1,
                'last_error' => mb_substr($message, 0, 2000),
            ]);

            MarketingSuppression::withoutGlobalScope('company')->firstOrCreate(
                ['company_id' => $campaign->company_id, 'kind' => 'email', 'value' => $recipient->email],
                ['type' => 'hard_bounce', 'source_campaign_id' => $campaign->id]
            );

            MarketingEvent::create([
                'company_id' => $campaign->company_id,
                'campaign_id' => $campaign->id,
                'recipient_id' => $recipient->id,
                'type' => 'bounce',
                'meta' => ['error' => mb_substr($message, 0, 500)],
                'created_at' => now(),
            ]);
            return;
        }

        // Connection/auth style failure → degrade the account's health
        if (stripos($message, 'connection') !== false || stripos($message, 'authent') !== false || preg_match('/\b535\b/', $message)) {
            MarketingMailerService::recordFailure($account, $message);
        }

        MarketingEvent::create([
            'company_id' => $campaign->company_id,
            'campaign_id' => $campaign->id,
            'recipient_id' => $recipient->id,
            'type' => $this->attempts() >= $this->tries ? 'failure' : 'deferred',
            'meta' => ['error' => mb_substr($message, 0, 500), 'attempt' => $this->attempts()],
            'created_at' => now(),
        ]);

        if ($this->attempts() >= $this->tries) {
            $this->updateRecipient($recipient, [
                'status' => 'failed',
                'failed_at' => now(),
                'attempts' => $recipient->attempts + 1,
                'last_error' => mb_substr($message, 0, 2000),
            ]);
            return;
        }

        $this->markDeferred($recipient, $campaign, $message);
        $this->release($this->backoff()[min($this->attempts() - 1, count($this->backoff()) - 1)]);
    }

    private function markDeferred(MarketingCampaignRecipient $recipient, MarketingCampaign $campaign, string $error): void
    {
        $this->updateRecipient($recipient, [
            'status' => 'deferred',
            'attempts' => $recipient->attempts + 1,
            'last_error' => mb_substr($error, 0, 2000),
        ]);

        $campaign->newQueryWithoutScopes()->whereKey($campaign->id)->increment('retry_count');
    }

    private function updateRecipient(MarketingCampaignRecipient $recipient, array $attributes): void
    {
        $recipient->newQueryWithoutScopes()->whereKey($recipient->id)->update(array_merge($attributes, [
            'updated_at' => now(),
        ]));
        $recipient->forceFill($attributes);
    }
}
