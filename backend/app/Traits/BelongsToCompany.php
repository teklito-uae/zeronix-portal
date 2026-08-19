<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use App\Models\Company;
use App\Models\Customer;
use App\Models\User;

trait BelongsToCompany
{
    protected static function bootBelongsToCompany()
    {
        static::addGlobalScope('company', function (Builder $builder) {
            $principal = auth()->user() ?? auth()->guard('customer')->user();
            $table = $builder->getModel()->getTable();

            if ($principal instanceof User) {
                if ($principal->role !== 'super_admin') {
                    self::applyCompanyScope($builder, $table, $principal->company_id);
                }
            } elseif ($principal instanceof Customer) {
                self::applyCompanyScope($builder, $table, $principal->company_id);
            }
        });

        static::creating(function ($model) {
            if ($model->company_id) {
                return;
            }

            $principal = auth()->user() ?? auth()->guard('customer')->user();

            if ($principal instanceof User && $principal->role !== 'super_admin' && $principal->company_id) {
                $model->company_id = $principal->company_id;
            } elseif ($principal instanceof Customer && $principal->company_id) {
                $model->company_id = $principal->company_id;
            }
        });
    }

    private static function applyCompanyScope(Builder $builder, string $table, ?int $companyId): void
    {
        if ($companyId === null) {
            $builder->whereRaw('1 = 0');
            return;
        }

        $builder->where($table . '.company_id', $companyId);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
