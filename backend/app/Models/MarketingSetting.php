<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;

class MarketingSetting extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id',
        'timezone',
        'business_days',
        'send_start_time',
        'send_end_time',
        'enforce_business_hours',
        'min_interval_seconds',
        'max_interval_seconds',
        'rate_per_minute',
        'rate_per_hour',
        'rate_per_day',
        'per_domain_limits',
        'cool_off_hours',
        'max_emails_per_recipient_per_month',
        'duplicate_protection_days',
        'track_opens',
        'track_clicks',
        'append_unsubscribe_footer',
        'unsubscribe_footer_html',
        'default_test_email',
    ];

    protected $casts = [
        'business_days' => 'array',
        'per_domain_limits' => 'array',
        'enforce_business_hours' => 'boolean',
        'track_opens' => 'boolean',
        'track_clicks' => 'boolean',
        'append_unsubscribe_footer' => 'boolean',
        'min_interval_seconds' => 'integer',
        'max_interval_seconds' => 'integer',
        'rate_per_minute' => 'integer',
        'rate_per_hour' => 'integer',
        'rate_per_day' => 'integer',
        'cool_off_hours' => 'integer',
        'max_emails_per_recipient_per_month' => 'integer',
        'duplicate_protection_days' => 'integer',
    ];

    public const DEFAULTS = [
        'timezone' => 'Asia/Dubai',
        'business_days' => [1, 2, 3, 4, 5],
        'send_start_time' => '09:00:00',
        'send_end_time' => '18:00:00',
        'enforce_business_hours' => true,
        'min_interval_seconds' => 20,
        'max_interval_seconds' => 90,
        'rate_per_minute' => 10,
        'rate_per_hour' => 200,
        'rate_per_day' => 1000,
        'per_domain_limits' => [
            'gmail.com' => 60,
            'outlook.com' => 60,
            'hotmail.com' => 60,
            'yahoo.com' => 40,
        ],
        'cool_off_hours' => 72,
        'max_emails_per_recipient_per_month' => 4,
        'duplicate_protection_days' => 14,
        'track_opens' => true,
        'track_clicks' => true,
        'append_unsubscribe_footer' => true,
    ];

    public static function forCompany(int $companyId): self
    {
        return static::withoutGlobalScope('company')->firstOrCreate(
            ['company_id' => $companyId],
            static::DEFAULTS
        );
    }
}
