<?php

namespace App\Policies;

use App\Models\Expense;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ExpensePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, Expense $expense): bool
    {
        return $this->ownsOrManages($user, $expense);
    }

    public function create(User $user)
    {
        return true;
    }

    public function update(User $user, Expense $expense): bool
    {
        return $this->ownsOrManages($user, $expense);
    }

    public function delete(User $user, Expense $expense): bool
    {
        return $this->ownsOrManages($user, $expense);
    }

    /**
     * Mirrors the three-tier `forUser()` scope (HasUserScope) already applied
     * in ExpenseController::index(): admin/super_admin unrestricted; manager
     * also sees/manages expenses owned by their direct reports; everyone else
     * only their own (expenses.user_id).
     */
    private function ownsOrManages(User $user, Expense $expense): bool
    {
        if (in_array($user->role, ['admin', 'super_admin'], true)) {
            return true;
        }

        if ($user->role === 'manager') {
            $reportIds = User::where('manager_id', $user->id)->pluck('id')->all();
            if (in_array($expense->user_id, $reportIds, true)) {
                return true;
            }
        }

        return $expense->user_id === $user->id;
    }
}
