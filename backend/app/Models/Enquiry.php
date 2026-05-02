<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use App\Models\User;
use App\Traits\LogsActivity;
use App\Traits\HasUserScope;
class Enquiry extends Model
{
    use LogsActivity, HasUserScope;
    protected $userScopeColumn = 'assigned_to';
    protected $fillable = [
        'customer_id',
        'user_id',
        'assigned_to',
        'source',
        'priority',
        'status',
        'notes',
        'cancellation_reason',
        'cancelled_at',
    ];



    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
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
