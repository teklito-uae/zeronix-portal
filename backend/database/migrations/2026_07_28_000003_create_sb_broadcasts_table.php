<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sb_broadcasts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('vendor_id')->nullable()->constrained('sb_vendors')->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('sb_categories')->nullOnDelete();
            $table->enum('source', ['manual_paste', 'extension'])->default('manual_paste');
            $table->mediumText('raw_text');
            $table->unsignedInteger('parsed_row_count')->default(0);
            $table->json('parse_warnings')->nullable();
            $table->foreignId('imported_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedBigInteger('imported_via_token_id')->nullable();
            $table->timestamp('whatsapp_message_ts')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'vendor_id']);
            $table->index(['company_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sb_broadcasts');
    }
};
