<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use App\Models\User;
use App\Traits\LogsActivity;
use App\Traits\HasUserScope;
use App\Traits\BelongsToCompany;

class Enquiry extends Model
{
    use HasFactory, LogsActivity, HasUserScope, BelongsToCompany;
    protected $userScopeRelation = 'assigned_users';
    protected $fillable = [
        'customer_id',
        'lead_id',
        'customer_contact_id',
        'user_id',
        'source',
        'priority',
        'status',
        'notes',
        'attachments',
        'cancellation_reason',
        'cancelled_at',
    ];

    protected $casts = [
        'attachments' => 'array',
    ];

    protected $appends = ['primary_assignee'];

    public function getPrimaryAssigneeAttribute()
    {
        return $this->relationLoaded('assigned_users')
            ? $this->assigned_users->sortBy(fn ($u) => $u->pivot->created_at)->first()
            : $this->assigned_users()->orderBy('enquiry_user.created_at')->first();
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function customerContact(): BelongsTo
    {
        return $this->belongsTo(CustomerContact::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assigned_users(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(User::class, 'enquiry_user');
    }

    public function items(): HasMany
    {
        return $this->hasMany(EnquiryItem::class);
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class);
    }
}
