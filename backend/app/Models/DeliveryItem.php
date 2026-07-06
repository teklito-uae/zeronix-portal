<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryItem extends Model
{
    // Stock is decremented explicitly by DeliveryController::markDelivered when the
    // parent Delivery transitions to 'delivered' — not here on row creation — because
    // a pending/processing delivery must not touch inventory yet.
    protected $fillable = [
        'delivery_id',
        'sales_order_item_id',
        'product_id',
        'product_name',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
    ];

    public function delivery(): BelongsTo
    {
        return $this->belongsTo(Delivery::class);
    }

    public function salesOrderItem(): BelongsTo
    {
        return $this->belongsTo(SalesOrderItem::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
