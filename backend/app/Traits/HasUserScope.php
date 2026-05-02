<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use App\Models\User;

/**
 * Trait to add a common scope that limits queries to the current user's data
 * when the user has the "salesman" role.
 */
trait HasUserScope
{
    /**
     * Scope the query to data visible for the given user.
     */
    public function scopeForUser(Builder $query, User $user): Builder
    {
        if ($user->role !== 'salesman') {
            return $query;
        }

        $column = property_exists($this, 'userScopeColumn') ? $this->userScopeColumn : 'user_id';
        return $query->where($column, $user->id);
    }
}
