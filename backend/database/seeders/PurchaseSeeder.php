<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PurchaseBill;
use App\Models\PurchaseBillItem;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;

class PurchaseSeeder extends Seeder
{
    public function run(): void
    {
        $faker = \Faker\Factory::create();
        
        $adminUserId = User::where('role', 'admin')->first()->id ?? User::first()->id ?? 1;
        
        $supplierIds = Supplier::pluck('id')->toArray();
        $products = Product::inRandomOrder()->limit(50)->get();
        
        if (empty($supplierIds) || $products->isEmpty()) {
            $this->command->info('Please seed suppliers and products first.');
            return;
        }

        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        PurchaseBillItem::truncate();
        PurchaseBill::truncate();
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Create 20 Purchase Bills
        for ($i = 1; $i <= 20; $i++) {
            $subtotal = 0;
            $items = [];
            
            // 1 to 5 items per bill
            $numItems = rand(1, 5);
            $selectedProducts = $products->random($numItems);
            
            foreach ($selectedProducts as $product) {
                $quantity = rand(1, 50);
                $unitPrice = $faker->randomFloat(2, 10, 500);
                $itemSubtotal = $quantity * $unitPrice;
                $taxPercent = 5.00;
                $taxAmount = $itemSubtotal * ($taxPercent / 100);
                $itemTotal = $itemSubtotal + $taxAmount;
                
                $items[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'description' => $faker->sentence,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'tax_percent' => $taxPercent,
                    'tax_amount' => $taxAmount,
                    'total' => $itemTotal,
                ];
                
                $subtotal += $itemSubtotal;
            }
            
            $vatAmount = $subtotal * 0.05;
            $total = $subtotal + $vatAmount;
            
            $bill = PurchaseBill::create([
                'bill_number' => 'PB-' . str_pad($i, 5, '0', STR_PAD_LEFT),
                'company_id' => User::find($adminUserId)->company_id,
                'supplier_id' => $faker->randomElement($supplierIds),
                'user_id' => $adminUserId,
                'date' => Carbon::today()->subDays(rand(1, 60)),
                'due_date' => Carbon::today()->addDays(rand(0, 30)),
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'total' => $total,
                'status' => $faker->randomElement(['draft', 'open', 'paid', 'overdue', 'cancelled']),
            ]);
            
            foreach ($items as $itemData) {
                $itemData['purchase_bill_id'] = $bill->id;
                PurchaseBillItem::create($itemData);
            }
        }
        
        $this->command->info('Purchase Bills seeded successfully.');
    }
}
