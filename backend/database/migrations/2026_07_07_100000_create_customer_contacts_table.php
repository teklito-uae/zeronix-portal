<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('first_name');
            $table->string('last_name')->nullable();
            $table->string('full_name');
            $table->string('designation')->nullable();
            $table->string('department')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('mobile')->nullable();
            $table->string('extension')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->foreignId('company_id')->nullable()->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->index('email');
        });

        // Backward compatibility: give every existing customer a primary contact
        // derived from its own name/email/phone so primaryContact() never returns null.
        DB::table('customers')->select('id', 'name', 'email', 'phone', 'company_id')->orderBy('id')->each(function ($customer) {
            DB::table('customer_contacts')->insert([
                'customer_id' => $customer->id,
                'first_name' => $customer->name ?: 'Unknown',
                'last_name' => null,
                'full_name' => $customer->name ?: 'Unknown',
                'email' => $customer->email,
                'phone' => $customer->phone,
                'is_primary' => true,
                'is_active' => true,
                'company_id' => $customer->company_id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_contacts');
    }
};
