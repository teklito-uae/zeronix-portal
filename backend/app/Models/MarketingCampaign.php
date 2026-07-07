<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\BelongsToCompany;
use App\Traits\LogsActivity;

class MarketingCampaign extends Model
{
    use BelongsToCompany, LogsActivity;

    protected $fillable = [
        'company_id',
        'user_id',
        'name',
        'channel',
        'status',
        'template_id',
        'subject',
        'body_html',
        'preheader',
        'links',
        'audience_config',
        'schedule_type',
        'scheduled_at',
        'timezone',
        'smtp_account_id',
        'settings_snapshot',
        'total_recipients',
        'pending_count',
        'sent_count',
        'delivered_count',
        'failed_count',
        'deferred_count',
        'bounced_count',
        'skipped_count',
        'opened_count',
        'open_events_count',
        'clicked_count',
        'click_events_count',
        'unsubscribed_count',
        'retry_count',
        'launched_at',
        'started_at',
        'completed_at',
        'cancelled_at',
    ];

    protected $casts = [
        'links' => 'array',
        'audience_config' => 'array',
        'settings_snapshot' => 'array',
        'scheduled_at' => 'datetime',
        'launched_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(MarketingTemplate::class, 'template_id');
    }

    public function smtpAccount(): BelongsTo
    {
        return $this->belongsTo(MarketingSmtpAccount::class, 'smtp_account_id');
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(MarketingCampaignRecipient::class, 'campaign_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(MarketingEvent::class, 'campaign_id');
    }

    /**
     * Recalculate the status-derived counters from recipient rows.
     * Safe in unauthenticated (job/console) contexts.
     */
    public function recalcStatusCounters(): void
    {
        $counts = MarketingCampaignRecipient::withoutGlobalScope('company')
            ->where('campaign_id', $this->id)
            ->selectRaw('status, COUNT(*) as c')
            ->groupBy('status')
            ->pluck('c', 'status');

        $get = fn (string $status) => (int) ($counts[$status] ?? 0);

        $this->newQueryWithoutScopes()->whereKey($this->id)->update([
            'total_recipients' => $counts->sum(),
            'pending_count' => $get('pending'),
            'sent_count' => $get('sent') + $get('delivered'),
            'delivered_count' => $get('delivered'),
            'failed_count' => $get('failed'),
            'deferred_count' => $get('deferred'),
            'bounced_count' => $get('bounced') + $get('spam'),
            'skipped_count' => $get('skipped'),
            'unsubscribed_count' => $get('unsubscribed'),
            'updated_at' => now(),
        ]);
    }
}
