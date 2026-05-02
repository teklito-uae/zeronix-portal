<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\SupplierProduct;
use Illuminate\Support\Str;

class SuperTechProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Ensure Supplier Exists
        $supplier = Supplier::firstOrCreate(
            ['name' => 'SUPERTECH COMPUTER TRADING LLC'],
            [
                'email' => 'sales@supertech.com',
                'phone' => '+971 4 353 1111',
                'address' => 'Bur Dubai, Dubai, UAE',
            ]
        );

        // 2. Ensure Brands Exist
        $brands = [
            'HP' => Brand::firstOrCreate(['name' => 'HP']),
            'Dell' => Brand::firstOrCreate(['name' => 'Dell']),
            'Lenovo' => Brand::firstOrCreate(['name' => 'Lenovo']),
        ];

        // 3. Ensure Categories Exist
        $categories = [
            'Laptops' => Category::firstOrCreate(['name' => 'Laptops']),
            'AIO' => Category::firstOrCreate(['name' => 'All-in-One']),
        ];

        $products = [
            // --- LENOVO THINKPAD E14 GEN 7 ---
            ['21U20032GQ', 'Lenovo ThinkPad E14 G7 U7-258V 32GB 512GB SSD 14" WUXGA DOS 1YR + BAG', 10, 'Laptops', 'Lenovo'],
            ['21U2003YGQ', 'Lenovo ThinkPad E14 G7 U5-226V 16GB 512GB SSD 14" WUXGA DOS 1YR + BAG', 10, 'Laptops', 'Lenovo'],
            ['21SXS0N600-8G', 'Lenovo ThinkPad E14 G7 U5-225H 8GB 512GB SSD 14" WUXGA DOS 1YR', 10, 'Laptops', 'Lenovo'],
            ['21SXS0N600-16G', 'Lenovo ThinkPad E14 G7 U5-225H 16GB 512GB SSD 14" WUXGA DOS 1YR', 10, 'Laptops', 'Lenovo'],

            // --- LENOVO THINKPAD E16 GEN 3 ---
            ['22AY0016GR', 'Lenovo ThinkPad E16 G3 U7-256V 16GB 512GB SSD 16" WUXGA DOS 1YR AR', 10, 'Laptops', 'Lenovo'],
            ['22AY0016GQ', 'Lenovo ThinkPad E16 G3 U7-256V 16GB 512GB SSD 16" WUXGA DOS 1YR ENG + BAG', 10, 'Laptops', 'Lenovo'],
            ['21SR005NGR', 'Lenovo ThinkPad E16 G3 U7-255H 16GB 512GB SSD 16" WUXGA DOS 1YR AR + BAG', 10, 'Laptops', 'Lenovo'],
            ['21SR005NGQ', 'Lenovo ThinkPad E16 G3 U7-255H 16GB 512GB SSD 16" WUXGA DOS 1YR EU + BAG', 10, 'Laptops', 'Lenovo'],
            ['21SR005NGP', 'Lenovo ThinkPad E16 G3 U7-255H 16GB 512GB SSD 16" WUXGA DOS 1YR UK + BAG', 10, 'Laptops', 'Lenovo'],
            ['21SRS0UQ00', 'Lenovo ThinkPad E16 G3 U7-255H 16GB 512GB SSD 16" WUXGA DOS', 10, 'Laptops', 'Lenovo'],
            ['21SRS0BQ00', 'Lenovo ThinkPad E16 G3 U7-255H 16GB 512GB SSD 16" WUXGA DOS ENG', 10, 'Laptops', 'Lenovo'],
            ['21MA001PGP', 'Lenovo ThinkPad E16 G3 U7-155H 16GB 512GB SSD 16" WUXGA DOS 1YR SHD', 10, 'Laptops', 'Lenovo'],
            ['21MA001MUE', 'Lenovo ThinkPad E16 G3 U7-155H 16GB 512GB SSD 16" WUXGA DOS ENG', 10, 'Laptops', 'Lenovo'],
            ['21SRS0LV00', 'Lenovo ThinkPad E16 G3 U5-225H 8GB 512GB SSD 16" WUXGA DOS', 10, 'Laptops', 'Lenovo'],
            ['21SSS27D00', 'Lenovo ThinkPad E16 G3 U5-225U 16GB 512GB SSD 16" WUXGA DOS BLK', 10, 'Laptops', 'Lenovo'],
            ['21SR005JGR', 'Lenovo ThinkPad E16 G3 U5-225U 8GB 512GB SSD 16" WUXGA DOS AR 1YR + BAG', 10, 'Laptops', 'Lenovo'],
            ['21JN0022GP', 'Lenovo ThinkPad E16 G3 Ci7-1355U 8GB 512GB SSD 16" FHD DOS 1YR SHD', 10, 'Laptops', 'Lenovo'],

            // --- LENOVO THINKBOOK ---
            ['21SK0027GR', 'Lenovo ThinkBook 16 G8 U5-225U 16GB DDR5 512GB SSD 16" WUXGA DOS AR 1YR + BAG', 10, 'Laptops', 'Lenovo'],
            ['21SJ002AGR', 'Lenovo ThinkBook 14 G8 U5-225U 16GB DDR5 512GB SSD 14" WUXGA DOS AR 1YR + BAG', 10, 'Laptops', 'Lenovo'],
            ['21SK0030GR', 'Lenovo ThinkBook 16 G8 U7-255H 16GB DDR5 512GB SSD 16" WUXGA DOS AR 1YR + BAG', 10, 'Laptops', 'Lenovo'],

            // --- AIO DELL ---
            ['QC24250-U7-DOS', 'Dell Pro 24 AIO QC24250 U7-265 16GB 512GB SSD 23.8" FHD Touch DOS AR 1YR', 10, 'AIO', 'Dell'],
            ['QC24250-U7-W11', 'Dell Pro 24 AIO QC24250 U7-265 16GB 512GB SSD 23.8" FHD Touch W11PRO AR 1YR', 10, 'AIO', 'Dell'],
            ['210-BPNV-QC24250', 'Dell Pro 24 AIO QC24250 65W U7-265 vPro 16GB 512GB SSD 23.8" FHD Touch W11PRO AR 3YR', 10, 'AIO', 'Dell'],
            ['210-BPPL-QC24251', 'Dell Pro 24 AIO QC24251 35W U5-235T vPro 16GB 512GB SSD 23.8" FHD Touch W11PRO AR 3YR', 10, 'AIO', 'Dell'],

            // --- AIO HP ---
            ['CA8H2AT-BH5', 'HP ProOne 440 G9 Ci7-14700T 16GB 512GB SSD 23.8" FHD No WiFi DOS ENG 1YR', 10, 'AIO', 'HP'],
            ['C9ZX5AT-BH5', 'HP ProOne 440 G9 Ci7-13700T 16GB 512GB SSD 23.8" FHD Touch W11PRO 1YR', 10, 'AIO', 'HP'],
            ['A55PMET-BH5', 'HP Elite 840 G9 Ci7-14700 16GB 512GB SSD 23.8" FHD W11 1YR', 10, 'AIO', 'HP'],
            ['A55PLET-BH5', 'HP Elite 840 G9 Ci7-14700 16GB 512GB SSD 23.8" FHD Touch W11PRO 1YR', 10, 'AIO', 'HP'],
            ['A55PRET-BH5', 'HP Elite 870 G9 Ci7-14700 16GB 512GB SSD 27" FHD W11 1YR', 10, 'AIO', 'HP'],

            // --- AIO LENOVO THINKCENTRE ---
            ['12SC000TGR', 'Lenovo Neo 50a 24 G5 Ci5-13420H 8GB 512GB SSD 24" FHD DOS AR 1YR', 10, 'AIO', 'Lenovo'],
            ['12SC007YGP', 'Lenovo Neo 50a 24 G5 Core5-210H 8GB 512GB SSD 23.8" FHD DOS ENG 1YR', 10, 'AIO', 'Lenovo'],
            ['12SA002LGP', 'Lenovo Neo 50a 27 G5 Core5-210H 8GB 512GB SSD 27" FHD DOS ENG 1YR', 10, 'AIO', 'Lenovo'],
            ['12SC004HGR', 'Lenovo Neo 50a 24 G5 Core5-210H 16GB 512GB SSD 23.8" FHD Touch DOS AR 1YR', 10, 'AIO', 'Lenovo'],
            ['12SC0040GP', 'Lenovo Neo 50a 24 G5 Core7-240H 8GB 512GB SSD 23.8" FHD DOS ENG 1YR', 10, 'AIO', 'Lenovo'],
            ['12SC0076GP', 'Lenovo Neo 50a 24 G5 Core7-240H 16GB 512GB SSD 24" FHD Touch DOS ENG 1YR', 10, 'AIO', 'Lenovo'],
            ['12SA003QGR', 'Lenovo Neo 50a 27 G5 Core7-240H 16GB 512GB SSD 27" FHD DOS AR 1YR', 10, 'AIO', 'Lenovo'],
            ['12SC0092GP', 'Lenovo Neo 50a 24 G5 Core7-240H 8GB 512GB SSD 23.8" FHD DOS ENG 1YR V2', 10, 'AIO', 'Lenovo'],
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
