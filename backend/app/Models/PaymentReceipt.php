<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;

class PaymentReceipt extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'invoice_id',
        'customer_id',
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
                $model->receipt_number = 'RCP-' . time();
            }
        });
    }

    /**
     * Route parameters resolve by numeric id or by receipt_number, so
     * frontend URLs can use the human-readable receipt number.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        if ($field) {
            return $this->where($field, $value)->first();
        }

        return is_numeric($value)
            ? $this->where('id', $value)->first()
            : $this->where('receipt_number', $value)->first();
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
