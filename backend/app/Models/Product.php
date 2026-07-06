<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Traits\LogsActivity;
use App\Traits\HasUserScope;
use App\Traits\BelongsToCompany;

class Product extends Model
{
    use HasFactory, LogsActivity, HasUserScope, BelongsToCompany;

    protected $fillable = [
        'category_id',
        'brand_id',
        'name',
        'slug',
        'description',
        'model_code',
        'sku',
        'stock_quantity',
        'price',
        'specs',
        'image',
        'is_active',
    ];

    protected $casts = [
        'specs' => 'json',
        'is_active' => 'boolean',
        'stock_quantity' => 'integer',
    ];

    protected $appends = ['is_low_stock'];

    public function getIsLowStockAttribute()
    {
        return $this->stock_quantity <= 5;
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function supplierProducts()
    {
        return $this->hasMany(SupplierProduct::class);
    }
}
