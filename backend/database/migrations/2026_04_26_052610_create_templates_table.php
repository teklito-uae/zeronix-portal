<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('templates', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Standard Quote", "Modern Invoice"
            $table->string('type'); // "quote" or "invoice"
            $table->string('key')->unique(); // e.g., "quote_standard", "invoice_modern"
            $table->string('subject')->nullable(); // For emails
            $table->text('content'); // The HTML/Blade content
            $table->text('email_body')->nullable(); // The email body content
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('templates');
    }
};
