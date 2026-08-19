<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the existing unique index on email before changing nullability
        Schema::table('customers', function (Blueprint $table) {
            // Drop unique constraint if it exists (ignore error if not)
            try {
                $table->dropUnique(['email']);
            } catch (\Exception $e) {
                // Already dropped or doesn't exist
            }
        });

        // Make email nullable
        Schema::table('customers', function (Blueprint $table) {
            $table->string('email')->nullable()->change();
        });

        // Re-add unique index — MySQL and SQLite both allow multiple NULLs in a
        // unique column. Built through the schema builder rather than raw
        // `ALTER TABLE ... ADD CONSTRAINT` DDL so it also runs under SQLite
        // (which has no ADD CONSTRAINT); the resulting MySQL index is identical.
        Schema::table('customers', function (Blueprint $table) {
            $table->unique('email', 'customers_email_unique');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('email')->nullable(false)->change();
        });
    }
};
