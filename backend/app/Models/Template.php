<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;

class Template extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'name',
        'type',
        'key',
        'subject',
        'content',
        'email_body',
        'is_default',
        'company_id',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];
}
