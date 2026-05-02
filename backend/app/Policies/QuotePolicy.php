<?php

namespace App\Policies;

use App\Models\Quote;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class QuotePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, Quote $quote)
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $quote->user_id === $user->id;
    }

    public function create(User $user)
    {
        return true;
    }

    public function update(User $user, Quote $quote)
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $quote->user_id === $user->id;
    }

    public function delete(User $user, Quote $quote)
    {
        return $user->role === 'admin';
    }
}
