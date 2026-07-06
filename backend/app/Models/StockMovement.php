<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Traits\BelongsToCompany;

class StockMovement extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'product_id',
        'quantity',
        'movement_type',
        'reference_type',
        'reference_id',
        'user_id',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
