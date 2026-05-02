<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use App\Traits\LogsActivity;
use App\Traits\HasUserScope;

class Invoice extends Model
{
    use LogsActivity, HasUserScope;

    protected $fillable = [
        'invoice_number',
        'quote_id',
        'customer_id',
        'user_id',
        'date',
        'due_date',
        'subtotal',
        'vat_amount',
        'total',
        'status'
    ];

    protected $appends = ['days_due', 'amount_paid', 'balance'];

    public function getDaysDueAttribute()
    {
        if (!$this->due_date || $this->status === 'paid') return 0;
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
}
