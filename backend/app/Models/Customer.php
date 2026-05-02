<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

use App\Traits\LogsActivity;
use App\Traits\HasUserScope;

class Customer extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, LogsActivity, HasUserScope;

    protected $fillable = [
        'customer_code',
        'name',
        'company',
        'email',
        'phone',
        'address',
        'trn',
        'password',
        'user_id',
        'is_portal_active'
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'is_portal_active' => 'boolean',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($customer) {
            if (empty($customer->customer_code)) {
                $date = Carbon::now()->format('Ymd');
                $count = static::whereDate('created_at', Carbon::today())->count() + 1;
                $customer->customer_code = 'ZRNX-CUS-' . $date . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
            }
        });
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function enquiries(): HasMany
    {
        return $this->hasMany(Enquiry::class);
    }

    public function assigned_user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
