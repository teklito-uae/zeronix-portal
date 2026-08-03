<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sb_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('broadcast_id')->constrained('sb_broadcasts')->cascadeOnDelete();
            $table->foreignId('vendor_id')->nullable()->constrained('sb_vendors')->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('sb_categories')->nullOnDelete();
            $table->text('raw_line');
            $table->string('product_name')->nullable();
            $table->string('specs_text', 500)->nullable();
            $table->string('spec_ram', 20)->nullable();
            $table->string('spec_storage', 20)->nullable();
            $table->string('spec_cpu', 60)->nullable();
            $table->decimal('price', 12, 2)->nullable();
            $table->string('currency', 6)->nullable();
            $table->string('quantity_note', 100)->nullable();
            $table->enum('parse_confidence', ['high', 'medium', 'low'])->default('medium');
            $table->boolean('is_reviewed')->default(false);
            $table->timestamps();

            $table->index(['company_id', 'vendor_id']);
            $table->index(['company_id', 'category_id']);
        });

        // FULLTEXT index requires raw DDL (Blueprint has no fluent fulltext() in all versions used here)
        // SQLite (used by the automated test suite) has no FULLTEXT index
        // support at all — Schema::fullText() throws under that driver — so
        // this is skipped there; MySQL/production behavior is unchanged.
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            Schema::table('sb_products', function (Blueprint $table) {
                $table->fullText(['product_name', 'specs_text', 'raw_line']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('sb_products');
    }
};
