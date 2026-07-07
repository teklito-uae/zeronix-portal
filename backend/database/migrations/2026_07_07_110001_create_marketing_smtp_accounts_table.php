<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_smtp_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('host');
            $table->unsignedInteger('port')->default(587);
            $table->string('encryption')->default('tls'); // tls | ssl | none
            $table->string('username');
            $table->text('password'); // encrypted cast on model
            $table->string('from_email');
            $table->string('from_name');
            $table->string('reply_to')->nullable();
            $table->unsignedInteger('per_minute_limit')->nullable();
            $table->unsignedInteger('hourly_limit')->nullable();
            $table->unsignedInteger('daily_limit')->nullable();
            $table->integer('priority')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('health_status')->default('healthy'); // healthy | warning | failed
            $table->unsignedInteger('consecutive_failures')->default(0);
            $table->text('last_error')->nullable();
            $table->timestamp('last_failure_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->unsignedBigInteger('total_sent')->default(0);
            $table->timestamps();

            $table->index(['company_id', 'is_active', 'health_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_smtp_accounts');
    }
};
