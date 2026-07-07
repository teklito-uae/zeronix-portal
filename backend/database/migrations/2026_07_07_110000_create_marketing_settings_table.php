<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('timezone')->default('Asia/Dubai');
            $table->json('business_days')->nullable(); // [1..5] Mon-Fri (ISO weekday numbers)
            $table->time('send_start_time')->default('09:00:00');
            $table->time('send_end_time')->default('18:00:00');
            $table->boolean('enforce_business_hours')->default(true);
            $table->unsignedInteger('min_interval_seconds')->default(20);
            $table->unsignedInteger('max_interval_seconds')->default(90);
            $table->unsignedInteger('rate_per_minute')->default(10);
            $table->unsignedInteger('rate_per_hour')->default(200);
            $table->unsignedInteger('rate_per_day')->default(1000);
            $table->json('per_domain_limits')->nullable(); // {"gmail.com": 60, ...} per-hour caps
            $table->unsignedInteger('cool_off_hours')->default(72);
            $table->unsignedInteger('max_emails_per_recipient_per_month')->default(4);
            $table->unsignedInteger('duplicate_protection_days')->default(14);
            $table->boolean('track_opens')->default(true);
            $table->boolean('track_clicks')->default(true);
            $table->boolean('append_unsubscribe_footer')->default(true);
            $table->text('unsubscribe_footer_html')->nullable();
            $table->string('default_test_email')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_settings');
    }
};
