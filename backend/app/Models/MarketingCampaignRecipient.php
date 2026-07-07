<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\BelongsToCompany;

class MarketingCampaignRecipient extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id',
        'campaign_id',
        'channel',
        'source_type',
        'source_id',
        'email',
        'name',
        'merge_data',
        'token',
        'status',
        'skipped_reason',
        'attempts',
        'last_error',
        'smtp_account_id',
        'message_id',
        'bounce_type',
        'queued_at',
        'sent_at',
        'delivered_at',
        'failed_at',
        'bounced_at',
        'opened_at',
        'last_opened_at',
        'open_count',
        'clicked_at',
        'click_count',
        'unsubscribed_at',
    ];

    protected $casts = [
        'merge_data' => 'array',
        'attempts' => 'integer',
        'open_count' => 'integer',
        'click_count' => 'integer',
        'queued_at' => 'datetime',
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
        'failed_at' => 'datetime',
        'bounced_at' => 'datetime',
        'opened_at' => 'datetime',
        'last_opened_at' => 'datetime',
        'clicked_at' => 'datetime',
        'unsubscribed_at' => 'datetime',
    ];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(MarketingCampaign::class, 'campaign_id');
    }

    public function smtpAccount(): BelongsTo
    {
        return $this->belongsTo(MarketingSmtpAccount::class, 'smtp_account_id');
    }
}
