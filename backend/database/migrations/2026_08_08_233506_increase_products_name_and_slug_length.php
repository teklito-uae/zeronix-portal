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
        Schema::table('products', function (Blueprint $table) {
            $table->string('name', 500)->change();
            // slug is unique-indexed; utf8mb4 limits it to 250 chars to stay
            // under this DB's 1000-byte max key length (250 * 4 bytes).
            $table->string('slug', 250)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('name', 191)->change();
            $table->string('slug', 191)->nullable()->change();
        });
    }
};
