<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('subject');
            $table->string('preheader')->nullable();
            $table->longText('body_html');
            $table->string('category')->default('custom'); // welcome | introduction | follow_up | renewal | promotional | custom
            $table->string('channel')->default('email');
            $table->boolean('is_builtin')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('current_version')->default(1);
            $table->timestamps();

            $table->index(['company_id', 'channel', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_templates');
    }
};
