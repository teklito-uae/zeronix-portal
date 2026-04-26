<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

use App\Traits\LogsActivity;

class Supplier extends Model
{
    use LogsActivity;
    protected $fillable = [
        'supplier_code',
        'name',
        'contact_person',
        'email',
        'phone',
        'website',
        'address',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($supplier) {
            if (empty($supplier->supplier_code)) {
                $date = Carbon::now()->format('Ymd');
                $count = static::whereDate('created_at', Carbon::today())->count() + 1;
                $supplier->supplier_code = 'ZRNX-SUP-' . $date . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
            }
        });
    }

    public function brands()
    {
        return $this->belongsToMany(Brand::class, 'supplier_brands');
    }

    public function products()
    {
        return $this->hasMany(SupplierProduct::class);
    }
}
