<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Carbon;

use App\Traits\LogsActivity;
use App\Traits\HasUserScope;
use App\Traits\BelongsToCompany;

class Lead extends Model
{
    use HasFactory, LogsActivity, HasUserScope, BelongsToCompany;

    protected $fillable = [
        'lead_code',
        'name',
        'company',
        'email',
        'phone',
        'phone_2',
        'source',
        'status',
        'notes',
        'user_id',
        'converted_customer_id',
        'converted_at',
        'external_id',
        'synced_at',
    ];

    protected $casts = [
        'converted_at' => 'datetime',
        'synced_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($lead) {
            if (empty($lead->lead_code)) {
                // company_id is already set at this point: BelongsToCompany's own
                // creating listener runs first (registered via parent::boot() above).
                $companyId = $lead->company_id ?? null;
                $prefix = \App\Services\DocumentNumberGenerator::resolvePrefix($companyId, 'lead_prefix', 'ZRNX-LD-');
                $lead->lead_code = \App\Services\DocumentNumberGenerator::nextDailySequence(static::class, $prefix, $companyId);
            }
        });
    }

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class);
    }

    public function convertedCustomer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'converted_customer_id');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function assigned_users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'lead_user');
    }
}
