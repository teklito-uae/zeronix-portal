<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseBillItem extends Model
{
    protected $fillable = [
        'purchase_bill_id',
        'product_id',
        'product_name',
        'description',
        'quantity',
        'unit_price',
        'tax_percent',
        'tax_amount',
        'total',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'tax_percent' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        static::created(function ($item) {
            if ($item->product_id) {
                Product::where('id', $item->product_id)->increment('stock_quantity', (int) $item->quantity);
            }
        });

        static::deleted(function ($item) {
            if ($item->product_id) {
                Product::where('id', $item->product_id)->decrement('stock_quantity', (int) $item->quantity);
            }
        });
    }

    public function purchaseBill(): BelongsTo
    {
        return $this->belongsTo(PurchaseBill::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
