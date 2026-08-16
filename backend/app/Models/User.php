<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\ResetPassword;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Traits\BelongsToCompany;

// Note: `Illuminate\Foundation\Auth\User` (the Authenticatable base class
// above) already uses the `CanResetPassword` trait and implements the
// `CanResetPassword` contract, so Laravel's password-broker (`Password::`)
// works against this model out of the box — no trait/interface needed here.
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, BelongsToCompany;

    /**
     * Curated set of on-brand accent colors a user's avatar is assigned
     * from at creation. Kept in sync with the color pool baked into the
     * add_avatar_color_to_users_table migration's backfill step.
     */
    public const AVATAR_COLOR_POOL = [
        '#cc063e', '#e83535', '#fd9407', '#10898b', '#0f52ba',
        '#6366f1', '#8b5cf6', '#ec4899', '#059669', '#d97706',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'manager_id',
        'designation',
        'avatar_color',
        'phone',
        'company_id',
        'permissions',
        'is_active',
        'shift_start',
        'shift_end',
        'smtp_host',
        'smtp_port',
        'smtp_username',
        'smtp_password',
        'smtp_encryption',
        'imap_host',
        'imap_port',
        'imap_username',
        'imap_password',
        'imap_encryption',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            if (empty($user->avatar_color)) {
                $user->avatar_color = self::AVATAR_COLOR_POOL[array_rand(self::AVATAR_COLOR_POOL)];
            }
        });
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'smtp_password',
        'imap_password',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'permissions' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function deals(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Deal::class);
    }

    public function quotes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Quote::class);
    }

    public function invoices(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function attendances(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function points(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(StaffPoint::class);
    }

    public function assigned_customers(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Customer::class, 'customer_user');
    }

    /**
     * Pivot table is physically `enquiry_user` with `enquiry_id`/`user_id`
     * columns (unrenamed by Release B) — explicit FK args required or
     * Eloquent infers `deal_id` from this class's name and breaks.
     */
    public function assigned_deals(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Deal::class, 'enquiry_user', 'user_id', 'enquiry_id');
    }

    public function tasks(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function stickyNotes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(StickyNote::class);
    }

    /**
     * Users who report to this user (this user is their manager).
     */
    public function reports(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(User::class, 'manager_id');
    }

    /**
     * The manager this user reports to.
     */
    public function manager(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    /**
     * Send the password reset notification.
     *
     * Overridden because Laravel's default `ResetPassword` notification
     * links to a backend route (`url('/password/reset/...')`), which
     * doesn't exist here — this app is an SPA with no server-rendered
     * reset-password page. Point the link at the frontend route instead.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPassword($token));
    }
}
