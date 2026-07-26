<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use App\Models\User;

/**
 * Trait to add a common scope that limits queries to the data visible to a
 * given user, based on a three-tier permission model:
 *
 *  - admin / super_admin: unrestricted, see everything.
 *  - manager: sees records they own / are assigned to, OR that are owned by
 *    / assigned to any of their direct reports.
 *  - everyone else (salesman, staff, ...): sees only records they own or are
 *    assigned to themselves — same restrictive behavior as before.
 */
trait HasUserScope
{
    /**
     * Scope the query to data visible for the given user.
     */
    public function scopeForUser(Builder $query, User $user): Builder
    {
        if (in_array($user->role, ['admin', 'super_admin'], true)) {
            return $query;
        }

        $userIds = [$user->id];

        if ($user->role === 'manager') {
            $reportIds = User::where('manager_id', $user->id)->pluck('id')->all();
            $userIds = array_values(array_unique(array_merge($userIds, $reportIds)));
        }

        $hasAssignedUsers = method_exists($this, 'assigned_users');
        $column = property_exists($this, 'userScopeColumn') ? $this->userScopeColumn : 'user_id';
        $hasColumn = in_array($column, $this->getFillable(), true);

        if (!$hasAssignedUsers && !$hasColumn) {
            // Model has neither a pivot relation nor a known owner column —
            // fall back to the legacy unconditional column filter so behavior
            // is unchanged for models this rewrite doesn't otherwise touch.
            return $query->whereIn($column, $userIds);
        }

        return $query->where(function (Builder $q) use ($hasAssignedUsers, $hasColumn, $column, $userIds) {
            if ($hasAssignedUsers) {
                $q->orWhereHas('assigned_users', function ($sub) use ($userIds) {
                    $sub->whereIn('users.id', $userIds);
                });
            }

            if ($hasColumn) {
                $q->orWhereIn($column, $userIds);
            }
        });
    }
}
