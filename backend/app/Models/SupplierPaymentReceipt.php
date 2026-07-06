<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;

class SupplierPaymentReceipt extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'purchase_bill_id',
        'supplier_id',
        'receipt_number',
        'amount',
        'payment_date',
        'payment_method',
        'reference_id',
        'notes',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (!$model->receipt_number) {
                $model->receipt_number = 'SPY-' . time();
            }
        });
    }

    public function purchaseBill()
    {
        return $this->belongsTo(PurchaseBill::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
