<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_campaign_recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('campaign_id')->constrained('marketing_campaigns')->cascadeOnDelete();
            $table->string('channel')->default('email');
            $table->string('source_type'); // lead | customer | contact | manual | csv
            $table->unsignedBigInteger('source_id')->nullable();
            $table->string('email'); // lowercased
            $table->string('name')->nullable();
            $table->json('merge_data')->nullable(); // variable snapshot resolved at prepare time
            $table->char('token', 40)->unique(); // open/click/unsubscribe tracking token
            $table->string('status')->default('pending'); // pending | queued | sending | sent | delivered | failed | deferred | bounced | spam | unsubscribed | skipped
            $table->string('skipped_reason')->nullable(); // suppressed | cool_off | frequency_cap | duplicate_protection | cancelled | invalid_email
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->text('last_error')->nullable();
            $table->foreignId('smtp_account_id')->nullable()->constrained('marketing_smtp_accounts')->nullOnDelete();
            $table->string('message_id')->nullable();
            $table->string('bounce_type')->nullable(); // hard | soft
            $table->timestamp('queued_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('bounced_at')->nullable();
            $table->timestamp('opened_at')->nullable();
            $table->timestamp('last_opened_at')->nullable();
            $table->unsignedInteger('open_count')->default(0);
            $table->timestamp('clicked_at')->nullable();
            $table->unsignedInteger('click_count')->default(0);
            $table->timestamp('unsubscribed_at')->nullable();
            $table->timestamps();

            $table->unique(['campaign_id', 'email']); // per-campaign dedupe
            $table->index(['campaign_id', 'status']); // pacing pulls
            $table->index(['company_id', 'email', 'sent_at']); // cool-off / frequency cap
            $table->index(['smtp_account_id', 'sent_at']); // per-account rate windows
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_campaign_recipients');
    }
};
