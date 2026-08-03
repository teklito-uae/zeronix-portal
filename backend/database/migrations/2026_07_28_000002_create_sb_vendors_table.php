<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sb_vendors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('company_name')->nullable();
            $table->string('phone_raw');
            $table->string('phone_e164')->nullable();
            $table->string('whatsapp_chat_name')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('sb_categories')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->enum('source', ['manual', 'extension'])->default('manual');
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['company_id', 'phone_e164']);
            $table->index(['company_id', 'category_id']);
            $table->index(['company_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sb_vendors');
    }
};
