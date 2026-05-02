<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\SupplierProduct;
use Illuminate\Support\Str;

class GrandPCDProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Ensure Supplier Exists
        $supplier = Supplier::firstOrCreate(
            ['name' => 'GRAND PCD COMPUTER TRADING LLC'],
            [
                'email' => 'sales@grandpcd.com',
                'phone' => '+971 4 354 1111',
                'address' => 'Bur Dubai, Dubai, UAE',
            ]
        );

        // 2. Ensure Brands Exist
        $brands = [
            'HP' => Brand::firstOrCreate(['name' => 'HP']),
            'Dell' => Brand::firstOrCreate(['name' => 'Dell']),
            'Lenovo' => Brand::firstOrCreate(['name' => 'Lenovo']),
            'Acer' => Brand::firstOrCreate(['name' => 'Acer']),
            'Asus' => Brand::firstOrCreate(['name' => 'Asus']),
            'Kingston' => Brand::firstOrCreate(['name' => 'Kingston']),
            'Lexar' => Brand::firstOrCreate(['name' => 'Lexar']),
            'Team Group' => Brand::firstOrCreate(['name' => 'Team Group']),
            'Samsung' => Brand::firstOrCreate(['name' => 'Samsung']),
            'BenQ' => Brand::firstOrCreate(['name' => 'BenQ']),
            'Epson' => Brand::firstOrCreate(['name' => 'Epson']),
            'Philips' => Brand::firstOrCreate(['name' => 'Philips']),
        ];

        // 3. Ensure Categories Exist
        $categories = [
            'Laptops' => Category::firstOrCreate(['name' => 'Laptops']),
            'AIO' => Category::firstOrCreate(['name' => 'All-in-One']),
            'Storage' => Category::firstOrCreate(['name' => 'Storage']),
            'Projectors' => Category::firstOrCreate(['name' => 'Projectors']),
        ];

        $products = [
            // --- LENOVO LAPTOPS ---
            ['IP-SLIM3-C7', 'Lenovo IdeaPad Slim 3 Core7-240H 16GB 512GB 15.3" WUXGA DOS', 10, 'Laptops', 'Lenovo'],
            ['V15-CEL', 'Lenovo V15 Celeron N4500 4GB 1TB 15.6" FHD WIN10', 10, 'Laptops', 'Lenovo'],
            ['E14-G7-U5', 'Lenovo ThinkPad E14 G7 Ultra 5-225H 8GB 512GB 14" WUXGA DOS', 10, 'Laptops', 'Lenovo'],
            ['E14-G6-U5', 'Lenovo ThinkPad E14 G6 Ultra 5-125H 8GB 512GB 14" WUXGA DOS', 10, 'Laptops', 'Lenovo'],
            ['E16-G2-U5', 'Lenovo ThinkPad E16 G2 Ultra 5-125H 8GB 512GB 16" WUXGA DOS', 10, 'Laptops', 'Lenovo'],
            ['E16-G3-U7', 'Lenovo ThinkPad E16 G3 Ultra 7-255H 16GB 512GB 16" WUXGA DOS', 10, 'Laptops', 'Lenovo'],
            ['LEG-PRO7-5090', 'Lenovo Legion Pro 7 Ultra 9-275HX 64GB 2TB 16" WQXGA RTX5090 24GB', 10, 'Laptops', 'Lenovo'],
            ['YOGA7-U7', 'Lenovo Yoga 7 Ultra 7-256V 16GB 512GB 14" Touch WIN11', 10, 'Laptops', 'Lenovo'],
            ['V15-G5-I3', 'Lenovo V15 G5 i3-1315U 8GB 256GB 15.6" FHD DOS', 10, 'Laptops', 'Lenovo'],
            ['SLIM3-I3-512', 'Lenovo IdeaPad Slim 3 i3-1315U 8GB 512GB 15.6" FHD DOS', 10, 'Laptops', 'Lenovo'],
            ['SLIM3-I5-16', 'Lenovo IdeaPad Slim 3 i5-13420H 16GB 512GB 15.3" WUXGA DOS', 10, 'Laptops', 'Lenovo'],
            ['SLIM3-I5-8', 'Lenovo IdeaPad Slim 3 i5-13420H 8GB 512GB 15.6" FHD DOS', 10, 'Laptops', 'Lenovo'],
            ['V14-G4-I7', 'Lenovo V14 G4 i7-13620H 16GB 512GB 14" UHD WIN11', 10, 'Laptops', 'Lenovo'],
            ['IP5-I7-TOUCH', 'Lenovo IdeaPad 5 i7-13620H 16GB 512GB 14" Touch DOS', 10, 'Laptops', 'Lenovo'],
            ['LEG5-I7-5060', 'Lenovo Legion 5 i7-13650HX 16GB 1TB 15.3" WUXGA RTX5060 8GB', 10, 'Laptops', 'Lenovo'],
            ['LOQ-I7-3050', 'Lenovo LOQ i7-13650HX 16GB 512GB 15.6" RTX3050 6GB DOS', 10, 'Laptops', 'Lenovo'],
            ['L14-G4-I7', 'Lenovo ThinkPad L14 G4 i7-1365U vPro 16GB 512GB 14" Touch WIN11', 10, 'Laptops', 'Lenovo'],

            // --- HP LAPTOPS ---
            ['HP15-C5-TOUCH', 'HP 15 Core5-120U 16GB 512GB 15.6" FHD Touch WIN11', 10, 'Laptops', 'HP'],
            ['250R-G10-C5', 'HP 250R G10 Core5-120U 8GB 512GB 15.6" FHD DOS', 10, 'Laptops', 'HP'],
            ['HP15-C7', 'HP 15 Core7-150U 16GB 512GB 15.6" WIN11', 10, 'Laptops', 'HP'],
            ['460G11-U7', 'HP ProBook 460 G11 Ultra 7-155U 16GB 512GB 16" WUXGA DOS', 10, 'Laptops', 'HP'],
            ['250G10-I3', 'HP 250 G10 i3-1315U 8GB 512GB 15.6" FHD DOS', 10, 'Laptops', 'HP'],
            ['440G10-I7', 'HP ProBook 440 G10 i7-1355U 8GB 512GB 14" DOS', 10, 'Laptops', 'HP'],
            ['450G10-I7', 'HP ProBook 450 G10 i7-1355U 8GB 512GB 15.6" FHD DOS', 10, 'Laptops', 'HP'],
            ['OMEN16-I7-5060', 'HP Omen 16 i7-14650HX 32GB 1TB 16" RTX5060 8GB WIN11', 10, 'Laptops', 'HP'],
            ['OMNIBOOK-X-U7', 'HP OmniBook X Flip Ultra 7-256V 16GB 1TB 14" OLED Touch WIN11', 10, 'Laptops', 'HP'],
            ['440G10-I5', 'HP ProBook 440 G10 i5-1334U 8GB 512GB 14" FHD DOS', 10, 'Laptops', 'HP'],

            // --- ACER LAPTOPS ---
            ['ASPIRE-L-I3', 'Acer Aspire Lite i3-1305U 8GB 256GB 16" FHD DOS', 10, 'Laptops', 'Acer'],
            ['NITRO-L-I5-3050', 'Acer Nitro Lite i5-13420H 16GB 512GB 16" WUXGA RTX3050 6GB', 10, 'Laptops', 'Acer'],
            ['NITRO-L-I5-4050', 'Acer Nitro Lite i5-13420H 16GB 512GB 16" FHD RTX4050 6GB', 10, 'Laptops', 'Acer'],
            ['ASPIRE-L-I5', 'Acer Aspire Lite i5-13420H 8GB 512GB 15.6" FHD DOS', 10, 'Laptops', 'Acer'],
            ['NITRO-L-I7-3050', 'Acer Nitro Lite i7-13620H 16GB 512GB 16" WUXGA RTX3050 6GB', 10, 'Laptops', 'Acer'],
            ['NITRO-L-I7-4050', 'Acer Nitro Lite i7-13620H 16GB 512GB 16" FHD RTX4050 6GB', 10, 'Laptops', 'Acer'],
            ['NITRO-V15-I9', 'Acer Nitro V15 Gaming i9-13900H 16GB 512GB 15.6" FHD RTX5060 8GB', 10, 'Laptops', 'Acer'],

            // --- ASUS & DELL LAPTOPS ---
            ['VIVO-C5', 'Asus VivoBook Core5-120U 16GB 512GB 15.6" FHD DOS', 10, 'Laptops', 'Asus'],
            ['VIVOGO-N305', 'Asus VivoBook Go 15 i3-N305 4GB 256GB 15.6" FHD DOS', 10, 'Laptops', 'Asus'],
            ['PV15250-C3', 'Dell PV15250 Core3-100U 8GB 512GB 15.6" DOS', 10, 'Laptops', 'Dell'],

            // --- STORAGE (SSD SATA) ---
            ['K-SATA-240', 'Kingston 2.5" SATA SSD 240GB', 10, 'Storage', 'Kingston'],
            ['K-SATA-480', 'Kingston 2.5" SATA SSD 480GB', 10, 'Storage', 'Kingston'],
            ['K-SATA-960', 'Kingston 2.5" SATA SSD 960GB', 10, 'Storage', 'Kingston'],
            ['L-SATA-128-LNS100', 'Lexar 2.5" SATA SSD 128GB LNS100', 10, 'Storage', 'Lexar'],
            ['L-SATA-256-LNS100', 'Lexar 2.5" SATA SSD 256GB LNS100', 10, 'Storage', 'Lexar'],
            ['L-SATA-512-LNS100', 'Lexar 2.5" SATA SSD 512GB LNS100', 10, 'Storage', 'Lexar'],
            ['L-SATA-512-NQ100', 'Lexar 2.5" SATA SSD 512GB NQ100', 10, 'Storage', 'Lexar'],
            ['L-SATA-1TB-LNS100', 'Lexar 2.5" SATA SSD 1TB LNS100', 10, 'Storage', 'Lexar'],
            ['L-SATA-1TB-NQ100', 'Lexar 2.5" SATA SSD 1TB NQ100', 10, 'Storage', 'Lexar'],
            ['L-SATA-2TB-NQ100', 'Lexar 2.5" SATA SSD 2TB NQ100', 10, 'Storage', 'Lexar'],
            ['T-SATA-256', 'Team Group 2.5" SATA SSD 256GB VULCAN Z', 10, 'Storage', 'Team Group'],
            ['T-SATA-512', 'Team Group 2.5" SATA SSD 512GB VULCAN Z', 10, 'Storage', 'Team Group'],
            ['T-SATA-1TB', 'Team Group 2.5" SATA SSD 1TB', 10, 'Storage', 'Team Group'],

            // --- STORAGE (SSD NVME) ---
            ['K-NVME-500-NV3', 'Kingston M.2 NVMe SSD 500GB SNV3S NV3', 10, 'Storage', 'Kingston'],
            ['K-NVME-1TB-NV3', 'Kingston M.2 NVMe SSD 1TB SNV3S NV3', 10, 'Storage', 'Kingston'],
            ['K-NVME-2TB-NV3', 'Kingston M.2 NVMe SSD 2TB SNV3S NV3', 10, 'Storage', 'Kingston'],
            ['K-NVME-4TB-NV3', 'Kingston M.2 NVMe SSD 4TB SNV3S NV3', 10, 'Storage', 'Kingston'],
            ['L-NVME-500-LNM610', 'Lexar M.2 NVMe SSD 500GB LNM610', 10, 'Storage', 'Lexar'],
            ['L-NVME-512-LNM620', 'Lexar M.2 NVMe SSD 512GB LNM620', 10, 'Storage', 'Lexar'],
            ['L-NVME-1TB-LNM610', 'Lexar M.2 NVMe SSD 1TB LNM610', 10, 'Storage', 'Lexar'],
            ['L-NVME-1TB-LNM620', 'Lexar M.2 NVMe SSD 1TB LNM620', 10, 'Storage', 'Lexar'],
            ['L-NVME-2TB-LNM610', 'Lexar M.2 NVMe SSD 2TB LNM610', 10, 'Storage', 'Lexar'],
            ['S-NVME-1TB-990', 'Samsung M.2 NVMe SSD 1TB 990 Pro MZ-V9P1T0BW', 10, 'Storage', 'Samsung'],
            ['T-NVME-512-MP33', 'Team Group M.2 NVMe SSD 512GB MP33', 10, 'Storage', 'Team Group'],

            // --- AIO ---
            ['BJ2P3EA', 'HP AIO 24 i5-1334U 8GB 512GB SSD 23.8" FHD Touch DOS White', 10, 'AIO', 'HP'],
            ['24-CR0089NY', 'HP AIO 24 i5-1334U 8GB 512GB SSD 23.8" FHD Touch DOS Shell White', 10, 'AIO', 'HP'],
            ['91H33EA', 'HP AIO 24 i7-1355U 8GB 512GB SSD 23.8" FHD Touch DOS', 10, 'AIO', 'HP'],
            ['91G35EA', 'HP AIO 24 i7-1355U 8GB 512GB SSD 23.8" FHD Touch DOS White', 10, 'AIO', 'HP'],
            ['A99BNEA', 'HP AIO 27 i7-1355U 8GB 512GB SSD 27" FHD DOS', 10, 'AIO', 'HP'],
            ['C9ZX5AT-AIO', 'HP ProOne 440 G9 i7-13700T 16GB 512GB SSD 23.8" FHD Touch W11PRO', 10, 'AIO', 'HP'],
            ['C9ZX6AT-AIO', 'HP ProOne 440 G9 i7-13700T 16GB 512GB SSD 23.8" FHD W11PRO', 10, 'AIO', 'HP'],
            ['12SC007YGP', 'ThinkCentre Neo 50a 24 Core5-210H 8GB 512GB SSD 23.8" FHD DOS', 10, 'AIO', 'Lenovo'],
            ['12SC007YGR', 'ThinkCentre Neo 50a 24 Core5-210H 8GB 512GB SSD 23.8" FHD DOS AR', 10, 'AIO', 'Lenovo'],
            ['12SC0076GP', 'ThinkCentre Neo 50a 24 Core5-210H 16GB 512GB SSD 23.8" Touch DOS', 10, 'AIO', 'Lenovo'],
            ['12SA003QGP', 'ThinkCentre Neo 50a 27 Core7-240H 16GB 512GB SSD 27" FHD DOS', 10, 'AIO', 'Lenovo'],
            ['F0HM00MLAK', 'IdeaCentre 27 IRH9 i7-13620H 8GB 512GB SSD 27" FHD DOS', 10, 'AIO', 'Lenovo'],

            // --- PROJECTORS ---
            ['ACER-X1123HP', 'Acer X1123HP Projector', 10, 'Projectors', 'Acer'],
            ['ACER-X1128H', 'Acer X1128H Projector', 10, 'Projectors', 'Acer'],
            ['BENQ-MX560', 'BenQ MX560 Projector', 10, 'Projectors', 'BenQ'],
            ['EPSON-CO-W01', 'Epson CO-W01 Projector', 10, 'Projectors', 'Epson'],
            ['EPSON-EB-2250U', 'Epson EB-2250U Projector', 10, 'Projectors', 'Epson'],
            ['EPSON-EB-FH52', 'Epson EB-FH52 Projector', 10, 'Projectors', 'Epson'],
            ['EPSON-EB-X49', 'Epson EB-X49 Projector', 10, 'Projectors', 'Epson'],
            ['PHILIPS-NPX110', 'Philips NeoPix NPX110 Projector', 10, 'Projectors', 'Philips'],
            ['PHILIPS-NPX130', 'Philips NeoPix NPX130 Projector', 10, 'Projectors', 'Philips'],
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
