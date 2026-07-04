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
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('company_id')->nullable();
            $table->string('number')->nullable();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('salutation')->nullable();
            $table->string('job_title')->nullable();
            $table->text('description')->nullable();
            $table->string('tax_number')->nullable();
            $table->string('website')->nullable();
            $table->string('parent_client_id')->nullable();
            $table->string('stage_id')->nullable();
            $table->string('stage_name')->nullable();
            $table->string('lead_stage_id')->nullable();
            $table->unsignedBigInteger('owner_user_id')->nullable();
            $table->string('crm_source_id')->nullable();
            $table->string('source_name')->nullable();
            $table->string('currency')->nullable();
            $table->text('internal_notes')->nullable();
            $table->string('profile_image')->nullable();
            $table->string('instagram')->nullable();
            $table->string('facebook')->nullable();
            $table->string('linkedin')->nullable();
            $table->string('twitter')->nullable();
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->boolean('show_job_amount_to_worker')->default(true);
            $table->boolean('is_client_portal_enabled')->default(true);
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('owner_user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
