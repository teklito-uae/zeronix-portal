<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\Enquiry;
use App\Models\EnquiryItem;
use App\Models\Quote;
use App\Models\QuoteItem;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\SupplierProduct;
use Illuminate\Support\Facades\Hash;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        $faker = \Faker\Factory::create();
        $adminUserId = User::where('role', 'admin')->first()->id ?? 1;

        // 1. Customers (30)
        for ($i = 1; $i <= 30; $i++) {
            Customer::create([
                'customer_code' => 'CUS-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'name' => $faker->name,
                'company' => $faker->company,
                'email' => "customer{$i}@example.com",
                'phone' => $faker->phoneNumber,
                'address' => $faker->address,
                'trn' => 'TRN' . $faker->numerify('###########'),
                'password' => Hash::make('password'),
                'user_id' => $adminUserId,
            ]);
        }
        $customerIds = Customer::pluck('id')->toArray();

        // 2. Suppliers (30)
        for ($i = 1; $i <= 30; $i++) {
            Supplier::create([
                'supplier_code' => 'SUP-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'name' => $faker->company,
                'contact_person' => $faker->name,
                'email' => "supplier{$i}@example.com",
                'phone' => $faker->phoneNumber,
                'website' => $faker->url,
                'address' => $faker->address,
            ]);
        }
        $supplierIds = Supplier::pluck('id')->toArray();

        // Ensure Brands and Categories exist
        $brandIds = Brand::pluck('id')->toArray();
        if (empty($brandIds)) {
            $brandIds = [Brand::create(['name' => 'Cisco'])->id];
        }
        $categoryIds = Category::pluck('id')->toArray();
        if (empty($categoryIds)) {
            $categoryIds = [Category::create(['name' => 'Networking'])->id];
        }

        // 3. Products (30)
        for ($i = 1; $i <= 30; $i++) {
            $product = Product::create([
                'category_id' => $faker->randomElement($categoryIds),
                'brand_id' => $faker->randomElement($brandIds),
                'name' => 'Product ' . $faker->words(3, true),
                'slug' => Str::slug('Product ' . $faker->words(3, true) . ' ' . $i . uniqid()),
                'description' => $faker->sentence,
                'model_code' => strtoupper($faker->bothify('MDL-####??')),
                'specs' => ['weight' => '1kg', 'color' => 'black'],
                'is_active' => true,
            ]);
            
            // Attach 1 to 3 suppliers to this product
            $numSuppliers = rand(1, 3);
            $selectedSuppliers = (array) array_rand(array_flip($supplierIds), $numSuppliers);
            foreach ($selectedSuppliers as $supId) {
                SupplierProduct::create([
                    'supplier_id' => $supId,
                    'product_id' => $product->id,
                    'price' => $faker->randomFloat(2, 50, 1000),
                    'currency' => 'AED',
                    'availability' => $faker->boolean(80),
                ]);
            }
        }
        $productIds = Product::pluck('id')->toArray();

        // 4. Enquiries (30)
        for ($i = 1; $i <= 30; $i++) {
            $enquiry = Enquiry::create([
                'customer_id' => $faker->randomElement($customerIds),
                'user_id' => $adminUserId,
                'assigned_to' => $adminUserId,
                'source' => $faker->randomElement(['email', 'phone', 'portal', 'walk-in']),
                'priority' => $faker->randomElement(['low', 'medium', 'high', 'urgent']),
                'status' => $faker->randomElement(['new', 'processing', 'quoted', 'won', 'lost']),
                'notes' => $faker->sentence,
                'created_at' => $faker->dateTimeBetween('-6 months', 'now'),
            ]);

            // Enquiry Items
            $numItems = rand(1, 5);
            for ($j = 0; $j < $numItems; $j++) {
                EnquiryItem::create([
                    'enquiry_id' => $enquiry->id,
                    'product_id' => $faker->randomElement($productIds),
                    'quantity' => rand(1, 10),
                ]);
            }
        }
        $enquiryIds = Enquiry::pluck('id')->toArray();

        // 5. Quotes (30)
        for ($i = 1; $i <= 30; $i++) {
            $enquiryId = $faker->randomElement($enquiryIds);
            $customerId = Enquiry::find($enquiryId)->customer_id;
            
            $subtotal = $faker->randomFloat(2, 100, 5000);
            $vat = $subtotal * 0.05;
            $total = $subtotal + $vat;

            $quote = Quote::create([
                'quote_number' => 'QT-' . str_pad($i, 5, '0', STR_PAD_LEFT),
                'enquiry_id' => $enquiryId,
                'customer_id' => $customerId,
                'user_id' => $adminUserId,
                'date' => Carbon::today()->subDays(rand(1, 30)),
                'valid_until' => Carbon::today()->addDays(rand(10, 30)),
                'subtotal' => $subtotal,
                'vat_amount' => $vat,
                'total' => $total,
                'status' => $faker->randomElement(['draft', 'sent', 'accepted', 'rejected', 'expired']),
            ]);

            // Quote Items
            $numItems = rand(1, 5);
            for ($j = 0; $j < $numItems; $j++) {
                QuoteItem::create([
                    'quote_id' => $quote->id,
                    'product_id' => $faker->randomElement($productIds),
                    'description' => $faker->sentence,
                    'quantity' => rand(1, 10),
                    'unit_price' => $faker->randomFloat(2, 50, 500),
                    'total' => $faker->randomFloat(2, 50, 500) * rand(1, 10),
                ]);
            }
        }
        $quoteIds = Quote::pluck('id')->toArray();

        // 6. Invoices (30)
        for ($i = 1; $i <= 30; $i++) {
            $quoteId = $faker->randomElement($quoteIds);
            $quote = Quote::find($quoteId);
            
            $invoice = Invoice::create([
                'invoice_number' => 'INV-' . str_pad($i, 5, '0', STR_PAD_LEFT),
                'quote_id' => $quote->id,
                'customer_id' => $quote->customer_id,
                'user_id' => $adminUserId,
                'date' => Carbon::today()->subDays(rand(1, 15)),
                'due_date' => Carbon::today()->addDays(rand(5, 15)),
                'subtotal' => $quote->subtotal,
                'vat_amount' => $quote->vat_amount,
                'total' => $quote->total,
                'status' => $faker->randomElement(['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled']),
            ]);

            // Invoice Items based on quote items
            foreach ($quote->items as $qItem) {
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'product_id' => $qItem->product_id,
                    'description' => $qItem->description,
                    'quantity' => $qItem->quantity,
                    'unit_price' => $qItem->unit_price,
                    'total' => $qItem->total,
                ]);
            }
        }
    }
}
