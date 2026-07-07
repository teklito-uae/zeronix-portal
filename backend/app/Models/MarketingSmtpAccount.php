<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;
use App\Traits\LogsActivity;

class MarketingSmtpAccount extends Model
{
    use BelongsToCompany, LogsActivity;

    protected $fillable = [
        'company_id',
        'label',
        'host',
        'port',
        'encryption',
        'username',
        'password',
        'from_email',
        'from_name',
        'reply_to',
        'per_minute_limit',
        'hourly_limit',
        'daily_limit',
        'priority',
        'is_active',
        'health_status',
        'consecutive_failures',
        'last_error',
        'last_failure_at',
        'last_used_at',
        'total_sent',
    ];

    protected $casts = [
        'password' => 'encrypted',
        'is_active' => 'boolean',
        'port' => 'integer',
        'priority' => 'integer',
        'consecutive_failures' => 'integer',
        'total_sent' => 'integer',
        'last_failure_at' => 'datetime',
        'last_used_at' => 'datetime',
    ];

    protected $hidden = ['password'];
}
