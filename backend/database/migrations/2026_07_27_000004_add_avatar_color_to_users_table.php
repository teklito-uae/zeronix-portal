<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Curated set of on-brand accent colors. Kept in sync with
    // App\Models\User::AVATAR_COLOR_POOL, which assigns from the same list
    // on creation.
    private const COLOR_POOL = [
        '#cc063e', '#e83535', '#fd9407', '#10898b', '#0f52ba',
        '#6366f1', '#8b5cf6', '#ec4899', '#059669', '#d97706',
    ];

    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar_color', 9)->nullable()->after('designation');
        });

        // Backfill existing users so nobody is left without a persisted
        // avatar color after this migration ships.
        $users = DB::table('users')->select('id')->orderBy('id')->get();
        $pool = self::COLOR_POOL;
        foreach ($users as $i => $user) {
            DB::table('users')->where('id', $user->id)->update([
                'avatar_color' => $pool[$i % count($pool)],
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('avatar_color');
        });
    }
};
