<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class CustomerPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, Customer $customer)
    {
        if (in_array($user->role, ['admin', 'super_admin'], true)) {
            return true;
        }

        // customers.user_id was dropped in favor of the customer_user pivot.
        return $customer->assigned_users()->where('users.id', $user->id)->exists();
    }

    public function create(User $user)
    {
        return true;
    }

    public function update(User $user, Customer $customer)
    {
        if (in_array($user->role, ['admin', 'super_admin'], true)) {
            return true;
        }

        // customers.user_id was dropped in favor of the customer_user pivot.
        return $customer->assigned_users()->where('users.id', $user->id)->exists();
    }

    public function delete(User $user, Customer $customer)
    {
        return in_array($user->role, ['admin', 'super_admin'], true);
    }
}
