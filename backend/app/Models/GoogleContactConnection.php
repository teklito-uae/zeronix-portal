<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;
use App\Traits\LogsActivity;

class GoogleContactConnection extends Model
{
    use BelongsToCompany, LogsActivity;

    protected $fillable = [
        'company_id', 'connected_user_id', 'google_account_email',
        'access_token', 'refresh_token', 'token_expires_at',
        'sync_status', 'last_synced_at', 'last_error', 'consecutive_failures', 'is_active',
    ];

    protected $casts = [
        'access_token' => 'encrypted',
        'refresh_token' => 'encrypted',
        'token_expires_at' => 'datetime',
        'last_synced_at' => 'datetime',
        'consecutive_failures' => 'integer',
        'is_active' => 'boolean',
    ];

    protected $hidden = ['access_token', 'refresh_token'];

    public function connectedUser()
    {
        return $this->belongsTo(User::class, 'connected_user_id');
    }
}
