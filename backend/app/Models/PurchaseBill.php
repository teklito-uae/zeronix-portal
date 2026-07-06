<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Traits\LogsActivity;
use App\Traits\BelongsToCompany;

class PurchaseBill extends Model
{
    use HasFactory, LogsActivity, BelongsToCompany;

    protected $fillable = [
        'bill_number',
        'supplier_id',
        'user_id',
        'date',
        'due_date',
        'subtotal',
        'vat_amount',
        'total',
        'status',
    ];

    protected $appends = ['amount_paid', 'balance'];

    public function getAmountPaidAttribute()
    {
        return (float) SupplierPaymentReceipt::where('purchase_bill_id', $this->id)->sum('amount');
    }

    public function getBalanceAttribute()
    {
        return (float) ($this->total - $this->amount_paid);
    }

    public function receipts(): HasMany
    {
        return $this->hasMany(SupplierPaymentReceipt::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseBillItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
