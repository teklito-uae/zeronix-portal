<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    protected $fillable = [
        'name',
        'type',
        'key',
        'subject',
        'content',
        'email_body',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];
}
