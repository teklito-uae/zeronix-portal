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
use App\Traits\BelongsToCompany;

class Customer extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, LogsActivity, HasUserScope, BelongsToCompany;

    protected $fillable = [
        'customer_code',
        'name',
        'company',
        'email',
        'phone',
        'address',
        'trn',
        'password',
        'is_portal_active',
        'company_id',
        'is_company_admin',
        'industry',
        'website',
        'description',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'is_portal_active' => 'boolean',
            'is_company_admin' => 'boolean',
            'outstanding_balance' => 'float',
            'overdue_invoices_count' => 'integer',
            'overdue_invoices_value' => 'float',
            'total_invoiced' => 'float',
            'total_volume' => 'float',
            'open_deals_count' => 'integer',
            'open_deals_value' => 'float',
            'open_quotes_count' => 'integer',
            'open_quotes_value' => 'float',
            'open_invoices_count' => 'integer',
            'open_invoices_value' => 'float',
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

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class);
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(CustomerContact::class);
    }

    public function activeContacts(): HasMany
    {
        return $this->contacts()->where('is_active', true);
    }

    public function primaryContact(): ?CustomerContact
    {
        return $this->contacts()->where('is_primary', true)->first()
            ?? $this->activeContacts()->oldest()->first();
    }

    public function assigned_users()
    {
        return $this->belongsToMany(User::class, 'customer_user');
    }

    public function labels()
    {
        return $this->belongsToMany(CustomerLabel::class, 'customer_label_pivot', 'customer_id', 'label_id');
    }
}

