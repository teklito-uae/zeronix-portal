<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToCompany;

class SbVendor extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_name',
        'name',
        'phone_raw',
        'phone_e164',
        'whatsapp_chat_name',
        'email',
        'address',
        'category_id',
        'notes',
        'is_active',
        'source',
        'created_by_user_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(SbCategory::class, 'category_id');
    }

    public function broadcasts()
    {
        return $this->hasMany(SbBroadcast::class, 'vendor_id');
    }

    public function products()
    {
        return $this->hasMany(SbProduct::class, 'vendor_id');
    }

    /**
     * Normalizes a raw phone number into E.164-ish form. Thin wrapper —
     * the actual logic lives in App\Support\PhoneNormalizer.
     */
    public static function normalizePhone(?string $raw): ?string
    {
        return \App\Support\PhoneNormalizer::normalize($raw);
    }
}
