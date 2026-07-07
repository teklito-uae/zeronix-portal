<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('channel')->default('email');
            $table->string('status')->default('draft'); // draft | scheduled | sending | paused | completed | cancelled | failed
            $table->foreignId('template_id')->nullable()->constrained('marketing_templates')->nullOnDelete();
            $table->string('subject')->nullable();
            $table->longText('body_html')->nullable(); // snapshotted from template at launch
            $table->string('preheader')->nullable();
            $table->json('links')->nullable(); // original hrefs extracted at launch, click redirect indexes into this
            $table->json('audience_config')->nullable(); // {sources: [{type, ...}]}
            $table->string('schedule_type')->default('immediate'); // immediate | scheduled
            $table->timestamp('scheduled_at')->nullable(); // UTC
            $table->string('timezone')->nullable();
            $table->foreignId('smtp_account_id')->nullable()->constrained('marketing_smtp_accounts')->nullOnDelete(); // NULL = rotate pool
            $table->json('settings_snapshot')->nullable(); // rates/windows frozen at launch

            $table->unsignedInteger('total_recipients')->default(0);
            $table->unsignedInteger('pending_count')->default(0);
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('delivered_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->unsignedInteger('deferred_count')->default(0);
            $table->unsignedInteger('bounced_count')->default(0);
            $table->unsignedInteger('skipped_count')->default(0);
            $table->unsignedInteger('opened_count')->default(0);
            $table->unsignedInteger('open_events_count')->default(0);
            $table->unsignedInteger('clicked_count')->default(0);
            $table->unsignedInteger('click_events_count')->default(0);
            $table->unsignedInteger('unsubscribed_count')->default(0);
            $table->unsignedInteger('retry_count')->default(0);

            $table->timestamp('launched_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'status']);
            $table->index(['status', 'scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_campaigns');
    }
};
