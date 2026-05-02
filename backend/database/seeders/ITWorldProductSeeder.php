<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\SupplierProduct;
use Illuminate\Support\Str;

class ITWorldProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Ensure Supplier Exists
        $supplier = Supplier::firstOrCreate(
            ['name' => 'IT World Trading LLC'],
            [
                'email' => 'sales@itworld.com',
                'phone' => '+971 4 356 1111',
                'address' => 'Bur Dubai, Dubai, UAE',
            ]
        );

        // 2. Ensure Brands Exist
        $brands = [
            'Seagate' => Brand::firstOrCreate(['name' => 'Seagate']),
            'Toshiba' => Brand::firstOrCreate(['name' => 'Toshiba']),
            'WD' => Brand::firstOrCreate(['name' => 'Western Digital']),
            'Synology' => Brand::firstOrCreate(['name' => 'Synology']),
        ];

        // 3. Ensure Categories Exist
        $categories = [
            'Storage' => Category::firstOrCreate(['name' => 'Storage']),
        ];

        $products = [
            // --- SEAGATE ---
            ['SEA-EXOS-8TB', 'Seagate Exos Enterprise Series 8TB 5 Years Warranty', 10, 'Storage', 'Seagate'],
            ['SEA-EXOS-10TB', 'Seagate Exos Enterprise Series 10TB 5 Years Warranty', 10, 'Storage', 'Seagate'],
            ['SEA-SKY-2TB', 'Seagate SkyHawk Surveillance Series 2TB 3 Years Warranty', 10, 'Storage', 'Seagate'],
            ['SEA-SKY-6TB', 'Seagate SkyHawk Surveillance Series 6TB 3 Years Warranty', 10, 'Storage', 'Seagate'],

            // --- TOSHIBA ---
            ['TOS-ENT-16TB', 'Toshiba Enterprise Series 16TB 5 Years Warranty', 10, 'Storage', 'Toshiba'],
            ['TOS-ENT-20TB', 'Toshiba Enterprise Series 20TB 5 Years Warranty', 10, 'Storage', 'Toshiba'],
            ['TOS-SUR-2TB', 'Toshiba Surveillance Series 2TB 3 Years Warranty', 10, 'Storage', 'Toshiba'],
            ['TOS-SUR-4TB', 'Toshiba Surveillance Series 4TB 3 Years Warranty', 10, 'Storage', 'Toshiba'],
            ['TOS-SUR-8TB', 'Toshiba Surveillance Series 8TB 3 Years Warranty', 10, 'Storage', 'Toshiba'],
            ['TOS-SUR-10TB', 'Toshiba Surveillance Series 10TB 3 Years Warranty', 10, 'Storage', 'Toshiba'],

            // --- WD ---
            ['WD-PUR-6TB', 'Western Digital WD Purple Surveillance 6TB 3 Years Warranty', 10, 'Storage', 'WD'],

            // --- SYNOLOGY ---
            ['SYN-PLUS-4TB', 'Synology Plus Series 4TB HDD', 10, 'Storage', 'Synology'],
            ['SYN-PLUS-6TB', 'Synology Plus Series 6TB HDD', 10, 'Storage', 'Synology'],
            ['SYN-PLUS-8TB', 'Synology Plus Series 8TB HDD', 10, 'Storage', 'Synology'],
            ['SYN-PLUS-12TB', 'Synology Plus Series 12TB HDD', 10, 'Storage', 'Synology'],
            ['SYN-PLUS-16TB', 'Synology Plus Series 16TB HDD', 10, 'Storage', 'Synology'],
            ['SYN-ENT-4TB', 'Synology Enterprise Series 4TB HDD', 10, 'Storage', 'Synology'],
            ['SYN-ENT-8TB', 'Synology Enterprise Series 8TB HDD', 10, 'Storage', 'Synology'],
            ['SYN-ENT-12TB', 'Synology Enterprise Series 12TB HDD', 10, 'Storage', 'Synology'],
            ['SYN-ENT-16TB', 'Synology Enterprise Series 16TB HDD', 10, 'Storage', 'Synology'],
            ['SYN-ENT-20TB', 'Synology Enterprise Series 20TB HDD', 10, 'Storage', 'Synology'],
            ['SYN-ENT-24TB', 'Synology Enterprise Series 24TB HDD', 10, 'Storage', 'Synology'],
        ];

        foreach ($products as [$modelCode, $fullName, $qty, $catKey, $brandKey]) {
            // 4. Create Master Product
            $productName = Str::limit($fullName, 191, '');
            $masterProduct = Product::updateOrCreate(
                ['model_code' => $modelCode],
                [
                    'name' => $productName,
                    'brand_id' => $brands[$brandKey]->id,
                    'category_id' => $categories[$catKey]->id,
                    'slug' => Str::slug(Str::limit($productName, 180, '')) . '-' . Str::random(5),
                    'is_active' => true,
                ]
            );

            // 5. Create Supplier Product
            SupplierProduct::updateOrCreate(
                [
                    'supplier_id' => $supplier->id,
                    'model_code' => $modelCode,
                ],
                [
                    'product_id' => $masterProduct->id,
                    'category_id' => $categories[$catKey]->id,
                    'name' => $productName,
                    'identifier_hash' => Str::random(8),
                    'raw_text' => $fullName,
                    'availability' => $qty > 0,
                    'last_pasted_at' => now(),
                    'is_active' => true,
                    'price' => null,
                ]
            );
        }
    }
}
