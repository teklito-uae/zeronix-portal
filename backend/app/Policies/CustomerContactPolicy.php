<?php

namespace App\Policies;

use App\Models\CustomerContact;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class CustomerContactPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, CustomerContact $contact): bool
    {
        if (in_array($user->role, ['admin', 'super_admin'], true)) {
            return true;
        }

        // Customer no longer has a plain user_id owner column (dropped in
        // favor of the customer_user pivot) — assigned_users() is the only
        // check that applies.
        return $contact->customer->assigned_users()->where('users.id', $user->id)->exists();
    }

    public function create(User $user)
    {
        return true;
    }

    public function update(User $user, CustomerContact $contact): bool
    {
        return $this->view($user, $contact);
    }

    public function delete(User $user, CustomerContact $contact): bool
    {
        return $this->view($user, $contact);
    }
}
