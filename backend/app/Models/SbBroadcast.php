<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToCompany;

class SbBroadcast extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'vendor_id',
        'category_id',
        'source',
        'raw_text',
        'parsed_row_count',
        'parse_warnings',
        'imported_by_user_id',
        'imported_via_token_id',
        'whatsapp_message_ts',
    ];

    protected $casts = [
        'parse_warnings' => 'array',
        'whatsapp_message_ts' => 'datetime',
    ];

    public function vendor()
    {
        return $this->belongsTo(SbVendor::class, 'vendor_id');
    }

    public function category()
    {
        return $this->belongsTo(SbCategory::class, 'category_id');
    }

    public function products()
    {
        return $this->hasMany(SbProduct::class, 'broadcast_id');
    }
}
