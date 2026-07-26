<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('lead_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['lead_id', 'user_id']);
        });

        // Backfill from leads.user_id — the column itself is left in place,
        // other code still reads it. Written defensively with insertOrIgnore
        // so re-running this migration never creates duplicate pivot rows
        // (the unique[lead_id,user_id] constraint would also block them).
        $now = now();
        DB::table('leads')->whereNotNull('user_id')->orderBy('id')->chunk(200, function ($leads) use ($now) {
            $rows = [];
            foreach ($leads as $lead) {
                $rows[] = [
                    'lead_id' => $lead->id,
                    'user_id' => $lead->user_id,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            if (!empty($rows)) {
                DB::table('lead_user')->insertOrIgnore($rows);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lead_user');
    }
};
