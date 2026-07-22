<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $users = DB::table('users')->whereNotNull('permissions')->get(['id', 'permissions']);

        foreach ($users as $user) {
            $perms = json_decode($user->permissions, true);

            if (!is_array($perms) || !in_array('customers', $perms, true)) {
                continue;
            }

            $perms = array_values(array_unique(array_map(
                fn ($perm) => $perm === 'customers' ? 'companies' : $perm,
                $perms
            )));

            DB::table('users')->where('id', $user->id)->update(['permissions' => json_encode($perms)]);
        }
    }

    public function down(): void
    {
        $users = DB::table('users')->whereNotNull('permissions')->get(['id', 'permissions']);

        foreach ($users as $user) {
            $perms = json_decode($user->permissions, true);

            if (!is_array($perms) || !in_array('companies', $perms, true)) {
                continue;
            }

            $perms = array_values(array_unique(array_map(
                fn ($perm) => $perm === 'companies' ? 'customers' : $perm,
                $perms
            )));

            DB::table('users')->where('id', $user->id)->update(['permissions' => json_encode($perms)]);
        }
    }
};
