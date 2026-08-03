<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // sb_extension_audit_logs has an FK to sb_extension_tokens, so it must go first.
        Schema::dropIfExists('sb_extension_audit_logs');
        Schema::dropIfExists('sb_extension_tokens');
    }

    public function down(): void
    {
        Schema::create('sb_extension_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('personal_access_token_id')->nullable()->unique();
            $table->foreign('personal_access_token_id')
                ->references('id')->on('personal_access_tokens')
                ->nullOnDelete();
            $table->string('label');
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'user_id']);
        });

        Schema::create('sb_extension_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('sb_extension_token_id')->nullable()->constrained('sb_extension_tokens')->nullOnDelete();
            $table->string('action', 60);
            $table->string('ip_address', 45)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['company_id', 'created_at']);
        });
    }
};
