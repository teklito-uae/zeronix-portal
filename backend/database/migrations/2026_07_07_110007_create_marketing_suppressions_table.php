<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_suppressions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 10)->default('email'); // email | domain
            $table->string('value', 191); // lowercased email or bare domain
            $table->string('type'); // unsubscribe | hard_bounce | spam | invalid | blocked_domain | manual
            $table->foreignId('source_campaign_id')->nullable()->constrained('marketing_campaigns')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['company_id', 'kind', 'value']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_suppressions');
    }
};
