<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Traits\LogsActivity;
use App\Traits\HasUserScope;
use App\Traits\BelongsToCompany;

class SalesOrder extends Model
{
    use HasFactory, LogsActivity, HasUserScope, BelongsToCompany;

    protected $fillable = [
        'order_number',
        'customer_id',
        'customer_contact_id',
        'enquiry_id',
        'deal_id',
        'quote_id',
        'user_id',
        'date',
        'status',
        'subtotal',
        'vat_amount',
        'total',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function customerContact(): BelongsTo
    {
        return $this->belongsTo(CustomerContact::class);
    }

    /**
     * Legacy alias — `sales_orders.enquiry_id` is a real, physical column
     * distinct from `deal_id` (both exist on this table). Explicit FK
     * because the target class is now `Deal`, not `Enquiry`.
     */
    public function enquiry(): BelongsTo
    {
        return $this->belongsTo(Deal::class, 'enquiry_id');
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SalesOrderItem::class);
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
