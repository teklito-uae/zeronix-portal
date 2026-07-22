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

    public function view(User $user, Deal $deal)
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $deal->user_id === $user->id;
    }

    public function create(User $user)
    {
        return true;
    }

    public function update(User $user, Deal $deal)
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $deal->user_id === $user->id;
    }

    public function delete(User $user, Deal $deal)
    {
        return $user->role === 'admin';
    }
}
