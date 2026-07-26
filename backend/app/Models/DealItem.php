<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DealItem extends Model
{
    protected $table = 'enquiry_items';

    protected $fillable = [
        'enquiry_id',
        'product_id',
        'quantity',
        'description',
        'unit_price',
        'tax_percent',
        'tax_amount',
        'discount_percent',
        'discount_amount',
        'total',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'tax_percent' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_percent' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Navigate from an item back to its parent Deal. Explicit FK: the
     * physical column is `enquiry_id` (unchanged by Release B), not
     * `deal_id`.
     */
    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class, 'enquiry_id');
    }
}
