<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\BelongsToCompany;
use App\Traits\LogsActivity;

class MarketingSegment extends Model
{
    use BelongsToCompany, LogsActivity;

    protected $fillable = [
        'company_id',
        'user_id',
        'name',
        'description',
        'source',
        'filters',
        'cached_count',
        'counted_at',
    ];

    protected $casts = [
        'filters' => 'array',
        'cached_count' => 'integer',
        'counted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
