<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Traits\LogsActivity;
use App\Traits\HasUserScope;
use App\Traits\BelongsToCompany;

class Quote extends Model
{
    use HasFactory, LogsActivity, HasUserScope, BelongsToCompany;

    protected $fillable = [
        'quote_number',
        'deal_id',
        'customer_id',
        'customer_contact_id',
        'user_id',
        'date',
        'valid_until',
        'subtotal',
        'vat_amount',
        'total',
        'status',
        'reference_id',
        'email_sent_at',
        'due_date',
        'closing_ratio',
        'last_notified_at',
        'tags',
        'attachments',
        'payment_terms',
        'delivery_date',
        'notes',
        'terms',
        'discount_percent',
        'shipping_amount',
    ];

    protected $casts = [
        'tags' => 'array',
        'attachments' => 'array',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function customerContact(): BelongsTo
    {
        return $this->belongsTo(CustomerContact::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(QuoteItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }

    public function activities(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'subject')->latest();
    }

    /**
     * Approve this quote. If it belongs to a Deal, any other quote on that
     * same Deal currently marked 'approved' is superseded first, so a Deal
     * only ever has one approved quote at a time. Note: this database is
     * MyISAM, so DB::transaction() here doesn't give true atomicity — it's
     * kept for portability/documentation, not relied on for isolation.
     */
    public function approve(): void
    {
        \DB::transaction(function () {
            if ($this->deal_id) {
                static::where('deal_id', $this->deal_id)
                    ->where('status', 'approved')
                    ->where('id', '!=', $this->id)
                    ->update(['status' => 'superseded']);
            }
            $this->status = 'approved';
            $this->save();
        });
    }
}
