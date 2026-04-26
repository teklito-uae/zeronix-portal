<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupplierProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_id',
        'category_id',
        'product_id',
        'raw_text',
        'identifier_hash',
        'model_code',
        'name',
        'price',
        'currency',
        'specs',
        'is_active',
        'availability',
        'last_pasted_at',
    ];

    protected $casts = [
        'specs' => 'json',
        'is_active' => 'boolean',
        'availability' => 'boolean',
        'last_pasted_at' => 'datetime',
        'price' => 'decimal:2',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function priceHistory(): HasMany
    {
        return $this->hasMany(SupplierPriceHistory::class);
    }
}
