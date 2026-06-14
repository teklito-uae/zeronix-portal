<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_label_pivot', function (Blueprint $table) {
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('label_id')->constrained('customer_labels')->cascadeOnDelete();
            $table->primary(['customer_id', 'label_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_label_pivot');
    }
};
