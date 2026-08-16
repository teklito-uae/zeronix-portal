<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * `templates` and `attendances` had no company_id column at all, meaning
     * every tenant's staff could read/edit every other tenant's document
     * templates, and (via the existing role:admin gate) any tenant admin could
     * see every tenant's clock-in/out data — there was no column to scope by.
     *
     * NOTE: existing rows in both tables will have company_id = NULL after this
     * migration runs. Because App\Traits\BelongsToCompany applies a global scope
     * of `where('company_id', $user->company_id)` for non-super_admin users, any
     * NULL-company_id row becomes invisible to every tenant once the trait is
     * added to the models. This migration intentionally does NOT attempt to
     * backfill company_id for pre-existing rows — that requires a manual,
     * reviewed data-assignment step (see report).
     */
    public function up(): void
    {
        if (Schema::hasTable('templates') && !Schema::hasColumn('templates', 'company_id')) {
            Schema::table('templates', function (Blueprint $table) {
                $table->foreignId('company_id')->nullable()->after('id')->constrained('companies')->nullOnDelete();
                $table->index('company_id');
            });
        }

        if (Schema::hasTable('attendances') && !Schema::hasColumn('attendances', 'company_id')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->foreignId('company_id')->nullable()->after('id')->constrained('companies')->nullOnDelete();
                $table->index('company_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('templates', 'company_id')) {
            Schema::table('templates', function (Blueprint $table) {
                $table->dropForeign(['company_id']);
                $table->dropColumn('company_id');
            });
        }

        if (Schema::hasColumn('attendances', 'company_id')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->dropForeign(['company_id']);
                $table->dropColumn('company_id');
            });
        }
    }
};
