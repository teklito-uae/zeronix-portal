<?php

namespace App\Policies;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class LeadPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, Lead $lead): bool
    {
        if (in_array($user->role, ['admin', 'super_admin'], true)) {
            return true;
        }

        return $lead->assigned_users()->where('users.id', $user->id)->exists() || $lead->user_id === $user->id;
    }

    public function create(User $user)
    {
        return true;
    }

    public function update(User $user, Lead $lead): bool
    {
        if (in_array($user->role, ['admin', 'super_admin'], true)) {
            return true;
        }

        return $lead->assigned_users()->where('users.id', $user->id)->exists() || $lead->user_id === $user->id;
    }

    public function delete(User $user, Lead $lead)
    {
        return in_array($user->role, ['admin', 'super_admin'], true);
    }
}
