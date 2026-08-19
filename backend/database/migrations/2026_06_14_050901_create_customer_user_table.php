<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('customer_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            
            $table->unique(['customer_id', 'user_id']);
        });

        // Migrate existing data
        $customers = DB::table('customers')->whereNotNull('user_id')->get();
        $pivotData = [];
        foreach ($customers as $customer) {
            $pivotData[] = [
                'customer_id' => $customer->id,
                'user_id' => $customer->user_id,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($pivotData)) {
            DB::table('customer_user')->insert($pivotData);
        }

        // Drop user_id column from customers
        Schema::table('customers', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        // SQLite rebuilds the whole table on DROP COLUMN and fails if any index
        // still references the dropped column, so drop those indexes first.
        // Indexes on a dropped column are dead weight under MySQL too, so this
        // runs for every driver rather than being driver-guarded.
        foreach (Schema::getIndexes('customers') as $index) {
            if (in_array('user_id', $index['columns'], true)) {
                Schema::table('customers', function (Blueprint $table) use ($index) {
                    $table->dropIndex($index['name']);
                });
            }
        }

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
        });

        // Migrate back first user per customer
        $relations = DB::table('customer_user')->get();
        foreach ($relations as $rel) {
            DB::table('customers')->where('id', $rel->customer_id)->update(['user_id' => $rel->user_id]);
        }

        Schema::dropIfExists('customer_user');
    }
};
