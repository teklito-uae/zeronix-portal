<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Traits\LogsActivity;
use App\Traits\BelongsToCompany;

class CustomerContact extends Model
{
    use HasFactory, LogsActivity, BelongsToCompany;

    protected $fillable = [
        'customer_id',
        'first_name',
        'last_name',
        'full_name',
        'designation',
        'department',
        'email',
        'phone',
        'mobile',
        'extension',
        'is_primary',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'is_active' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($contact) {
            $contact->full_name = trim($contact->first_name . ' ' . ($contact->last_name ?? ''));
        });

        static::saved(function ($contact) {
            if ($contact->is_primary) {
                static::where('customer_id', $contact->customer_id)
                    ->where('id', '!=', $contact->id)
                    ->update(['is_primary' => false]);
            }
        });
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(ContactActivity::class);
    }

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class, 'customer_contact_id');
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class, 'customer_contact_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'customer_contact_id');
    }
}
