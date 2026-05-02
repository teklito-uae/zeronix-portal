<?php

namespace App\Policies;

use App\Models\Enquiry;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class EnquiryPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, Enquiry $enquiry)
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $enquiry->assigned_to === $user->id || $enquiry->user_id === $user->id;
    }

    public function create(User $user)
    {
        return true;
    }

    public function update(User $user, Enquiry $enquiry)
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $enquiry->assigned_to === $user->id || $enquiry->user_id === $user->id;
    }

    public function delete(User $user, Enquiry $enquiry)
    {
        return $user->role === 'admin';
    }
}
