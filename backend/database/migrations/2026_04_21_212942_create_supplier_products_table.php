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
        Schema::create('supplier_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->cascadeOnDelete();
            $table->text('raw_text')->nullable();
            $table->string('identifier_hash')->nullable()->index();
            $table->string('model_code')->nullable()->index();
            $table->string('name')->nullable();
            $table->decimal('price', 12, 2)->nullable();
            $table->string('currency')->default('AED');
            $table->json('specs')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('availability')->default(true);
            $table->timestamp('last_pasted_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_products');
    }
};
