<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\SupplierProduct;
use Illuminate\Support\Str;

class CapComputerProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Ensure Supplier Exists
        $supplier = Supplier::firstOrCreate(
            ['name' => 'Cap Computer Trading LLC'],
            [
                'email' => 'sales@capcomputer.com',
                'phone' => '+971 4 353 2222',
                'address' => 'Bur Dubai, Dubai, UAE',
            ]
        );

        // 2. Ensure Brands Exist
        $brands = [
            'HP' => Brand::firstOrCreate(['name' => 'HP']),
            'Dell' => Brand::firstOrCreate(['name' => 'Dell']),
            'Lenovo' => Brand::firstOrCreate(['name' => 'Lenovo']),
            'Philips' => Brand::firstOrCreate(['name' => 'Philips']),
            'Dahua' => Brand::firstOrCreate(['name' => 'Dahua']),
            'Acer' => Brand::firstOrCreate(['name' => 'Acer']),
            'HPE' => Brand::firstOrCreate(['name' => 'HPE']),
        ];

        // 3. Ensure Categories Exist
        $categories = [
            'Monitors' => Category::firstOrCreate(['name' => 'Monitors']),
            'Desktops' => Category::firstOrCreate(['name' => 'Desktops']),
            'AIO' => Category::firstOrCreate(['name' => 'All-in-One']),
            'Servers' => Category::firstOrCreate(['name' => 'Servers']),
            'Workstations' => Category::firstOrCreate(['name' => 'Workstations']),
        ];

        $products = [
            // --- LENOVO MONITORS ---
            ['61E0KCT6UK', 'Lenovo ThinkVision D19-10 18.5" HD VGA HDMI 3yr', 10, 'Monitors', 'Lenovo'],
            ['62C6KAT1UK', 'Lenovo ThinkVision S22e-20 21.5" FHD 3yr', 10, 'Monitors', 'Lenovo'],
            ['63FCKATBUK', 'Lenovo ThinkVision S22i-30 21.5" FHD 3yr', 10, 'Monitors', 'Lenovo'],
            ['64CBKAT6UK', 'Lenovo ThinkVision S22-4e 21.5" FHD 3yr', 10, 'Monitors', 'Lenovo'],
            ['61DBMAT1EU', 'Lenovo ThinkVision T25d-10 25" FHD HDMI 3yr', 10, 'Monitors', 'Lenovo'],
            ['63DFKAT4UK', 'Lenovo ThinkVision S27i-30 27" FHD 3yr', 10, 'Monitors', 'Lenovo'],
            ['63DDKAT6UK', 'Lenovo ThinkVision C27-40 27" FHD 3yr', 10, 'Monitors', 'Lenovo'],
            ['66F8GAC3UK', 'Lenovo ThinkVision Y27-30 27" FHD 3yr', 10, 'Monitors', 'Lenovo'],
            ['67AEKACBAE', 'Lenovo L22i-40 IPS 60Hz 22" FHD IPS 3yr', 10, 'Monitors', 'Lenovo'],
            ['64A4MAT2AE', 'Lenovo ThinkVision T24-40 IPS 23.8" FHD IPS 3yr', 10, 'Monitors', 'Lenovo'],
            ['64B5KAT1UK', 'Lenovo ThinkVision S24-4e 23.8" FHD 3yr', 10, 'Monitors', 'Lenovo'],
            ['66FCGAC2AE', 'Lenovo ThinkVision D32-40 31.5" FHD 3yr', 10, 'Monitors', 'Lenovo'],

            // --- HP & PHILIPS & DAHUA MONITORS ---
            ['241V8B/89', 'Philips 241V8B 23.8" Monitor FHD HDMI VGA 3yr', 10, 'Monitors', 'Philips'],
            ['DHI-LM22-A200', 'Dahua DHI-LM22-A200 21.5" FHD 3yr', 10, 'Monitors', 'Dahua'],
            ['DHI-LM22-A200YS', 'Dahua DHI-LM22-A200YS (With Speaker) 22" FHD Speaker 3yr', 10, 'Monitors', 'Dahua'],
            ['DHI-LM24-B201S', 'Dahua LM24-B201S IPS 24" FHD IPS 3yr', 10, 'Monitors', 'Dahua'],
            ['DHI-LM24-A200Y', 'Dahua DHI-LM24-A200Y 24" FHD 3yr', 10, 'Monitors', 'Dahua'],
            ['LM24-A200YS', 'Dahua LM24-A200YS (With Speaker) 23.8" FHD Speaker 3yr', 10, 'Monitors', 'Dahua'],
            ['DHI-LM24-A201F', 'Dahua DHI-LM24-A201F 24" FHD 3yr', 10, 'Monitors', 'Dahua'],
            ['DHI-LM27-A200F', 'Dahua DHI-LM27-A200F 27" FHD 3yr', 10, 'Monitors', 'Dahua'],
            ['DHI-LM27-A201F', 'Dahua DHI-LM27-A201F 27" FHD 3yr', 10, 'Monitors', 'Dahua'],
            ['DHI-LM27-E231', 'Dahua DHI-LM27-E231 27" FHD 3yr', 10, 'Monitors', 'Dahua'],
            ['5RD66AA', 'HP P204v 19.5" Monitor HD+ VGA 3yr', 10, 'Monitors', 'HP'],
            ['M1F41AS', 'HP EliteDisplay E202 20" FHD 3yr', 10, 'Monitors', 'HP'],
            ['9U5B0UT', 'HP Series 3 Pro 322pf 21.5" FHD 3yr', 10, 'Monitors', 'HP'],
            ['169L0AA', 'HP E24mv G4 FHD Conferencing 23.8" FHD CAM+MIC 3yr', 10, 'Monitors', 'HP'],
            ['64W18AS', 'HP P24v G5 FHD 23.8" FHD 3yr', 10, 'Monitors', 'HP'],
            ['94C37AA', 'HP Series 5 524sa 23.8" FHD + Speakers 3yr', 10, 'Monitors', 'HP'],
            ['94C20AA', 'HP Series 5 524sh 23.8" FHD Height Adj 3yr', 10, 'Monitors', 'HP'],
            ['94C21AS', 'HP Series 5 524sw FHD White 23.8" FHD 3yr', 10, 'Monitors', 'HP'],
            ['9D9L6UT', 'HP Series 5 Pro 524pf 23.8" FHD 3yr', 10, 'Monitors', 'HP'],
            ['94C51AA', 'HP Series 5 527sh 27" FHD Height Adj 3yr', 10, 'Monitors', 'HP'],
            ['65P58AS', 'HP V24i G5 23.8" FHD 3yr', 10, 'Monitors', 'HP'],
            ['1C4Z5AA', 'HP Z24n G3 24" WUXGA 3yr', 10, 'Monitors', 'HP'],
            ['40Z29AS', 'HP E27m G4 QHD USB-C Conferencing 27" QHD 3yr', 10, 'Monitors', 'HP'],
            ['40Z29AA', 'HP E27m G4 27" QHD IPS USB-C Conferencing 3yr', 10, 'Monitors', 'HP'],
            ['94F46AS', 'HP Series 5 527sw 27" FHD White 3yr', 10, 'Monitors', 'HP'],
            ['9D9S0UT', 'HP Series 5 Pro 527pq 27" QHD 3yr', 10, 'Monitors', 'HP'],
            ['94F44AS', 'HP Series 5 527sf 27" FHD 3yr', 10, 'Monitors', 'HP'],
            ['40Z26AA', 'HP E34m G4 WQHD Curved USB-C Conferencing 34" WQHD 3yr', 10, 'Monitors', 'HP'],

            // --- DELL MONITORS ---
            ['E2016HV', 'Dell E2016HV 20" LED VGA HD 3yr', 10, 'Monitors', 'Dell'],
            ['P2425H', 'Dell Pro 24 Plus Monitor P2425H 24" FHD USB-C HDMI DP VGA 3yr', 10, 'Monitors', 'Dell'],
            ['SE2425HM', 'Dell SE2425HM 24" FHD 23.8" FHD 1080p VGA HDMI 3yr', 10, 'Monitors', 'Dell'],
            ['E2425HM', 'Dell Pro 24 E2425HM 23.8" FHD VGA DP HDMI 3yr', 10, 'Monitors', 'Dell'],
            ['SE2725HM', 'Dell SE2725HM 27" FHD 1080p VGA HDMI 3yr', 10, 'Monitors', 'Dell'],

            // --- DESKTOPS ---
            ['ECT1250-I5-EN', 'Dell Tower ECT1250 i5-14400 8GB DDR5 512GB NVMe WiFi DOS ENG', 10, 'Desktops', 'Dell'],
            ['ECT1250-I5-AR', 'Dell Tower ECT1250 i5-14400 8GB DDR5 512GB NVMe WiFi DOS AR', 10, 'Desktops', 'Dell'],
            ['QCT1250-I7', 'Dell Pro Tower QCT1250 i7-14700 8GB DDR5 512GB SSD DOS', 10, 'Desktops', 'Dell'],
            ['O7020-MT-I3', 'Dell OptiPlex 7020 MT i3-12100 8GB DDR5 512GB SSD No OS', 10, 'Desktops', 'Dell'],
            ['2DH78AA', 'HP T-530 Thin Client AMD GX-215JJ 4GB DDR4 DOS', 10, 'Desktops', 'HP'],
            ['B70TJAT', 'HP 290 System i3-12100 4GB 1TB WiFi P204 Monitor DOS', 10, 'Desktops', 'HP'],
            ['A54WDET', 'HP Pro Tower 290 G9 i3-14100 8GB DDR5 512GB NVMe FreeDOS', 10, 'Desktops', 'HP'],
            ['A54XLET', 'HP 290 G9 TWR i5-14400 16GB No SSD DVD-RW DOS', 10, 'Desktops', 'HP'],
            ['CA7Y3AT', 'HP Pro Tower 290 G9 i7-14700 8GB DDR4 512GB DVD-RW WiFi FreeDOS', 10, 'Desktops', 'HP'],
            ['A21G9PA', 'HP Pro Tower 400 G9 i5-13500 16GB DDR4 1TB M.2 GT710 2GB FreeDOS', 10, 'Desktops', 'HP'],
            ['99N19ET', 'HP Pro Tower 400 G9 i3-13100 8GB DDR4 256GB NVMe FreeDOS', 10, 'Desktops', 'HP'],
            ['CB1L0AT', 'HP Pro Tower 400 G9 i5-14500 8GB DDR5 512GB NVMe WiFi DOS', 10, 'Desktops', 'HP'],
            ['B85LCAV', 'HP 260 G9 Mini i5-1334U 8GB 512GB SSD DOS', 10, 'Desktops', 'HP'],
            ['C9YX9AT', 'HP Pro SFF 400 G9 i3-13100 8GB 256GB M.2 DOS', 10, 'Desktops', 'HP'],
            ['99N59ET', 'HP Pro 400 G9 SFF i5-13500 8GB DDR4 512GB NVMe FreeDOS', 10, 'Desktops', 'HP'],
            ['6U4V1EA', 'HP Pro SFF 400 G9 i5-13500 8GB 512GB DOS', 10, 'Desktops', 'HP'],
            ['A54X6ET', 'HP Pro Mini 400 G9 i7-14700T 8GB DDR5 512GB SSD WiFi DOS', 10, 'Desktops', 'HP'],
            ['8X4W1AV', 'HP Pro Mini 400 G9 i7-14700T 8GB DDR5 512GB SSD WiFi DOS V2', 10, 'Desktops', 'HP'],
            ['A55PPET', 'HP Elite Tower 800 G9 i5-14500 16GB DDR5 512GB NVMe WiFi DOS', 10, 'Desktops', 'HP'],
            ['7E5Q2AV', 'HP Elite TWR 800 G9 i5-14400 16GB DDR5 512GB NVMe WiFi DOS', 10, 'Desktops', 'HP'],
            ['99M51ET-8GB', 'HP Elite Tower 800 G9 i7-14700 8GB DDR5 512GB NVMe DOS AR', 10, 'Desktops', 'HP'],
            ['99M51ET-16GB', 'HP Elite Tower 800 G9 i7-14700 16GB DDR5 512GB NVMe DOS AR', 10, 'Desktops', 'HP'],
            ['5L3Q3ES', 'HP Elite Tower 800 G9 i7-14700 16GB DDR5 512GB NVMe DOS AR V2', 10, 'Desktops', 'HP'],
            ['7E5D2AV-I5', 'HP Elite SFF 800 G9 i5-14400 16GB 512GB SSD WiFi DOS', 10, 'Desktops', 'HP'],
            ['7E5D2AV-I7', 'HP Elite SFF 800 G9 i7-14700 16GB 512GB SSD WiFi DOS', 10, 'Desktops', 'HP'],
            ['449W1ES', 'HP Elite Mini 800 G9 i7-14700T 16GB 1TB SSD Win 11 Pro', 10, 'Desktops', 'HP'],
            ['C7FX9AT', 'HP Elite Mini 800 G9 i7-14700 16GB 512GB M.2 WiFi DOS', 10, 'Desktops', 'HP'],
            ['C7GG7AT', 'HP Elite Mini 800 G9 i5-14500 16GB 512GB DOS', 10, 'Desktops', 'HP'],

            // --- AIO ---
            ['C1JT1PA', 'HP AIO 24-CR0229D i5-1334U 8GB 512GB NVMe Touch Win 11', 10, 'AIO', 'HP'],
            ['8P9N2EA', 'HP AIO 24-cr0041ny i7 16GB 512GB SSD FHD (White) FreeDOS', 10, 'AIO', 'HP'],
            ['91G35EA', 'HP AIO 24-cr0125nh i7-1355U 8GB 512GB SSD DOS', 10, 'AIO', 'HP'],

            // --- LENOVO DESKTOPS ---
            ['12UD00C2GP', 'Lenovo Neo 50t G5 i3-14100 8GB 512GB SSD No OS', 10, 'Desktops', 'Lenovo'],
            ['12U6003DGP', 'Lenovo ThinkCentre M70t Gen5 i5-14400 8GB 512GB NVMe DOS', 10, 'Desktops', 'Lenovo'],
            ['12UD00BYAX', 'Lenovo Neo 50T Gen5 i5-14400 8GB 512GB NVMe DOS AR', 10, 'Desktops', 'Lenovo'],
            ['12UD00BSGP', 'Lenovo Neo 50T Gen5 i5-14400 8GB DDR5 512GB NVMe DOS', 10, 'Desktops', 'Lenovo'],
            ['12U60046GR', 'Lenovo ThinkCentre M70t Gen5 i7-14700 16GB 512GB SSD Win 11', 10, 'Desktops', 'Lenovo'],
            ['12U6004AGP-AR', 'Lenovo ThinkCentre M70t Gen5 i5-14400 8GB 512GB SSD WiFi AR', 10, 'Desktops', 'Lenovo'],
            ['12U6004AGP-EN', 'Lenovo ThinkCentre M70t Gen5 i5-14400 8GB 512GB SSD WiFi EN', 10, 'Desktops', 'Lenovo'],
            ['12U6006VGP', 'Lenovo M70t G5 i7-13700 8GB DDR5 512GB SSD No OS EN', 10, 'Desktops', 'Lenovo'],
            ['12U6006VGR', 'Lenovo M70t G5 i7-13700 8GB DDR5 512GB SSD No OS AR', 10, 'Desktops', 'Lenovo'],
            ['12U60046GP', 'Lenovo M70t Gen5 i7-14700 8GB DDR5 512GB SSD WiFi No OS', 10, 'Desktops', 'Lenovo'],
            ['12V8003SGR', 'Lenovo ThinkCentre M90s Gen5 i5-14500 8GB 256GB NVMe WiFi Win 11 Pro', 10, 'Desktops', 'Lenovo'],
            ['12LN003PGP', 'Lenovo Neo 50q Gen 4 i5-13420H 8GB 512GB SSD WiFi No OS', 10, 'Desktops', 'Lenovo'],
            ['12LN005SGP', 'Lenovo Neo 50q Gen 4 Tiny i5-13420H 8GB 512GB SSD No OS', 10, 'Desktops', 'Lenovo'],
            ['12E3002RGP', 'Lenovo M70q Gen 4 Tiny i7-13700T 8GB 512GB SSD WiFi DOS', 10, 'Desktops', 'Lenovo'],
            ['12JH00ETGP-I3-12', 'Lenovo Neo 50s Gen 4 i3-12100 4GB 256GB DOS', 10, 'Desktops', 'Lenovo'],
            ['12JH00ETGP-NORAM', 'Lenovo Neo 50s Gen 4 i3-12100 No RAM 256GB DOS', 10, 'Desktops', 'Lenovo'],
            ['12JH00ETGP-I3-13', 'Lenovo Neo 50s Gen 4 i3-13100 4GB 256GB DOS', 10, 'Desktops', 'Lenovo'],
            ['12JH00ETGP-8GB', 'Lenovo Neo 50s Gen 4 i3-12100 8GB 512GB DOS', 10, 'Desktops', 'Lenovo'],
            ['11T000AMGP', 'Lenovo Neo 50s Gen3 i3-12100 8GB 1TB HDD WiFi No OS', 10, 'Desktops', 'Lenovo'],
            ['11T000HKGP', 'Lenovo Neo 50s Gen 3 i5-12400 4GB 256GB NVMe DVD-RW DOS', 10, 'Desktops', 'Lenovo'],
            ['11T00099GR', 'Lenovo Neo 50s i3-12100 4GB 1TB No OS', 10, 'Desktops', 'Lenovo'],
            ['11SYS02H00', 'Lenovo Neo 50s G3 i3-12100 4GB 1TB DOS', 10, 'Desktops', 'Lenovo'],
            ['11SYS1RS00', 'Lenovo Neo 50s G3 i7-12700 4GB 1TB DOS', 10, 'Desktops', 'Lenovo'],
            ['11SWS0K400', 'Lenovo Neo 50s G3 i7-12700 4GB 1TB DOS V2', 10, 'Desktops', 'Lenovo'],
            ['12JH0050GP', 'Lenovo Neo 50s Gen 4 i3-13100 4GB 1TB HDD DVD-RW DOS', 10, 'Desktops', 'Lenovo'],
            ['12JH0053GP', 'Lenovo Neo 50s G4 i5-13400 8GB 1TB HDD DOS', 10, 'Desktops', 'Lenovo'],
            ['12XD00BHGR', 'Lenovo Neo 50s Gen5 i3-14100 8GB 512GB NVMe No WiFi DOS', 10, 'Desktops', 'Lenovo'],
            ['12XD00BDGP', 'Lenovo Neo 50s Gen5 i5-14400 8GB 512GB NVMe No WiFi DOS EN', 10, 'Desktops', 'Lenovo'],
            ['12XD00BDGR', 'Lenovo Neo 50s Gen5 i5-14400 8GB 512GB NVMe No WiFi DOS AR', 10, 'Desktops', 'Lenovo'],
            ['12XD005JGP', 'Lenovo Neo 50s Gen5 i7-14700 8GB 512GB NVMe No WiFi DOS EN', 10, 'Desktops', 'Lenovo'],
            ['12XD005JGR', 'Lenovo Neo 50s Gen5 i7-14700 8GB 512GB NVMe No WiFi DOS AR', 10, 'Desktops', 'Lenovo'],
            ['12JH005EGR', 'Lenovo Neo 50s G4 i5-13400 8GB 512GB SSD DOS AR', 10, 'Desktops', 'Lenovo'],
            ['12DSS04L00', 'Lenovo M70s Gen 4 i7-13700 16GB 512GB NVMe WiFi Win 11 Pro', 10, 'Desktops', 'Lenovo'],

            // --- LENOVO & ACER AIO ---
            ['DQ.BMREM.002', 'Acer Aspire C27 i7-1355U 16GB 1TB NVMe 27" FHD', 10, 'AIO', 'Acer'],
            ['F0HN00M9AK', 'Lenovo IdeaCentre 24IRH9 i3-1315U 8GB 512GB 23.8" FHD (White) DOS', 10, 'AIO', 'Lenovo'],
            ['F0HM00GJLK', 'Lenovo IdeaCentre AIO 3 27IRH9 i7-13620H 16GB DDR5 512GB SSD 27" FHD DOS', 10, 'AIO', 'Lenovo'],
            ['F0HN00AGAX', 'Lenovo IdeaCentre 24IRH9 i7-13620H 16GB 1TB SSD 23.8" FHD DOS', 10, 'AIO', 'Lenovo'],
            ['F0J60070LK', 'Lenovo A100 AIO i3-N305 8GB 512GB SSD WiFi 6 (White) DOS', 10, 'AIO', 'Lenovo'],
            ['F0HN00AHAK', 'Lenovo IdeaCentre 24IRH9 i7-13620H 16GB 1TB SSD 23.8" FHD Touch DOS', 10, 'AIO', 'Lenovo'],
            ['F0HN00DUAK', 'Lenovo IdeaCentre 24IRH9 i7-13620H 16GB 1TB SSD 23.8" FHD DOS V2', 10, 'AIO', 'Lenovo'],
            ['12SA000YGP', 'Lenovo Neo 50a 27 Gen5 i7-13620H 16GB 512GB SSD 27" FHD No OS', 10, 'AIO', 'Lenovo'],
            ['11FJ000JUM', 'Lenovo V50a-24 AIO i7-10700T 8GB 1TB HDD 23.8" FHD DOS', 10, 'AIO', 'Lenovo'],
            ['F0J60071LK', 'Lenovo A100 AIO N100 8GB 512GB SSD (Grey) DOS', 10, 'AIO', 'Lenovo'],
            ['12SC000WGP', 'Lenovo Neo 50a 24 Gen5 i7-13620H 8GB 512GB SSD 23.8" FHD No OS EN', 10, 'AIO', 'Lenovo'],
            ['12SC000WGR', 'Lenovo Neo 50a 24 Gen5 i7-13620H 8GB 512GB SSD 23.8" FHD No OS AR', 10, 'AIO', 'Lenovo'],
            ['12SA000CGP', 'Lenovo Neo 50a 27 Gen5 i7-13620H 8GB 512GB SSD 27" FHD No OS EN', 10, 'AIO', 'Lenovo'],
            ['12SA000PGP', 'Lenovo Neo 50a 27 Gen5 i5-13420H 8GB 512GB SSD 27" FHD No OS EN', 10, 'AIO', 'Lenovo'],
            ['12SA000PGR', 'Lenovo Neo 50a 27 Gen5 i5-13420H 8GB 512GB SSD 27" FHD No OS AR', 10, 'AIO', 'Lenovo'],
            ['F0HN00VPLK', 'Lenovo IdeaCentre 24IRH9 i5-13420H 8GB DDR5 512GB SSD 23.8" FHD (Grey) DOS', 10, 'AIO', 'Lenovo'],

            // --- SERVERS ---
            ['P71673-425', 'HPE ProLiant DL360 Gen11 Xeon 4510 2x32GB 8SFF 3yr', 10, 'Servers', 'HPE'],
            ['P52560-B21', 'HPE ProLiant DL380 Gen11 Xeon 4410Y 32GB 8SFF 3yr', 10, 'Servers', 'HPE'],
            ['P53567-421', 'HPE ProLiant ML350 Gen11 Xeon 4410Y 32GB 8SFF 3yr', 10, 'Servers', 'HPE'],
            ['T160', 'Dell PowerEdge T160 Xeon E-2414 16GB 2TB HDD 3yr', 10, 'Servers', 'Dell'],
            ['R350', 'Dell PowerEdge R350 Xeon E-2314 16GB 4TB SAS 3yr', 10, 'Servers', 'Dell'],
            ['T360', 'Dell PowerEdge T360 Xeon E-2414 16GB 2TB SATA PERC H355 3yr', 10, 'Servers', 'Dell'],
            ['R250', 'Dell PowerEdge R250 Xeon E-2314 16GB 2TB HDD PERC H355 3yr', 10, 'Servers', 'Dell'],
            ['R750XS', 'Dell PowerEdge R750xs Xeon Silver 4310 16GB 1.2TB SAS 3yr', 10, 'Servers', 'Dell'],
            ['7DF3A00YEA', 'Lenovo ST50 V3 Xeon E-2434 32GB 2x960GB SSD 3yr', 10, 'Servers', 'Lenovo'],
            ['7DF3A010EA', 'Lenovo ThinkSystem ST50 V3 Xeon E-2414 16GB 2x960GB SSD 3yr', 10, 'Servers', 'Lenovo'],
            ['7X10A0F5EA', 'Lenovo Server ST550 Xeon 4210 32GB PERC 930-8i 3yr', 10, 'Servers', 'Lenovo'],
            ['7D76A02QEA', 'Lenovo SR650 V3 Xeon Silver 4410Y 64GB RAID 940-8i 3yr', 10, 'Servers', 'Lenovo'],
            ['7D76100ZEA', 'Lenovo ThinkSystem SR650 V3 Xeon Silver 4514Y 64GB RAID 940-8i 3yr', 10, 'Servers', 'Lenovo'],
            ['7D2VA06LEA', 'Lenovo SR665 AMD EPYC 7303 32GB RAID 930-8i 3yr', 10, 'Servers', 'Lenovo'],
            ['7D76A05JEA', 'Lenovo SR650 V3 Xeon 4510 64GB RAID 940-8i 3yr', 10, 'Servers', 'Lenovo'],
            ['7Z73A06BEA', 'Lenovo SR650 V2 Xeon Silver 4314 32GB RAID 9350-8i 3yr', 10, 'Servers', 'Lenovo'],
            ['7Z73A03-DEA', 'Lenovo SR650 V2 Xeon Silver 4310 32GB RDIMM RAID 940-8i 3yr', 10, 'Servers', 'Lenovo'],
            ['7D7QA031EA', 'Lenovo SR250 V2 (1U) Xeon E-2378 32GB RAID 5350-8i Rails 3yr', 10, 'Servers', 'Lenovo'],

            // --- WORKSTATIONS ---
            ['30EQS02B00', 'Lenovo ThinkStation P348 TWR i5-11500 8GB 1TB HDD DOS', 10, 'Workstations', 'Lenovo'],
            ['30FRS06U00', 'Lenovo ThinkStation P2 Tower i7-13700 8GB 512GB No OS', 10, 'Workstations', 'Lenovo'],
            ['30FRS0K000', 'Lenovo ThinkStation P2 Tower i7-14700 8GB 512GB NVMe DOS', 10, 'Workstations', 'Lenovo'],
            ['30FRS0D600', 'Lenovo ThinkStation P2 TWR i9-14900 8GB 512GB SSD No OS', 10, 'Workstations', 'Lenovo'],
            ['30GS00CBAX', 'Lenovo TS P3 Tower i7-14700K 16GB 512GB Win 11', 10, 'Workstations', 'Lenovo'],
            ['5E1A5ES', 'HP Z8 G5 Workstation Xeon Silver 4410Y 16GB 1TB SSD Win 11 Pro', 10, 'Workstations', 'HP'],
            ['5E1A6ES', 'HP Z8 G5 Tower Workstation Xeon Silver 4410Y 16GB 1TB SSD No GPU', 10, 'Workstations', 'HP'],
            ['B34LSES', 'HP Z1 G11 Ultra 7 265 8GB 512GB NVMe DOS', 10, 'Workstations', 'HP'],
            ['A2JV0ES', 'HP Z2 G9 Tower i7-14700K 16GB 1TB NVMe Ubuntu', 10, 'Workstations', 'HP'],
            ['8T1Y2EA', 'HP Z2 Tower G9 i9-14900K 16GB 1TB SSD DOS', 10, 'Workstations', 'HP'],
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
