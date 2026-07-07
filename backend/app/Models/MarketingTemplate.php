<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\BelongsToCompany;
use App\Traits\LogsActivity;

class MarketingTemplate extends Model
{
    use BelongsToCompany, LogsActivity;

    protected $fillable = [
        'company_id',
        'user_id',
        'name',
        'subject',
        'preheader',
        'body_html',
        'category',
        'channel',
        'is_builtin',
        'is_active',
        'current_version',
    ];

    protected $casts = [
        'is_builtin' => 'boolean',
        'is_active' => 'boolean',
        'current_version' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(MarketingTemplateVersion::class, 'template_id');
    }
}
