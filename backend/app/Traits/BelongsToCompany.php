<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use App\Models\Company;

trait BelongsToCompany
{
    protected static function bootBelongsToCompany()
    {
        static::addGlobalScope('company', function (Builder $builder) {
            // Apply scope if a User (Staff/Admin) is logged in
            if (auth()->check()) {
                $user = auth()->user();
                // super_admin bypasses the scope to see all tenants
                if ($user->role !== 'super_admin' && $user->company_id) {
                    $builder->where('company_id', $user->company_id);
                }
            } 
            // Apply scope if a Customer (End Client) is logged in
            elseif (auth()->guard('customer')->check()) {
                $customer = auth()->guard('customer')->user();
                if ($customer->company_id) {
                    $builder->where('company_id', $customer->company_id);
                }
            }
        });

        static::creating(function ($model) {
            if (!$model->company_id && auth()->check()) {
                $user = auth()->user();
                if ($user->role !== 'super_admin' && $user->company_id) {
                    $model->company_id = $user->company_id;
                }
            } elseif (!$model->company_id && auth()->guard('customer')->check()) {
                $customer = auth()->guard('customer')->user();
                if ($customer->company_id) {
                    $model->company_id = $customer->company_id;
                }
            }
        });
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
