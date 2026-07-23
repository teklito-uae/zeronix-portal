<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'company_id',
        'number',
        'first_name',
        'last_name',
        'email',
        'phone',
        'salutation',
        'job_title',
        'description',
        'industry',
        'address',
        'tax_number',
        'website',
        'owner_user_id',
        'currency',
        'internal_notes',
        'profile_image',
        'instagram',
        'facebook',
        'linkedin',
        'twitter',
        'opening_balance',
        'show_job_amount_to_worker',
        'is_client_portal_enabled',
        'license_attachment',
        'vat_attachment',
        'status',
        'rejection_reason',
        'settings',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'show_job_amount_to_worker' => 'boolean',
        'is_client_portal_enabled' => 'boolean',
        'settings' => 'array',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }
}
