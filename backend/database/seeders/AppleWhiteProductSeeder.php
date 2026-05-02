<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\SupplierProduct;
use Illuminate\Support\Str;

class AppleWhiteProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Ensure Supplier Exists
        $supplier = Supplier::firstOrCreate(
            ['name' => 'APPLE WHITE COMPUTERS LLC'],
            [
                'email' => 'sales@applewhite.com',
                'phone' => '+971 4 355 1111',
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
            'Monitors' => Category::firstOrCreate(['name' => 'Monitors']),
            'Desktops' => Category::firstOrCreate(['name' => 'Desktops']),
            'AIO' => Category::firstOrCreate(['name' => 'All-in-One']),
        ];

        $products = [
            // --- HP LAPTOPS ---
            ['15-FD0021NX', 'HP 15-FD0021NX I3-1315U 4GB 256GB SSD 15.6" FHD Silver Eng-AR DOS', 10, 'Laptops', 'HP'],
            ['250-G10-I3', 'HP 250 G10 I3-1315U 8GB 256GB SSD 15.6" Dark Ash Silver DOS ENG', 10, 'Laptops', 'HP'],
            ['15-FD0532NIA', 'HP 15-FD0532NIA I3-1315U 4GB 256GB SSD 15.6" FHD Silver DOS', 10, 'Laptops', 'HP'],
            ['15-FD0033NX', 'HP 15-FD0033NX I5-1334U 8GB 512GB SSD 15.6" FHD Silver AR KB DOS', 10, 'Laptops', 'HP'],
            ['15-FD0346NIA', 'HP 15-FD0346NIA I5-1334U 8GB 512GB SSD 15.6" FHD MX570 Silver DOS', 10, 'Laptops', 'HP'],
            ['14-EP0122NIA', 'HP 14-EP0122NIA I5-1335U 8GB 512GB SSD 14.1" Silver DOS', 10, 'Laptops', 'HP'],
            ['15-FD0499NIA-I5', 'HP 15-FD0499NIA I5-1334U 8GB 512GB SSD 15.6" FHD Silver DOS', 10, 'Laptops', 'HP'],
            ['15-FD0362NIA', 'HP 15-FD0362NIA I5-1334U 8GB 512GB SSD 15.6" FHD MX570 2GB Silver DOS', 10, 'Laptops', 'HP'],
            ['630G10-8A603EA', 'HP EliteBook 630 G10 I5-1335U 8GB 512GB SSD 13.3" FHD Silver DOS 8A603EA', 10, 'Laptops', 'HP'],
            ['15-FD0366NIA', 'HP 15-FD0366NIA I5-1334U 8GB 512GB SSD 15.6" FHD MX570 2GB Warm Gold DOS', 10, 'Laptops', 'HP'],
            ['250-G10-I5', 'HP 250 G10 I5-1334U 8GB 512GB SSD 15.6" Black DOS ENG', 10, 'Laptops', 'HP'],
            ['450G10-816N8EA', 'HP ProBook 450 G10 I5-1335U 8GB 512GB SSD 15.6" FHD DOS 816N8EA', 10, 'Laptops', 'HP'],
            ['15-FD0499NIA-B6RR5EA', 'HP 15-FD0499NIA I5-1334U 8GB 512GB SSD 15.6" FHD Natural Silver DOS B6RR5EA', 10, 'Laptops', 'HP'],
            ['640G10-3YR', 'HP EliteBook 640 G10 I5-1335U 8GB 512GB SSD 14" FHD Pike Silver 3yr Warranty', 10, 'Laptops', 'HP'],
            ['460G11-U5', 'HP ProBook 460 G11 U5-125U 8GB 512GB SSD 16" FHD Pike Silver DOS Backlit+FP', 10, 'Laptops', 'HP'],
            ['450G10-I5-16GB', 'HP ProBook 450 G10 I5-1334U 16GB 512GB SSD 15.6" FHD Pike Silver DOS Backlit+FP', 10, 'Laptops', 'HP'],
            ['440G11-U7', 'HP ProBook 440 G11 U7-155U 16GB 512GB SSD 14" DOS 1yr Warranty', 10, 'Laptops', 'HP'],
            ['250-G10-I7', 'HP 250 G10 I7-1355U 8GB 512GB SSD 15.6" FHD Silver DOS', 10, 'Laptops', 'HP'],
            ['15-FD0458NIA-B02XHEA', 'HP 15-FD0458NIA I7-1255U 8GB 512GB SSD 15.6" FHD Silver DOS B02XHEA', 10, 'Laptops', 'HP'],
            ['15-FD0602TU', 'HP 15-FD0602TU I7-1255U 8GB 512GB SSD 15.6" FHD Silver DOS ENG', 10, 'Laptops', 'HP'],
            ['450G10-I7', 'HP ProBook 450 G10 I7-1355U 8GB 512GB SSD 15.6" FHD Quicksilver DOS Backlit+FP', 10, 'Laptops', 'HP'],
            ['830G10-927T9ES', 'HP EliteBook 830 G10 I7-1355U 16GB 512GB SSD 13.3" FHD Silver W11PRO 927T9ES', 10, 'Laptops', 'HP'],
            ['840G9-9M495AT', 'HP EliteBook 840 G9 I7-1255U 16GB 512GB SSD 14.1" FHD Silver DOS 9M495AT', 10, 'Laptops', 'HP'],
            ['15-FD0458NIA', 'HP 15-FD0458NIA I7-1255U 8GB 512GB SSD 15.6" FHD Silver DOS', 10, 'Laptops', 'HP'],
            ['440G10-I7', 'HP ProBook 440 G10 I7-1355U 8GB 512GB SSD 14" FHD DOS Backlit KB', 10, 'Laptops', 'HP'],
            ['460G11-U7', 'HP ProBook 460 G11 U7-155U 16GB 512GB SSD 16" Pike Silver DOS', 10, 'Laptops', 'HP'],
            ['640G10-I7', 'HP EliteBook 640 G10 I7-1355U 16GB 1TB SSD 14" FHD Silver DOS Backlit', 10, 'Laptops', 'HP'],
            ['1040G10-I7', 'HP EliteBook 1040 G10 I7-1355U 16GB 512GB SSD 14" DOS 5yr NBD On-Site', 10, 'Laptops', 'HP'],
            ['8G1I-C15A6ET', 'HP EliteBook 8 G1i U7-255U 16GB 512GB SSD 14" W11PRO 1yr C15A6ET', 10, 'Laptops', 'HP'],
            ['15-FD0557NIA', 'HP 15-FD0557NIA I7-1355U 8GB 512GB SSD 15.6" FHD Silver DOS ENG', 10, 'Laptops', 'HP'],

            // --- DELL MONITORS ---
            ['SE2225HM', 'Dell SE2225HM VA 21.5" FHD 1080p VGA HDMI 3yr', 10, 'Monitors', 'Dell'],
            ['SE2425HM', 'Dell SE2425HM IPS 23.8" FHD 1080p VGA HDMI 3yr', 10, 'Monitors', 'Dell'],
            ['SE2725HM', 'Dell SE2725HM IPS 27" FHD 1080p VGA HDMI 3yr', 10, 'Monitors', 'Dell'],
            ['E2020H', 'Dell E2020H TN 19.5" HD+ VGA DP 3yr', 10, 'Monitors', 'Dell'],
            ['E2225HM', 'Dell E2225HM VA 21.5" FHD 1080p VGA DP HDMI 3yr', 10, 'Monitors', 'Dell'],
            ['E2425HM', 'Dell E2425HM IPS 23.8" FHD 1080p VGA DP HDMI 3yr', 10, 'Monitors', 'Dell'],
            ['E2425HS', 'Dell E2425HS VA 23.8" FHD 1080p VGA DP 3yr', 10, 'Monitors', 'Dell'],
            ['E2725H', 'Dell E2725H VA 27" FHD 1080p VGA DP 3yr', 10, 'Monitors', 'Dell'],
            ['E2725HM', 'Dell E2725HM IPS 27" FHD 1080p VGA DP HDMI 3yr', 10, 'Monitors', 'Dell'],
            ['S2425H', 'Dell S2425H IPS 23.8" FHD 1080p 2x HDMI 2x 5W Speakers 3yr', 10, 'Monitors', 'Dell'],
            ['S2425HS', 'Dell S2425HS IPS 23.8" FHD 1080p 2x HDMI Speakers Height Adj Pivot 3yr', 10, 'Monitors', 'Dell'],
            ['S2725H', 'Dell S2725H IPS 27" FHD 1080p 2x HDMI 2x 5W Speakers 3yr', 10, 'Monitors', 'Dell'],
            ['S2725HS', 'Dell S2725HS IPS 27" FHD 1080p 2x HDMI Speakers Height Adj Pivot 3yr', 10, 'Monitors', 'Dell'],
            ['S2721QS', 'Dell S2721QS IPS 27" 4K UHD 2x HDMI DP Height Adj Pivot 3yr', 10, 'Monitors', 'Dell'],
            ['S3225QS', 'Dell S3225QS IPS 32" 4K UHD 2x HDMI USB-C Height Adj Pivot 3yr', 10, 'Monitors', 'Dell'],
            ['S3425DW', 'Dell S3425DW IPS 34" Curved WQHD 2x HDMI USB-C Height Adj Pivot 3yr', 10, 'Monitors', 'Dell'],
            ['P2222H', 'Dell P2222H IPS 21.5" FHD 1080p HDMI DP VGA USB 3yr', 10, 'Monitors', 'Dell'],
            ['P2425H', 'Dell P2425H IPS 23.8" FHD 1080p USB-C HDMI DP VGA USB Hub 3yr', 10, 'Monitors', 'Dell'],
            ['P2425HE', 'Dell P2425HE IPS 23.8" FHD 1080p USB-C Hub RJ-45 Network USB Hub 3yr', 10, 'Monitors', 'Dell'],
            ['P2725H', 'Dell P2725H IPS 27" FHD 1080p USB-C HDMI DP VGA USB Hub 3yr', 10, 'Monitors', 'Dell'],
            ['P2725He', 'Dell P2725He IPS 27" FHD 1080p USB-C HDMI DP VGA USB Hub 3yr', 10, 'Monitors', 'Dell'],
            ['P2725DE', 'Dell P2725DE IPS 27" QHD 1440p USB-C Hub HDMI DP USB Hub 3yr', 10, 'Monitors', 'Dell'],
            ['P2424HT', 'Dell P2424HT IPS 24" FHD 1080p USB-C Hub Touch Display 3yr', 10, 'Monitors', 'Dell'],
            ['U2424H', 'Dell U2424H IPS 23.8" FHD 1080p USB-C 60W HDMI DP UltraSharp 3yr', 10, 'Monitors', 'Dell'],
            ['U2724D', 'Dell U2724D IPS 27" QHD 1440p USB-C HDMI DP UltraSharp 3yr', 10, 'Monitors', 'Dell'],
            ['U2724De', 'Dell U2724De IPS 27" QHD 1440p Thunderbolt Hub UltraSharp TB4 Hub 3yr', 10, 'Monitors', 'Dell'],
            ['U2725Qe', 'Dell U2725Qe IPS 27" 4K UHD Thunderbolt Hub UltraSharp TB4 Hub 3yr', 10, 'Monitors', 'Dell'],
            ['U3425We', 'Dell U3425We IPS 34" Curved WQHD Thunderbolt Hub UltraSharp TB4 Hub 3yr', 10, 'Monitors', 'Dell'],
            ['U3824DW', 'Dell U3824DW IPS 38" Curved QHD+ USB-C Hub HDMI DP UltraSharp Speakers 3yr', 10, 'Monitors', 'Dell'],
            ['U4924Dw', 'Dell U4924Dw IPS 49" Curved DQHD USB-C Hub HDMI DP UltraSharp Curved 3yr', 10, 'Monitors', 'Dell'],

            // --- LENOVO MONITORS ---
            ['M14T-G2', 'Lenovo ThinkVision M14t Gen2 14" IPS Display Portable [63FDUAT6WL] 3yr', 10, 'Monitors', 'Lenovo'],
            ['M15-62CAUAT1WL', 'Lenovo ThinkVision M15 15.6" FHD IPS [62CAUAT1WL] 3yr', 10, 'Monitors', 'Lenovo'],
            ['S22I-30', 'Lenovo ThinkVision S22i-30 21.5" FHD IPS (Tilt Stand) [63FCKATBUK] 3yr', 10, 'Monitors', 'Lenovo'],
            ['S24I-30', 'Lenovo ThinkVision S24i-30 23.8" FHD IPS [63DEKAT3UK] 3yr', 10, 'Monitors', 'Lenovo'],
            ['S24-4E', 'Lenovo ThinkVision S24-4e 23.8" FHD IPS [64B5KAT1UK] 3yr', 10, 'Monitors', 'Lenovo'],
            ['T24-40', 'Lenovo ThinkVision T24-40 FHD [64A4MATXUK] 3yr', 10, 'Monitors', 'Lenovo'],
            ['T24V-30', 'Lenovo ThinkVision T24v-30 23.8" FHD IPS 60Hz [63D8MAT3UK] CAM+MIC+SPKR 3yr', 10, 'Monitors', 'Lenovo'],
            ['T24MV-30', 'Lenovo ThinkVision T24MV-30 23.8" FHD IPS [63D7UAT3UK] Webcam+Speaker+RJ45 3yr', 10, 'Monitors', 'Lenovo'],
            ['P24QD-40', 'Lenovo ThinkVision P24QD-40 QHD [64B1GAT1UK] 3yr', 10, 'Monitors', 'Lenovo'],
            ['S27I-30', 'Lenovo ThinkVision S27i-30 27.0" FHD [63DFKAT4UK] 3yr', 10, 'Monitors', 'Lenovo'],
            ['T27I-30', 'Lenovo ThinkVision T27i-30 27" FHD [63A4MAT1UK] 3yr', 10, 'Monitors', 'Lenovo'],
            ['T27-40', 'Lenovo ThinkVision T27-40 27" FHD [64A5MAT6UK] 3yr', 10, 'Monitors', 'Lenovo'],
            ['T27HV-30', 'Lenovo ThinkVision T27HV-30 QHD VoIP USB-C [63D6UAT3UK] VoIP Monitor 3yr', 10, 'Monitors', 'Lenovo'],
            ['TIO27-11JHRAT1UK', 'Lenovo ThinkCentre TIO27 27" QHD LED Non-Touch [11JHRAT1UK] CAM+MIC+SPKR VESA 3yr', 10, 'Monitors', 'Lenovo'],
            ['T27P-30', 'Lenovo ThinkVision T27p-30 UHD Monitor [63A9GAT1UK] 3yr', 10, 'Monitors', 'Lenovo'],
            ['T27UD-40', 'Lenovo ThinkVision T27UD-40 UHD Monitor [64AFGAT2UK] 3yr', 10, 'Monitors', 'Lenovo'],
            ['P27Q-40', 'Lenovo ThinkVision P27q-40 27" QHD LED [64A7GAT6UK] 3yr', 10, 'Monitors', 'Lenovo'],
            ['P27QD-40', 'Lenovo ThinkVision P27QD-40 QHD [64B3GAT2UK] 3yr', 10, 'Monitors', 'Lenovo'],
            ['T32UD-40', 'Lenovo ThinkVision T32UD-40 32" UHD USB-C Docking [64B0GAT1UK] 3yr', 10, 'Monitors', 'Lenovo'],
            ['T32P-40', 'Lenovo ThinkVision T32P-40 32" UHD [63D2GAT1UK] 3yr', 10, 'Monitors', 'Lenovo'],
            ['T34WD-40', 'Lenovo ThinkVision T34WD-40 34" QHD Curved [64AEGAT1UK] 3yr', 10, 'Monitors', 'Lenovo'],
            ['P34WD-40', 'Lenovo ThinkVision P34WD-40 WQHD [64ADGAT1UK] 3yr', 10, 'Monitors', 'Lenovo'],
            ['P40W-WUHD', 'Lenovo ThinkVision P40W 39.7" WUHD 5120x2160 [62C1GAT6UK] 3yr', 10, 'Monitors', 'Lenovo'],
            ['P49W-5K', 'Lenovo ThinkVision P49W 49" 5K QHD [63DBRAT1UK] 3yr', 10, 'Monitors', 'Lenovo'],

            // --- HP MONITORS ---
            ['S3-PRO-322PE', 'HP S3 Pro 322PE IPS 21.45" FHD 3yr', 10, 'Monitors', 'HP'],
            ['S3-PRO-322PH', 'HP S3 Pro 322Ph 21.5" FHD IPS Height Adj Tilt 3yr', 10, 'Monitors', 'HP'],
            ['S3-PRO-324PV', 'HP S3 Pro 324pv FHD IPS Adjustable Tilt 3yr', 10, 'Monitors', 'HP'],
            ['S5-524DA', 'HP S5 524DA 23.8" FHD IPS Dual Speaker Height Adj 3yr', 10, 'Monitors', 'HP'],
            ['S5-524SH', 'HP S5 524sh 24" FHD IPS 3yr', 10, 'Monitors', 'HP'],
            ['S5-524SW', 'HP S5 524sw FHD White IPS White Display 3yr', 10, 'Monitors', 'HP'],
            ['S5-524SF-BLACK', 'HP S5 524SF 23.8" FHD Black IPS Black 3yr', 10, 'Monitors', 'HP'],
            ['S5-PRO-524PN', 'HP S5 Pro 524pn WUXGA IPS Height Adj Tilt Swivel Pivot 3yr', 10, 'Monitors', 'HP'],
            ['S5-PRO-524PU', 'HP S5 Pro 524pu 23.8" FHD USB-C IPS USB-C Display 3yr', 10, 'Monitors', 'HP'],
            ['S3-PRO-327PE', 'HP S3 Pro 327pe 27" FHD IPS 3yr', 10, 'Monitors', 'HP'],
            ['S5-527SA', 'HP S5 527sa FHD IPS With Speaker 3yr', 10, 'Monitors', 'HP'],
            ['S5-527SF', 'HP S5 527sf FHD IPS 3yr', 10, 'Monitors', 'HP'],
            ['S5-527SW', 'HP S5 527sw FHD IPS 3yr', 10, 'Monitors', 'HP'],
            ['S5-527SH', 'HP S5 527sh FHD IPS Height Adj 3yr', 10, 'Monitors', 'HP'],
            ['S5-527DA', 'HP S5 527DA 27" FHD IPS Dual Speaker Height Adj 3yr', 10, 'Monitors', 'HP'],
            ['S5-527PQ', 'HP S5 527PQ QHD IPS 4-Way Adjustability 3yr', 10, 'Monitors', 'HP'],
            ['E27-G5', 'HP E27 G5 FHD IPS 3yr', 10, 'Monitors', 'HP'],
            ['S5-532SF', 'HP S5 532sf FHD IPS 3yr', 10, 'Monitors', 'HP'],
            ['S5-534PM', 'HP S5 534PM WQHD USB-C IPS USB-C Display 3yr', 10, 'Monitors', 'HP'],
            ['P34HC-G4', 'HP P34HC G4 WQHD USB-C IPS 3yr', 10, 'Monitors', 'HP'],

            // --- DESKTOPS ---
            ['290G9-MT-I3', 'HP 290 G9 MT Intel Core i3-13100 8GB DDR4 512GB SSD DOS', 10, 'Desktops', 'HP'],
            ['290G9-MT-I5', 'HP 290 G9 MT Intel Core i5-13500 8GB DDR4 512GB SSD DOS', 10, 'Desktops', 'HP'],
            ['290G9-MT-I7', 'HP 290 G9 MT Intel Core i7-13700 8GB DDR4 512GB SSD DOS', 10, 'Desktops', 'HP'],
            ['400G9-MT-I7', 'HP ProDesk 400 G9 Intel Core i7-14700 8GB 512GB SSD NVMe WiFi DOS', 10, 'Desktops', 'HP'],
            ['V3030-MT', 'Dell Vostro 3030 MT Intel Core i3 8GB 512GB SSD DOS', 10, 'Desktops', 'Dell'],
            ['O7020-MT-I5', 'Dell OptiPlex 7020 MT Intel Core i5-12500 8GB 512GB SSD DOS', 10, 'Desktops', 'Dell'],
            ['O7020-PLUS-I7', 'Dell OptiPlex 7020 Plus Intel Core i7-14700 8GB 512GB SSD DOS', 10, 'Desktops', 'Dell'],
            ['ECT1250-MT-I3', 'Dell Desktop ECT1250 MT Intel Core i3 8GB 512GB SSD Intel UHD WiFi+BT DOS', 10, 'Desktops', 'Dell'],
            ['ECT1250-MT-I5', 'Dell Desktop ECT1250 MT Intel Core i5 8GB 512GB SSD Intel UHD WiFi+BT DOS', 10, 'Desktops', 'Dell'],
            ['ECT1250-MT-I7', 'Dell Desktop ECT1250 MT Intel Core i7 8GB 512GB SSD Intel UHD WiFi+BT DOS', 10, 'Desktops', 'Dell'],
            ['QCT1250-MT-I5', 'Dell Tower QCT1250 Intel Core i5-14500 8GB 512GB SSD DOS', 10, 'Desktops', 'Dell'],
            ['QCT1250-MT-I7', 'Dell Tower QCT1250 Intel Core i7-14700 16GB 512GB SSD English KB DOS 3yr', 10, 'Desktops', 'Dell'],

            // --- AIO ---
            ['22-DG0012NH', 'HP All-in-One 22-dg0012NH Intel Core i3 / N305 8GB 512GB SSD 21.5" FHD DOS', 10, 'AIO', 'HP'],
            ['22-DG0013NH', 'HP All-in-One 22-dg0013NH Intel Core i3 8GB 512GB SSD 21.5" FHD DOS', 10, 'AIO', 'HP'],
            ['24-CB1025NH', 'HP All-in-One 24-cb1025NH Intel Core i5 12th Gen 8GB 512GB SSD 23.8" FHD DOS', 10, 'AIO', 'HP'],
            ['24-CR0030NE', 'HP All-in-One 24-cr0030ne Intel Core i7 13th Gen 16GB 1TB SSD 23.8" FHD DOS', 10, 'AIO', 'HP'],
            ['24-CR0127NH', 'HP All-in-One 24-cr0127NH Intel Core i7 13th Gen 8GB 512GB SSD 23.8" FHD DOS', 10, 'AIO', 'HP'],
            ['24-CR0128NH', 'HP All-in-One 24-cr0128NH Intel Core i7 13th Gen 8GB 512GB SSD 23.8" FHD DOS', 10, 'AIO', 'HP'],
            ['24-CR0129NH', 'HP All-in-One 24-cr0129NH Intel Core i7 13th Gen 16GB 1TB SSD 23.8" FHD DOS', 10, 'AIO', 'HP'],
            ['24-CR0254NH', 'HP All-in-One 24-cr0254NH Intel Core i7 13th Gen 16GB 512GB SSD 23.8" FHD DOS', 10, 'AIO', 'HP'],
            ['24-CR1078NH', 'HP All-in-One 24-cr1078NH Intel Ultra 7 16GB 512GB SSD 23.8" FHD White DOS', 10, 'AIO', 'HP'],
            ['24-CR1079NH', 'HP All-in-One 24-cr1079NH Intel Ultra 7 16GB 512GB SSD 23.8" FHD Black DOS', 10, 'AIO', 'HP'],
            ['24-CR0255', 'HP All-in-One 24-cr0255 (Touch) Intel Core i7 13th Gen 16GB 512GB SSD 23.8" FHD Touch DOS', 10, 'AIO', 'HP'],
            ['24-CR0256', 'HP All-in-One 24-cr0256 (Touch) Intel Core i7 13th Gen 16GB 512GB SSD 23.8" FHD Touch DOS', 10, 'AIO', 'HP'],
            ['24-CR0258NH', 'HP All-in-One 24-cr0258NH Intel Core i7 13th Gen 16GB 512GB SSD 23.8" FHD DOS', 10, 'AIO', 'HP'],
            ['24-CR0307NH', 'HP All-in-One 24-cr0307NH Intel Core i5 13th Gen 8GB 512GB SSD 23.8" FHD DOS', 10, 'AIO', 'HP'],
            ['24-CR0308', 'HP All-in-One 24-cr0308 Intel Core i5 13th Gen 8GB 512GB SSD 23.8" FHD DOS', 10, 'AIO', 'HP'],
            ['24-CR0321', 'HP All-in-One 24-cr0321 (Touch) Intel Core i7 13th Gen 16GB 1TB SSD 23.8" FHD Touch DOS', 10, 'AIO', 'HP'],
            ['24-CR0322', 'HP All-in-One 24-cr0322 (Touch) Intel Core i7 13th Gen 16GB 1TB SSD 23.8" FHD Touch DOS', 10, 'AIO', 'HP'],
            ['24-CR0343NH', 'HP All-in-One 24-cr0343NH (Touch) Intel Core i5 13th Gen 8GB 512GB SSD 23.8" FHD Touch DOS', 10, 'AIO', 'HP'],
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
