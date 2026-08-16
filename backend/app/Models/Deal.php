<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Carbon;

use App\Models\User;
use App\Traits\LogsActivity;
use App\Traits\HasUserScope;
use App\Traits\BelongsToCompany;

class Deal extends Model
{
    use HasFactory, LogsActivity, HasUserScope, BelongsToCompany;

    protected $table = 'enquiries';

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
        'title',
        'value',
        'stage',
        'expected_close_date',
        'closed_at',
        'lost_reason',
        'lost_notes',
        'probability',
        'deal_code',
        'next_action_at',
        'next_action_note',
        'position',
    ];

    protected $casts = [
        'attachments' => 'array',
        'value' => 'decimal:2',
        'expected_close_date' => 'date',
        'closed_at' => 'datetime',
        'next_action_at' => 'datetime',
        'probability' => 'integer',
        'position' => 'integer',
    ];

    protected $appends = ['primary_assignee', 'forecast_value'];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($deal) {
            if (empty($deal->deal_code)) {
                // company_id is already set at this point: BelongsToCompany's own
                // creating listener runs first (registered via parent::boot() above).
                $companyId = $deal->company_id ?? null;
                $prefix = \App\Services\DocumentNumberGenerator::resolvePrefix($companyId, 'deal_prefix', 'ZRNX-DL-');
                $deal->deal_code = \App\Services\DocumentNumberGenerator::nextDailySequence(static::class, $prefix, $companyId);
            }
        });
    }

    public function getPrimaryAssigneeAttribute()
    {
        return $this->relationLoaded('assigned_users')
            ? $this->assigned_users->sortBy(fn ($u) => $u->pivot->created_at)->first()
            : $this->assigned_users()->orderBy('enquiry_user.created_at')->first();
    }

    public function getForecastValueAttribute()
    {
        return round(($this->value ?? 0) * ($this->probability ?? 0) / 100, 2);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function customerContact(): BelongsTo
    {
        return $this->belongsTo(CustomerContact::class);
    }

    public function primaryContact(): BelongsTo
    {
        return $this->belongsTo(CustomerContact::class, 'customer_contact_id');
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The pivot table is physically named `enquiry_user` with columns
     * `enquiry_id`/`user_id` (Release B did not rename it). Eloquent's
     * default FK inference is based on this class's name (`Deal` ->
     * `deal_id`), which does not exist on that table — both FK columns
     * must be passed explicitly or every permission check relying on this
     * relation (via HasUserScope) silently breaks.
     */
    public function assigned_users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'enquiry_user', 'enquiry_id', 'user_id');
    }

    /**
     * `enquiry_items`'s FK column is physically `enquiry_id`, not `deal_id`
     * — explicit override needed for the same reason as assigned_users().
     */
    public function items(): HasMany
    {
        return $this->hasMany(DealItem::class, 'enquiry_id');
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(DealActivity::class);
    }

    public function additionalContacts(): BelongsToMany
    {
        return $this->belongsToMany(CustomerContact::class, 'deal_contacts');
    }

    public function approvedQuote(): HasOne
    {
        return $this->hasOne(Quote::class)->where('status', 'approved');
    }

    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }
}
