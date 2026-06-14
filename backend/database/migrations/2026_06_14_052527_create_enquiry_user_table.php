<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('enquiry_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enquiry_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['enquiry_id', 'user_id']);
        });

        // Migrate existing assigned users
        DB::table('enquiries')->whereNotNull('assigned_to')->orderBy('id')->chunk(100, function ($enquiries) {
            $inserts = [];
            foreach ($enquiries as $enquiry) {
                $inserts[] = [
                    'enquiry_id' => $enquiry->id,
                    'user_id' => $enquiry->assigned_to,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            DB::table('enquiry_user')->insert($inserts);
        });

        Schema::table('enquiries', function (Blueprint $table) {
            $table->dropForeign(['assigned_to']);
            $table->dropColumn('assigned_to');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enquiries', function (Blueprint $table) {
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
        });

        DB::table('enquiry_user')->orderBy('id')->chunk(100, function ($pivotRecords) {
            foreach ($pivotRecords as $record) {
                // only update if not already set, to get the first one
                $enq = DB::table('enquiries')->where('id', $record->enquiry_id)->first();
                if ($enq && !$enq->assigned_to) {
                    DB::table('enquiries')->where('id', $record->enquiry_id)->update(['assigned_to' => $record->user_id]);
                }
            }
        });

        Schema::dropIfExists('enquiry_user');
    }
};
