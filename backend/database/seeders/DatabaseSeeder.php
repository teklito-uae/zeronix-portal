<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Customer;
use App\Models\Quote;
use App\Models\QuoteItem;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Brand;
use App\Models\Category;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Admin User
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@zeronix.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        // 2. Sample Brands
        $brandNames = ['Cisco', 'Dell', 'HP', 'Lenovo', 'Fortinet'];
        foreach ($brandNames as $name) {
            Brand::create(['name' => $name]);
        }

        // 3. Sample Categories
        $categories = [
            ['name' => 'Networking', 'children' => ['Switches', 'Routers', 'Access Points']],
            ['name' => 'Servers', 'children' => ['Rack Servers', 'Tower Servers']],
        ];

        foreach ($categories as $cat) {
            $parent = Category::create(['name' => $cat['name']]);
            foreach ($cat['children'] as $child) {
                Category::create(['name' => $child, 'parent_id' => $parent->id]);
            }
        }

        // 4. Sample Customer
        $customer = Customer::create([
            'name' => 'John Doe',
            'company' => 'Global Tech Solutions',
            'email' => 'customer@example.com',
            'address' => 'Business Bay, Dubai, UAE',
            'phone' => '+971 50 123 4567',
            'password' => bcrypt('password'),
        ]);

        // 5. Sample Quote with Items
        $quote = Quote::create([
            'quote_number' => 'QT-2024-001',
            'customer_id' => $customer->id,
            'status' => 'sent',
            'date' => now()->format('Y-m-d'),
            'valid_until' => now()->addDays(30)->format('Y-m-d'),
            'subtotal' => 10000.00,
            'vat_amount' => 500.00,
            'total' => 10500.00,
            'reference_id' => 'REF-9988',
        ]);

        QuoteItem::create([
            'quote_id' => $quote->id,
            'product_name' => 'Cisco Catalyst 9200L',
            'description' => '24-port PoE+ Switch with Network Essentials',
            'quantity' => 2,
            'unit_price' => 5000.00,
            'total' => 10000.00,
        ]);

        // 6. Sample Invoice with Items
        $invoice = Invoice::create([
            'invoice_number' => 'INV-2024-001',
            'customer_id' => $customer->id,
            'status' => 'unpaid',
            'date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(15)->format('Y-m-d'),
            'subtotal' => 15000.00,
            'vat_amount' => 750.00,
            'total' => 15750.00,
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'product_name' => 'Dell PowerEdge R750',
            'description' => 'Intel Xeon Gold 6330, 64GB RAM, 1.2TB SAS',
            'quantity' => 1,
            'unit_price' => 15000.00,
            'total' => 15000.00,
        ]);
    }
}
