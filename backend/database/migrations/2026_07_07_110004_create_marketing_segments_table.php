<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_segments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('source'); // leads | customers | contacts
            $table->json('filters')->nullable();
            $table->unsignedInteger('cached_count')->nullable();
            $table->timestamp('counted_at')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'source']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_segments');
    }
};
