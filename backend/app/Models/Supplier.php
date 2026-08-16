<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

use App\Traits\LogsActivity;
use App\Traits\BelongsToCompany;

class Supplier extends Model
{
    use LogsActivity, BelongsToCompany;
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
                // company_id is already set at this point: BelongsToCompany's own
                // creating listener runs first (registered via parent::boot() above).
                $companyId = $supplier->company_id ?? null;
                $prefix = \App\Services\DocumentNumberGenerator::resolvePrefix($companyId, 'supplier_prefix', 'ZRNX-SUP-');
                $supplier->supplier_code = \App\Services\DocumentNumberGenerator::nextDailySequence(static::class, $prefix, $companyId);
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
