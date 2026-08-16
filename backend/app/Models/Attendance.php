<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\BelongsToCompany;

class Attendance extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'user_id',
        'clock_in',
        'clock_out',
        'clock_out_reason',
        'duration_minutes',
        'company_id',
    ];

    protected $casts = [
        'clock_in' => 'datetime',
        'clock_out' => 'datetime',
        'duration_minutes' => 'integer'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
