<?php

namespace App\Policies;

use App\Models\Deal;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class DealPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, Deal $deal): bool
    {
        if (in_array($user->role, ['admin', 'super_admin'], true)) {
            return true;
        }

        return $deal->assigned_users()->where('users.id', $user->id)->exists() || $deal->user_id === $user->id;
    }

    public function create(User $user)
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Deal $deal): bool
    {
        if (in_array($user->role, ['admin', 'super_admin'], true)) {
            return true;
        }

        return $deal->assigned_users()->where('users.id', $user->id)->exists() || $deal->user_id === $user->id;
    }

    public function delete(User $user, Deal $deal)
    {
        return in_array($user->role, ['admin', 'super_admin'], true);
    }
}
