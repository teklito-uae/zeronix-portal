<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\SupplierProduct;
use Illuminate\Support\Str;

class SimmalProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Ensure Supplier Exists
        $supplier = Supplier::firstOrCreate(
            ['name' => 'SIMMAL TECHNOLOGIES LLC'],
            [
                'email' => 'sales@simmal.com',
                'phone' => '+971 4 357 1111',
                'address' => 'Bur Dubai, Dubai, UAE',
            ]
        );

        // 2. Ensure Brands Exist
        $brands = [
            'TeamGroup' => Brand::firstOrCreate(['name' => 'TeamGroup']),
            'ADATA' => Brand::firstOrCreate(['name' => 'ADATA']),
            'T-Force' => Brand::firstOrCreate(['name' => 'T-Force']),
        ];

        // 3. Ensure Categories Exist
        $categories = [
            'Storage' => Category::firstOrCreate(['name' => 'Storage']),
            'Memory' => Category::firstOrCreate(['name' => 'Memory']),
        ];

        $products = [
            // --- TEAMGROUP MEMORY ---
            ['TM-D3-4G-1600', 'Team Elite DDR3 UDIMM 4GB 1600MHz 1.5V', 10, 'Memory', 'TeamGroup'],
            ['TM-D3-8G-1600', 'Team Elite DDR3 UDIMM 8GB 1600MHz 1.5V', 10, 'Memory', 'TeamGroup'],
            ['TM-D3L-4G-1600', 'Team Elite DDR3L UDIMM 4GB 1600MHz 1.35V', 10, 'Memory', 'TeamGroup'],
            ['TM-SOD3L-4G-1600', 'Team Elite DDR3L SODIMM 4GB 1600MHz 1.35V', 10, 'Memory', 'TeamGroup'],
            ['TM-D3L-8G-1600', 'Team Elite DDR3L UDIMM 8GB 1600MHz 1.35V', 10, 'Memory', 'TeamGroup'],
            ['TM-SOD3L-8G-1600', 'Team Elite DDR3L SODIMM 8GB 1600MHz 1.35V', 10, 'Memory', 'TeamGroup'],
            ['TM-D4-8G-3200', 'Team Elite DDR4 UDIMM 8GB 3200MHz', 10, 'Memory', 'TeamGroup'],
            ['TM-SOD4-8G-3200', 'Team Elite DDR4 SODIMM 8GB 3200MHz', 10, 'Memory', 'TeamGroup'],
            ['TM-D4-16G-3200', 'Team Elite DDR4 UDIMM 16GB 3200MHz', 10, 'Memory', 'TeamGroup'],
            ['TM-SOD4-16G-3200', 'Team Elite DDR4 SODIMM 16GB 3200MHz', 10, 'Memory', 'TeamGroup'],
            ['TM-D4-32G-3200', 'Team Elite DDR4 UDIMM 32GB 3200MHz', 10, 'Memory', 'TeamGroup'],
            ['TM-SOD4-32G-3200', 'Team Elite DDR4 SODIMM 32GB 3200MHz', 10, 'Memory', 'TeamGroup'],
            ['TM-D5-16G-5600', 'Team Elite DDR5 UDIMM 16GB 5600MHz CL46', 10, 'Memory', 'TeamGroup'],
            ['TM-D5-32G-5600', 'Team Elite DDR5 UDIMM 32GB 5600MHz CL46', 10, 'Memory', 'TeamGroup'],

            // --- TEAMGROUP SSD ---
            ['TM-CX2-256G', 'Team CX2 2.5" SATA3 256GB SSD', 10, 'Storage', 'TeamGroup'],
            ['TM-CX2-512G', 'Team CX2 2.5" SATA3 512GB SSD', 10, 'Storage', 'TeamGroup'],
            ['TM-CX2-1TB', 'Team CX2 2.5" SATA3 1TB SSD', 10, 'Storage', 'TeamGroup'],
            ['TM-CX2-2TB', 'Team CX2 2.5" SATA3 2TB SSD', 10, 'Storage', 'TeamGroup'],
            ['TM-QX-4TB', 'Team QX 2.5" SATA3 4TB SSD', 10, 'Storage', 'TeamGroup'],
            ['TF-VULCANZ-256G', 'T-Force Vulcan Z 2.5" SATA3 256GB SSD', 10, 'Storage', 'T-Force'],
            ['TF-VULCANZ-512G', 'T-Force Vulcan Z 2.5" SATA3 512GB SSD', 10, 'Storage', 'T-Force'],
            ['TF-VULCANZ-1TB', 'T-Force Vulcan Z 2.5" SATA3 1TB SSD', 10, 'Storage', 'T-Force'],
            ['TM-MS30-512G', 'Team MS30 M.2 2280 SATA III 512GB SSD', 10, 'Storage', 'TeamGroup'],
            ['TM-MS30-1TB', 'Team MS30 M.2 2280 SATA III 1TB SSD', 10, 'Storage', 'TeamGroup'],
            ['TM-MP33-256G', 'Team MP33 M.2 2280 PCIe Gen3 256GB SSD', 10, 'Storage', 'TeamGroup'],
            ['TM-MP33-512G', 'Team MP33 M.2 2280 PCIe Gen3 512GB SSD', 10, 'Storage', 'TeamGroup'],
            ['TM-MP33-1TB', 'Team MP33 M.2 2280 PCIe Gen3 1TB SSD', 10, 'Storage', 'TeamGroup'],
            ['TM-MP33PRO-2TB', 'Team MP33 Pro M.2 2280 PCIe Gen3 2TB SSD', 10, 'Storage', 'TeamGroup'],
            ['TM-MP44L-500G', 'Team MP44L M.2 2280 PCIe Gen4x4 500GB SSD', 10, 'Storage', 'TeamGroup'],
            ['TM-MP44-1TB', 'Team MP44 M.2 2280 PCIe Gen4x4 1TB SSD', 10, 'Storage', 'TeamGroup'],
            ['TM-NV5000-1TB', 'Team NV5000 M.2 2280 PCIe Gen4x4 1TB SSD', 10, 'Storage', 'TeamGroup'],
            ['TM-NV5000-2TB', 'Team NV5000 M.2 2280 PCIe Gen4x4 2TB SSD', 10, 'Storage', 'TeamGroup'],
            ['TM-MP44Q-4TB', 'Team MP44Q M.2 2280 PCIe Gen4x4 4TB SSD', 10, 'Storage', 'TeamGroup'],
            ['TM-MP44S-1TB', 'Team MP44S M.2 2230 PCIe Gen4x4 1TB SSD', 10, 'Storage', 'TeamGroup'],
            ['TM-MP44S-2TB', 'Team MP44S M.2 2230 PCIe Gen4x4 2TB SSD', 10, 'Storage', 'TeamGroup'],

            // --- ADATA ---
            ['AD-SU650-256G', 'ADATA SU650 2.5" SATA III 256GB SSD', 10, 'Storage', 'ADATA'],
            ['AD-SU650-512G', 'ADATA SU650 2.5" SATA III 512GB SSD', 10, 'Storage', 'ADATA'],
            ['AD-SU650-1TB', 'ADATA SU650 2.5" SATA III 1TB SSD', 10, 'Storage', 'ADATA'],
            ['AD-LEG710-256G', 'ADATA Legend 710 M.2 2280 PCIe Gen3 256GB SSD', 10, 'Storage', 'ADATA'],
            ['AD-LEG710-512G', 'ADATA Legend 710 M.2 2280 PCIe Gen3 512GB SSD', 10, 'Storage', 'ADATA'],
            ['AD-LEG710-1TB', 'ADATA Legend 710 M.2 2280 PCIe Gen3 1TB SSD', 10, 'Storage', 'ADATA'],
            ['AD-PG-8G-3200-UD', 'ADATA Premier Green DDR4 UDIMM 8GB 3200MHz Non Heatsink', 10, 'Memory', 'ADATA'],
            ['AD-PG-8G-3200-SO', 'ADATA Premier Green DDR4 SODIMM 8GB 3200MHz Non Heatsink', 10, 'Memory', 'ADATA'],
            ['AD-PB-16G-5600-UD', 'ADATA Premier Black DDR5 UDIMM 16GB 5600MHz Non Heatsink', 10, 'Memory', 'ADATA'],
            ['AD-PB-16G-5600-SO', 'ADATA Premier Black DDR5 SODIMM 16GB 5600MHz Non Heatsink', 10, 'Memory', 'ADATA'],
            ['AD-PB-32G-5600-UD', 'ADATA Premier Black DDR5 UDIMM 32GB 5600MHz Non Heatsink', 10, 'Memory', 'ADATA'],
            ['AD-PB-32G-5600-SO', 'ADATA Premier Black DDR5 SODIMM 32GB 5600MHz Non Heatsink', 10, 'Memory', 'ADATA'],
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
