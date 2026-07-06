<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['stage_id', 'stage_name', 'lead_stage_id', 'crm_source_id', 'source_name', 'parent_client_id']);
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('stage_id')->nullable();
            $table->string('stage_name')->nullable();
            $table->string('lead_stage_id')->nullable();
            $table->string('crm_source_id')->nullable();
            $table->string('source_name')->nullable();
            $table->string('parent_client_id')->nullable();
        });
    }
};
