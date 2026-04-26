<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierPriceHistory extends Model
{
    use HasFactory;

    protected $table = 'supplier_price_history';

    protected $fillable = [
        'supplier_product_id',
        'price',
        'currency',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function supplierProduct(): BelongsTo
    {
        return $this->belongsTo(SupplierProduct::class);
    }
}
