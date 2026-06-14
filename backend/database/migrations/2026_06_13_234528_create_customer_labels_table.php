<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_labels', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g. DEIRA-CUSTOMER
            $table->string('color', 7)->default('#6366F1'); // hex color
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_labels');
    }
};
