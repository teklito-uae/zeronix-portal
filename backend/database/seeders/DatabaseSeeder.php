<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Enquiry;
use App\Models\Quote;
use App\Models\Invoice;
use App\Models\ActivityLog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        // Wipe Data
        $tables = [
            'users', 'companies', 'customers', 'enquiries', 'quotes', 
            'invoices', 'activity_logs', 'products', 'categories', 
            'brands', 'suppliers', 'supplier_products', 'enquiry_items',
            'quote_items', 'invoice_items', 'customer_labels', 
            'payment_receipts', 'sticky_notes', 'attendances', 'tasks',
            'customer_user', 'enquiry_user'
        ];

        foreach ($tables as $table) {
            DB::table($table)->truncate();
        }

        Schema::enableForeignKeyConstraints();

        // 1. Create Super Admin
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@zeronix.com',
            'password' => Hash::make('password123'),
            'role' => 'super_admin',
            // super_admin does not strictly need a company_id, but keeping null is fine
        ]);

        // 2. Create Company
        $company = Company::create([
            'name' => 'Acme Corp',
            'email' => 'contact@acmecorp.com',
            'status' => 'active',
            'is_client_portal_enabled' => true,
        ]);

        // 3. Create Tenant Admin
        $tenantAdmin = User::create([
            'name' => 'Acme Owner',
            'email' => 'owner@acmecorp.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'company_id' => $company->id,
        ]);

        // 4. Create Tenant Staff
        $tenantStaff = User::create([
            'name' => 'Acme Sales',
            'email' => 'sales@acmecorp.com',
            'password' => Hash::make('password123'),
            'role' => 'salesman',
            'company_id' => $company->id,
        ]);

        // Authenticate as Tenant Admin so global scopes / traits automatically assign company_id
        auth()->login($tenantAdmin);

        // 5. Run the existing product seeders for the tenant
        $this->call([
            ProductionSupplierSeeder::class,
            AlErshadProductSeeder::class,
            AlRafaProductSeeder::class,
            AppleWhiteProductSeeder::class,
            CapComputerProductSeeder::class,
            GrandPCDProductSeeder::class,
            ITWorldProductSeeder::class,
            SimmalProductSeeder::class,
            SuperTechProductSeeder::class,
        ]);

        // Fix company_id for the seeders that bypass eloquent creating events via bulk inserts
        DB::table('suppliers')->update(['company_id' => $company->id]);
        DB::table('categories')->update(['company_id' => $company->id]);
        DB::table('brands')->update(['company_id' => $company->id]);
        DB::table('products')->update(['company_id' => $company->id]);

        // 6. Dummy Tenant Data (Customers)
        $customers = [];
        for ($i = 1; $i <= 5; $i++) {
            $customer = Customer::create([
                'name' => "Dummy Customer $i",
                'email' => "customer$i@example.com",
                'phone' => "123456789$i",
                'company' => "Client Company $i",
                'company_id' => $company->id,
                'password' => Hash::make('password123'),
            ]);
            $customer->assigned_users()->attach($tenantStaff->id);
            $customers[] = $customer;
        }

        // 7. Dummy Tenant Data (Enquiries & Invoices)
        foreach ($customers as $index => $customer) {
            $enquiry = Enquiry::create([
                'customer_id' => $customer->id,
                'user_id' => $tenantStaff->id,
                'company_id' => $company->id,
                'status' => 'new',
                'source' => 'portal',
                'priority' => 'high',
                'notes' => 'Looking for bulk electronics.',
            ]);

            $enquiry->items()->create([
                'product_id' => Product::first()->id ?? null,
                'quantity' => 5,
                'description' => 'Need good discount',
            ]);

            $invoice = Invoice::create([
                'customer_id' => $customer->id,
                'user_id' => $tenantAdmin->id,
                'company_id' => $company->id,
                'invoice_number' => 'INV-2026-00' . ($index + 1),
                'status' => 'paid',
                'date' => now(),
                'due_date' => now()->addDays(14),
                'subtotal' => 5000,
                'vat_amount' => 250,
                'total' => 5250,
            ]);

            $invoice->items()->create([
                'product_id' => Product::first()->id ?? null,
                'product_name' => Product::first()->name ?? 'Dummy Product',
                'quantity' => 1,
                'unit_price' => 5000,
                'total' => 5000,
            ]);
        }

        auth()->logout();

        // 8. Seed Platform Activities (System Level)
        ActivityLog::create([
            'user_id' => $superAdmin->id,
            'action' => 'system_updated',
            'description' => 'System successfully upgraded to Zeronix v2.1.0 (Architecture Shift)',
            'properties' => json_encode(['version' => '2.1.0']),
        ]);

        ActivityLog::create([
            'user_id' => $superAdmin->id,
            'action' => 'tenant_registered',
            'description' => 'Acme Corp registered as a new tenant on the platform.',
            'properties' => json_encode(['company_id' => $company->id]),
        ]);

        ActivityLog::create([
            'user_id' => $superAdmin->id,
            'action' => 'database_maintenance',
            'description' => 'Performed database vacuum and indexed global search fields.',
            'properties' => json_encode([]),
        ]);
    }
}
