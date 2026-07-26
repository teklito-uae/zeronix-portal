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
                $date = Carbon::now()->format('Ymd');
                $count = static::whereDate('created_at', Carbon::today())->count() + 1;
                $lead->lead_code = 'ZRNX-LD-' . $date . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
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
