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

class Invoice extends Model
{
    use HasFactory, LogsActivity, HasUserScope, BelongsToCompany;

    protected $fillable = [
        'invoice_number',
        'quote_id',
        'sales_order_id',
        'delivery_id',
        'customer_id',
        'customer_contact_id',
        'user_id',
        'date',
        'due_date',
        'subtotal',
        'vat_amount',
        'total',
        'status',
        'reference_id',
        'deal_id',
        'notes',
        'terms',
        'payment_terms',
        'discount_percent',
        'shipping_amount',
        'tags',
        'attachments',
    ];

    protected $casts = [
        'tags' => 'array',
        'attachments' => 'array',
    ];

    protected $appends = ['days_due', 'amount_paid', 'balance', 'linked_delivery', 'payment_status'];

    public function getDaysDueAttribute()
    {
        if (!$this->due_date || $this->payment_status === 'paid') return 0;
        $due = \Illuminate\Support\Carbon::parse($this->due_date);
        return (int) now()->diffInDays($due, false);
    }

    public function getAmountPaidAttribute()
    {
        return (float) PaymentReceipt::where('invoice_id', $this->id)->sum('amount');
    }

    public function getBalanceAttribute()
    {
        return (float) ($this->total - $this->amount_paid);
    }

    /**
     * Payment state, computed from receipts rather than stored — `status` is
     * the workflow (draft/sent/accepted/on_hold/cancelled), independent of
     * how much has actually been paid.
     */
    public function getPaymentStatusAttribute(): string
    {
        if ($this->balance <= 0.01) {
            return 'paid';
        }
        if ($this->amount_paid > 0) {
            return 'partially_paid';
        }
        if (
            $this->due_date
            && \Illuminate\Support\Carbon::parse($this->due_date)->isPast()
            && !in_array($this->status, ['draft', 'cancelled'])
        ) {
            return 'overdue';
        }
        return 'unpaid';
    }

    /**
     * The delivery note tied to this invoice, whichever direction created the
     * link: this invoice was billed from an existing delivery (delivery_id),
     * or a delivery was generated from this invoice (deliveries() reverse FK).
     */
    public function getLinkedDeliveryAttribute(): ?Delivery
    {
        return $this->delivery ?: $this->deliveries->first();
    }

    public function receipts(): HasMany
    {
        return $this->hasMany(PaymentReceipt::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function delivery(): BelongsTo
    {
        return $this->belongsTo(Delivery::class);
    }

    /**
     * Deliveries generated directly from this invoice (bill-first flow).
     * Distinct from delivery() above, which is the reverse direction (this
     * invoice was billed from an existing delivery).
     */
    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class);
    }

    public function customerContact(): BelongsTo
    {
        return $this->belongsTo(CustomerContact::class);
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }

    public function activities(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'subject')->latest();
    }
}
