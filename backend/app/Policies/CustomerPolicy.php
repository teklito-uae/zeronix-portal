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
        if ($user->role === 'admin') {
            return true;
        }

        return $customer->user_id === $user->id;
    }

    public function create(User $user)
    {
        return true;
    }

    public function update(User $user, Customer $customer)
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $customer->user_id === $user->id;
    }

    public function delete(User $user, Customer $customer)
    {
        return $user->role === 'admin';
    }
}
