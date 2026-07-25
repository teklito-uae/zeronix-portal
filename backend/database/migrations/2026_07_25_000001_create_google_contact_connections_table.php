<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('google_contact_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('connected_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('google_account_email')->nullable();
            $table->text('access_token'); // encrypted cast on model
            $table->text('refresh_token')->nullable(); // encrypted cast on model
            $table->timestamp('token_expires_at')->nullable();
            $table->string('sync_status')->default('idle'); // idle | syncing | error
            $table->timestamp('last_synced_at')->nullable();
            $table->text('last_error')->nullable();
            $table->unsignedInteger('consecutive_failures')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('google_contact_connections');
    }
};
