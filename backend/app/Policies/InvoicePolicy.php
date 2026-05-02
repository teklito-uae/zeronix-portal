<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class InvoicePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, Invoice $invoice)
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $invoice->user_id === $user->id;
    }

    public function create(User $user)
    {
        return true;
    }

    public function update(User $user, Invoice $invoice)
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $invoice->user_id === $user->id;
    }

    public function delete(User $user, Invoice $invoice)
    {
        return $user->role === 'admin';
    }
}
