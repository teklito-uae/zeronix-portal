<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToCompany;

class SbProduct extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'broadcast_id',
        'vendor_id',
        'category_id',
        'raw_line',
        'product_name',
        'specs_text',
        'spec_ram',
        'spec_storage',
        'spec_cpu',
        'price',
        'currency',
        'quantity_note',
        'parse_confidence',
        'is_reviewed',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_reviewed' => 'boolean',
    ];

    public function broadcast()
    {
        return $this->belongsTo(SbBroadcast::class, 'broadcast_id');
    }

    public function vendor()
    {
        return $this->belongsTo(SbVendor::class, 'vendor_id');
    }

    public function category()
    {
        return $this->belongsTo(SbCategory::class, 'category_id');
    }
}
