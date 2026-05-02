<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\SupplierProduct;
use App\Models\Brand;
use App\Models\Category;
use Illuminate\Support\Str;

class AlRafaProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Ensure Supplier Exists
        $supplier = Supplier::firstOrCreate(
            ['name' => 'AL RAFA COMPUTER TRADING LLC'],
            [
                'email' => 'sales@alrafacomputer.com',
                'phone' => '+971 4 352 1111',
                'address' => 'Bur Dubai, Dubai, UAE',
            ]
        );

        // 2. Ensure Brand Exists
        $brand = Brand::firstOrCreate(
            ['name' => 'Lenovo']
        );

        // 3. Ensure Essential Categories Exist
        $categories = [
            'Laptops' => Category::firstOrCreate(['name' => 'Laptops']),
            'AIO' => Category::firstOrCreate(['name' => 'All-in-One']),
            'Desktops' => Category::firstOrCreate(['name' => 'Desktops']),
            'Monitors' => Category::firstOrCreate(['name' => 'Monitors']),
        ];

        $products = [
            // --- LAPTOPS (IMAGE 1) ---
            ['83A1011JAK', 'Lenovo V15 IRU, i3-1315U, 8GB DDR4, 256GB SSD, 15.6" FHD TN, KB UK-ENG,- 13th Gen', 231, 'Laptops'],
            ['83GW0076GP', 'Lenovo V15 IRU, i3-1315U, 8GB DDR4, 256GB SSD, 15.6" FHD TN, KB UK-ENG,- 13th Gen', 50, 'Laptops'],
            ['83A10099AK', 'Lenovo V15 IRU, i5-13420H, 8GB, 512GB SSD, 15.6" FHD TN, KB UK-ENG,- 13th Gen', 2, 'Laptops'],
            ['83A1008UAK', 'Lenovo V15 IRU, i5-13420H, 8GB, 512GB SSD, 15.6" FHD TN, KB UK-ENG,- 13th Gen', 50, 'Laptops'],
            ['83A100SUAK', 'Lenovo V15 IRU, i5-13420H, 8GB, 512GB SSD, 15.6" FHD TN, KB UK-ENG,- 13th Gen', 300, 'Laptops'],
            ['83GW006XGP', 'Lenovo V15 IRU, i5-13420H, 8GB DDR5, 512GB SSD, 15.6" FHD TN, KB UK-ENG,- 13th Gen', 100, 'Laptops'],
            ['83A100QKAK', 'Lenovo V15 IRU, i7-13620H, 8GB, 512GB SSD, 15.6" FHD TN, KB UK-ENG, FPR, - 13th Gen', 1, 'Laptops'],
            ['83GW0069GP', 'Lenovo V15 IRU, i7-13620H, 8GB DDR5, 512GB SSD, 15.6" FHD TN, KB UK-ENG, FPR, - 13th Gen', 100, 'Laptops'],
            ['21MR001BGQ', 'Lenovo ThinkBook 14 G7, Ultra 7 155H, 8GB DDR5, 512GB SSD, 14.0" IPS FHD 300nits, US-ENG Backlit KB, TopLoad Case, Intel Ultra CPU', 2, 'Laptops'],
            ['21KG00U0EV', 'Lenovo ThinkBook 14-IRL, i5-13420H 8GB DDR5, 512SSD, 14" IPS FHD 300nits, Eng KB, TopLoad Case, 13th Gen', 26, 'Laptops'],
            ['21KG00T2EV', 'Lenovo ThinkBook 14 G6, i5-13420H 8GB DDR5, 512SSD, 14.0" IPS FHD 300nits, BKLT ENG KB, TopLoad Case, 13th Gen', 55, 'Laptops'],
            ['21KG0055EV', 'Lenovo ThinkBook 14 G6, i7-13700H 8GB DDR5, 512SSD, 14.0" IPS FHD 300nits, ENG KB, TopLoad Case, 13th Gen', 75, 'Laptops'],
            ['21KG005QEV', 'Lenovo ThinkBook 14-IRL, i7-13700H 8GB DDR5, 512SSD, 14" IPS FHD 300nits, Backlit Eng KB, TopLoad Case, 13th Gen', 80, 'Laptops'],
            ['21KH004EEV', 'Lenovo ThinkBook 16-IRL, i5-1335U 8GB DDR5, 512SSD, 16" IPS FHD 300nits, Backlit Eng KB, TopLoad Case, 13th Gen', 80, 'Laptops'],
            ['21KH00S6EV', 'Lenovo ThinkBook 16-IRL, i5-13420H 8GB DDR5, 512SSD, 16" IPS FHD 300nits, Backlit Eng KB, TopLoad Case, 13th Gen', 203, 'Laptops'],
            ['21SG002UGQ', 'TB 14 Core 5-210H, 8GB DDR5, 512GB SSD, 14.0" WUXGA 300nits, FPR, BKLT KB US-ENG, TopLoad Case, Arctic Grey', 50, 'Laptops'],
            ['21SJ001UGQ', 'TB 14 Ultra 5-225U, 8GB DDR5, 512GB SSD, 14.0" WUXGA 300nits, FPR, BKLT KB US-ENG, TopLoad Case, Arctic Grey', 44, 'Laptops'],
            ['21SH0036GQ', 'TB 16 Core 5-210H, 8GB DDR5, 512GB SSD, 16.0" WUXGA 300nits, FPR, BKLT KB US-ENG, TopLoad Case, Arctic Grey', 50, 'Laptops'],
            ['21SK0027GQ', 'TB 16 Ultra 5-225U, 16GB DDR5, 512GB SSD, 16.0" WUXGA 300nits, FPR, BKLT KB US-ENG, TopLoad Case, Arctic Grey', 100, 'Laptops'],
            ['21SJ0001GQ', 'TB 14 Ultra 7-255H, 8GB DDR5, 512GB SSD, 14.0" WUXGA 300nits, FPR, BKLT KB US-ENG, TopLoad Case, Arctic Grey', 94, 'Laptops'],
            ['21SH002EGQ', 'TB 16 Core 7-240H, 8GB DDR5, 512GB SSD, 16.0" WUXGA 300nits, FPR, BKLT KB US-ENG, TopLoad Case, Arctic Grey', 100, 'Laptops'],
            ['21SK002KGQ', 'TB 16 Ultra 7-255H, 8GB DDR5, 512GB SSD, 16.0" WUXGA 300nits, FPR, BKLT KB US-ENG, TopLoad Case, Arctic Grey', 96, 'Laptops'],
            ['21SK0030GQ', 'TB 16 Ultra 7-255H, 16GB DDR5, 512GB SSD, 16.0" WUXGA 300nits, FPR, BKLT KB US-ENG, TopLoad Case, Arctic Grey', 95, 'Laptops'],
            ['21MA006YGQ', 'Lenovo ThinkPad E16 U7-155H, 16GB DDR5, 1TB SSD, 16" FHD IPS 300nits WUXGA Touch, Backlit ENG KB, Top Load Case, FPR, Intel Ultra CPU', 42, 'Laptops'],
            ['21T9004YGQ', 'Lenovo ThinkPad E14 Core5-210H, 8GB DDR5, 512GB SSD, 14" FHD IPS 300nits WUXGA, Backlit ENG KB, Top Load Case, FPR, Core5-V2', 100, 'Laptops'],
            ['21T90059GQ', 'Lenovo ThinkPad E14 Core7-240H, 16GB DDR5, 512GB SSD, 14" FHD IPS 300nits WUXGA, Backlit ENG KB, Top Load Case, FPR, Core7-V2', 100, 'Laptops'],
            ['21TF005JGQ', 'Lenovo ThinkPad E16 Core5-210H, 8GB DDR5, 512GB SSD, 16" FHD IPS 300nits WUXGA, Backlit ENG KB, Top Load Case, FPR, Core5-V2', 100, 'Laptops'],
            ['21TF0058GQ', 'Lenovo ThinkPad E16 Core7-240H, 16GB DDR5, 512GB SSD, 16" FHD IPS 300nits WUXGA, Backlit ENG KB, Top Load Case, FPR, Core7-V2', 100, 'Laptops'],

            // --- LAPTOPS (IMAGE 2) ---
            ['82X700BVPS', 'Lenovo IP S300 Series, i3 1315U, 8GB, 256GB SSD M.2, INTEGRATED GRAPHICS, 15.6" FHD - 13th Gen', 100, 'Laptops'],
            ['82X700EUPS', 'Lenovo IP S300 Series, i3 1315U, 8GB, 512GB SSD M.2, INTEGRATED GRAPHICS, 15.6" FHD - 13th Gen', 50, 'Laptops'],
            ['83EM00L7PS', 'Lenovo IP S300 Series, i5 13420H, 8GB, 512GB SSD, 15.6" IPS FHD, ARCTIC GREY, ENG BKLT KB, - 13th Gen', 181, 'Laptops'],
            ['83K100DXPS', 'Lenovo IP S300 Series, i5 13420H, 8GB, 512GB SSD M.2, INTEGRATED GRAPHICS, 15.3" FHD, ARCTIC GREY, ENG US KB, - 13th Gen', 100, 'Laptops'],
            ['83K100DWPS', 'Lenovo IP S300 Series, i5 13420H, 8GB, 512GB SSD M.2, INTEGRATED GRAPHICS, 15.3" FHD, ARCTIC GREY, Backlit ENG US KB, - 13th Gen', 2, 'Laptops'],
            ['83HS006KPS', 'Lenovo IP S500 Series, i5 13420H, 16GB, 512GB SSD M.2, INTEGRATED GRAPHICS, 16" FHD, ARCTIC GREY, Backlit ENG US KB, - 13th Gen', 100, 'Laptops'],
            ['83EM003TPS', 'Lenovo IP S300 Slim Series, i7 13620H, 16GB, 512GB SSD M.2, INTEGRATED GRAPHICS, 15.6" FHD - 13th Gen', 14, 'Laptops'],
            ['83EM0045PS', 'Lenovo IP S300 Slim Series, i7 13620H, 16GB, 512GB SSD M.2, INTEGRATED GRAPHICS, 15.6" FHD - 13th Gen', 100, 'Laptops'],
            ['83EM007MPS', 'Lenovo IP S300 Slim Series, i7 13620H, 16GB, 512GB SSD M.2, INTEGRATED GRAPHICS, 15.6" FHD - 13th Gen, FPR, BL Keyboard', 100, 'Laptops'],
            ['83HS006JPS', 'Lenovo IP S500 Slim Series, i7 13620H, 16GB, 512GB SSD M.2, INTEGRATED GRAPHICS, 16" FHD - 13th Gen, FPR, BL Keyboard', 25, 'Laptops'],
            ['82XM00ARPS', 'Lenovo IP S300 Series, R7 7730U, 8GB, 512GB SSD M.2, INTEGRATED GRAPHICS, 15.6" FHD', 42, 'Laptops'],
            ['83DA009EPS', 'Lenovo IP Slim 5 Series, U5-125H 16GB DDR5, 512GB SSD, 14" WUXGA FHD, BKLT ENG KB, Aluminium, Cloud Grey', 100, 'Laptops'],
            ['83DA009FPS', 'Lenovo IP Slim 5 Series, U7-155H 16GB DDR5, 512GB SSD, 14" WUXGA FHD, BKLT ENG KB, Aluminium, Cloud Grey', 3, 'Laptops'],
            ['82Y0008GAX', 'Lenovo IP Flex 5 14IRU8, i5-1335U, 8GB, 512GB SSD, 14" WUXGA (1920x1200) IPS 300nits, 10-point Multi-touch, Lenovo Digital Pen, W11H, BL ENG KB, Arctic Grey', 7, 'Laptops'],
            ['83LK006JPS', 'Lenovo LOQ, i5-12450HX, 16GB DDR5, 512GB SSD, RTX3050 6GB DDR6, 15.6" 144Hz IPS FHD 300nits, ENG KB, Luna Grey', 100, 'Laptops'],
            ['83GS00KFPS', 'Lenovo LOQ, i5-12600HX, 12GB DDR5, 512GB SSD, RTX3050 6GB DDR6, 15.6" 144Hz IPS FHD 300nits, ENG KB, Luna Grey', 100, 'Laptops'],
            ['83DV00UQPS', 'Lenovo LOQ3 15 i5-13450HX, 24GB DDR5, 512GB SSD, RTX3050 6GB DDR6, 15.6" WUXGA IPS FHD 300nits, Backlit ENG KB, Luna Grey', 200, 'Laptops'],
            ['83JE009FPS', 'Lenovo LOQ3 15 i5-13450HX, 24GB DDR5, 512GB SSD, RTX4050 6GB DDR6, 15.6" WUXGA IPS FHD 300nits, Backlit ENG KB, Luna Grey', 13, 'Laptops'],
            ['83LK003TPS', 'Lenovo LOQ, i7-12650HX, 16GB DDR5, 512GB SSD, RTX4050 6GB DDR6, 15.6" WUXGA IPS FHD 300nits, Backlit ENG KB, Luna Grey', 49, 'Laptops'],
            ['83DV0072PS', 'Lenovo LOQ3 15 i7-13650HX, 16GB DDR5, 512GB SSD, RTX3050 6GB DDR6, 15.6" WUXGA IPS FHD 350nits, Backlit ENG KB, Luna Grey', 190, 'Laptops'],
            ['83DV00ULPS', 'Lenovo LOQ3 15 i7-13650HX, 24GB DDR5, 512GB SSD, RTX4050 6GB DDR6, 15.6" WUXGA IPS FHD 350nits, Backlit ENG KB, Luna Grey', 35, 'Laptops'],
            ['83JE0102PS', 'Lenovo LOQ3 15 i7-13650HX, 16GB DDR5, 512GB SSD, RTX4050 6GB DDR6, 15.6" WUXGA IPS FHD 300nits, Backlit ENG KB, Luna Grey', 42, 'Laptops'],
            ['83JE00YPPS', 'Lenovo LOQ3 15 i7-13700HX, 16GB DDR5, 512GB SSD, RTX4050 6GB DDR6, 15.6" WUXGA IPS FHD 300nits, Backlit ENG KB, Luna Grey', 100, 'Laptops'],
            ['83JE00L2PS', 'Lenovo LOQ3 15 i7-13700HX, 24GB DDR5, 512GB SSD, RTX4050 6GB DDR6, 15.6" WUXGA IPS FHD 300nits, Backlit ENG KB, Luna Grey', 18, 'Laptops'],
            ['83DV00URPS', 'Lenovo LOQ3 15 i7-14700HX, 16GB DDR5, 512GB SSD, RTX4060 8GB DDR6, 15.6" WUXGA IPS FHD 350nits, Backlit ENG KB, Luna Grey', 17, 'Laptops'],
            ['82RC00BSAK', 'Lenovo Legion Y500 15IAH7, i7-12700H, NVIDIA GeForce RTX 3050 Ti 4GB, 2x 8GB, 1TB SSD M.2, 15.6" WQHD, Storm Grey', 100, 'Laptops'],
            ['82RB00NAAK', 'Lenovo Legion Y500 15IAH7H, i7-12700H, NVIDIA GeForce RTX 3060 6GB, 2x 8GB, 1TB SSD M.2, 15.6" WQHD, Storm Grey', 100, 'Laptops'],
            ['83DG00M2PS', 'Lenovo Legion Pro 5, i7-13650HX, 16GB DDR5, 1TB SSD, RTX 4060 8GB DDR6, 16" WQXGA (2560x1600) IPS 500nits, 4-Zone RGB Backlit EG, Onyx Grey', 13, 'Laptops'],
            ['83LY00D1PS', 'Lenovo Legion Pro 5, i7-13650HX, 24GB DDR5, 1TB SSD, RTX 4060 8GB DDR6, 15.3" WUXGA IPS FHD 300nits, 4-Zone RGB Backlit EG, Eclipse Black', 100, 'Laptops'],
            ['83LY0077PS', 'Lenovo Legion 5, i9-14900HX, 32GB DDR5, 1TB SSD, RTX 4070 8GB DDR7, 15.1" WQXGA (2560x1600) IOLED 500nits, 24-Zone RGB Backlit EG, Eclipse Black', 100, 'Laptops'],
            ['83F3003QPS', 'Lenovo Legion Pro 5, U7-155HX, 32GB DDR5, 1TB SSD, RTX 4060 8GB DDR7, 16" WQXGA (2560x1600) IPS 500nits, 24-Zone RGB Backlit ENG KB, Eclipse Black', 57, 'Laptops'],
            ['83F00037PS', 'Lenovo Legion 5, U9-185HX, 32GB DDR5, 1TB SSD, RTX 4070 8GB DDR7, 16" WQXGA (2560x1600) IPS 500nits, 24-Zone RGB Backlit ENG KB, Eclipse Black', 29, 'Laptops'],
            ['83F3003RPS', 'Lenovo Legion Pro 5, U9-185HX, 32GB DDR5, 1TB SSD, RTX 4070 8GB DDR7, 16" WQXGA (2560x1600) IPS 500nits, 24-Zone RGB Backlit ENG KB, Eclipse Black', 52, 'Laptops'],
            ['83KY002WPS', 'Lenovo Legion 7, U9-185HX, 32GB DDR5, 2TB SSD, RTX 4070 8GB DDR7, 16" WQXGA (2560x1600) OLED 500nits 240Hz TrueBlack1000, Per-key RGB Backlit, Glacier White', 9, 'Laptops'],
            ['83F500AJPS', 'Lenovo Legion Pro 7, U9-185HX, 32GB DDR5, 2TB SSD, RTX 4070 Ti 12GB DDR7, 16" WQXGA (2560x1600) IPS 500nits 240Hz TrueBlack1000, Per-key RGB Backlit, Eclipse Black', 10, 'Laptops'],
            ['83F50050PS', 'Lenovo Legion Pro 7, U9-185HX, 64GB DDR5, 2TB SSD, RTX 4080 16GB DDR7, 16" WQXGA (2560x1600) IPS 500nits 240Hz TrueBlack1000, Per-key RGB Backlit, Eclipse Black', 5, 'Laptops'],
            ['83F500AHPS', 'Lenovo Legion Pro 7, U9-185HX, 64GB DDR5, 2TB SSD, RTX 4090 24GB DDR7, 16" WQXGA (2560x1600) IPS 500nits 240Hz TrueBlack1000, Per-key RGB Backlit, Eclipse Black', 7, 'Laptops'],
            ['83EY0004PS', 'Lenovo Legion Pro 9, U9 13980HX, 64GB DDR5, 2TB SSD, RTX 4090 24GB DDR7, 16" WUXGA (3840x2400) IPS 500nits 240Hz, Per-key RGB Backlit, Eclipse Black', 5, 'Laptops'],
            ['83JX009EAX', 'Lenovo Yoga 7 Slim, U7 256V, 16GB DDR5, 1TB SSD, 14" WUXGA, BKLT KB, Win11 H, Luna Grey', 6, 'Laptops'],
            ['83KF0024AX', 'Lenovo Yoga 7 Pro, U9 285H, 32GB DDR5, 1TB SSD, 14.5" 3K OLED TOUCH, BKLT KB, Win11 H, Luna Grey', 9, 'Laptops'],
            ['83CX000MAX', 'Lenovo Yoga Slim 9i AI U7-258V, 32GB DDR5, 1TB SSD, Intel ARC Graphic, 14" WUXGA (3840x2400) 4K OLED 600nits Touch Screen, BKLT KB, Win11 H, Tidal Teal', 8, 'Laptops'],
            ['83L00030AX', 'Lenovo Yoga Pro 9i AI U9-285H, 64GB DDR5, 2TB SSD, RTX4070 8GB DDR7, 16" 3.2K (3200x2000) OLED 1000nits 120Hz, BKLT KB, Win11 H, Luna Grey', 7, 'Laptops'],

            // --- AIO (IMAGE 3) ---
            ['10RX0036UM', 'Lenovo AIO V130 Celeron J4025, 4GB DDR4, 1TB HDD, 19.5" Non Touch, DVDRW, HDMI, WiFi, BT, RJ45, KB, Mouse Black', 100, 'AIO'],
            ['12B3004CGP', 'Lenovo Neo 30a-22 AIO, Pentium Quad Core 8505, 4GB, 256GB SSD, 21.5" Non Touch, DVDRW, HDMI, WiFi, BT, RJ45, KB, Mouse, Black', 100, 'AIO'],
            ['13BE0016GP', 'Lenovo AIO V100 N100 3.4Ghz FHD IPS, 1x8GB DDR4, 256GB SSD, 23.8" Non Touch, HDMI, WiFi, BT, RJ45, KB, Mouse Black', 234, 'AIO'],
            ['13BE000WGP', 'Lenovo AIO V100 N100 3.4Ghz FHD IPS, 1x8GB DDR4, 512GB SSD, 23.8" Non Touch, HDMI, WiFi, BT, RJ45, KB, Mouse Black', 100, 'AIO'],
            ['13BE003FGP', 'Lenovo AIO V100 N305 FHD IPS, 1x8GB DDR4, 512GB SSD, 23.8" Non Touch, HDMI, WiFi, BT, RJ45, KB, Mouse Black', 138, 'AIO'],
            ['11FJ000VUM', 'Lenovo Neo 50a-24 AIO, i3-10100T, 4GB, 1TB HDD, 23.8" Non Touch, DVDRW, HDMI, WiFi, BT, RJ45, KB, Mouse, Black', 100, 'AIO'],
            ['12B30028GP', 'Lenovo Neo 30a-22 AIO, i3-1215U, 4GB, 256GB SSD, 21.5" Non Touch, DVDRW, HDMI, WiFi, BT, RJ45, KB, Mouse, Black 12th Gen', 100, 'AIO'],
            ['11LC003KUM', 'Lenovo Neo 30a-22 AIO, i5-1035G1, 4GB, 1TB HDD, 21.5" Non Touch, DVDRW, HDMI, WiFi, BT, RJ45, KB, Mouse, Black', 100, 'AIO'],
            ['12B3006NGP', 'Lenovo Neo 30a-22 AIO, i5-12450H, 4GB, 256GB SSD, 21.5" Non Touch, DVDRW, HDMI, WiFi, BT, RJ45, KB, Mouse, Black 12th Gen', 100, 'AIO'],
            ['12CA004FGP', 'Lenovo Neo 30a-27 AIO, i5-12450H, 8GB, 512GB SSD, 27" Non Touch, DVDRW, HDMI, WiFi, BT, RJ45, KB, Mouse, Black 12th Gen', 100, 'AIO'],
            ['12CA004QGP', 'Lenovo Neo 30a-27 AIO, i5-12450H, 8GB, 512GB SSD, 27" Non Touch, DVDRW, HDMI, WiFi, BT, RJ45, KB, Mouse, Black 12th Gen', 100, 'AIO'],
            ['12B80054GP', 'Lenovo Neo 50a-24 AIO, i5-12500H, 8GB, 512GB SSD, 23.8" 10Point Touch, DVDRW, HDMI, WiFi, BT, RJ45, KB, Mouse, Black 12th Gen', 14, 'AIO'],
            ['12B00034GP', 'Lenovo Neo 30a-24 AIO, i7-1260P, 8GB, 1TB HDD, 23.8" Non Touch, DVDRW, HDMI, WiFi, BT, RJ45, KB, Mouse, Black 12th Gen', 100, 'AIO'],
            ['12CB001YGP', 'Lenovo Neo 30a-27 AIO, i7-1260P, 16GB, 512GB SSD, 27" Non Touch, DVDRW, HDMI, WiFi, BT, RJ45, KB, Mouse, Black 12th Gen', 65, 'AIO'],
            ['12JU001JGP', 'Lenovo Neo 30a-27 AIO, i7-13620H, 8GB, 512GB SSD, 27" Non Touch, DVDRW, HDMI, WiFi, BT, RJ45, KB, Mouse, Black 13th Gen', 142, 'AIO'],
            ['12SC000WGP', 'Lenovo Neo 50a-24 AIO, i7-13620H, 8GB DDR5, 512GB SSD, 23.8" Non Touch, HDMI, WiFi, BT, RJ45, KB, Mouse, Luna Grey 13th Gen', 100, 'AIO'],
            ['12SC002KGP', 'Lenovo Neo 50a-24 AIO, i7-13620H, 8GB DDR5, 512GB SSD, 23.8" Multi Touch, HDMI, WiFi, BT, RJ45, KB, Mouse, Luna Grey 13th Gen', 27, 'AIO'],
            ['12SC007YGP', 'Lenovo Neo 50a-24 G5, C5-210H, 8GB DDR5, 512GB SSD, 23.8" FHD IPS, Wireless KB & Mouse, WiFi, Lan, HDMI, Luna grey', 120, 'AIO'],
            ['12SC007BGP', 'Lenovo Neo 50a-24 G5, C5-210H, 8GB DDR5, 512GB SSD, 23.8" FHD IPS Multi Touch, Wireless KB & Mouse, WiFi, Lan, HDMI, Luna grey', 60, 'AIO'],
            ['12SC0076GP', 'Lenovo Neo 50a-24 G5, C7-240H, 8GB DDR5, 512GB SSD, 23.8" FHD IPS Multi Touch, Wireless KB & Mouse, WiFi, Lan, HDMI, Luna grey', 60, 'AIO'],
            ['F0J60042PS', 'Lenovo IdeaCentre N100 3.4Ghz FHD IPS, 1x8GB DDR4, 512GB SSD, 23.8" Non Touch, HDMI, WiFi, BT, KB, Cloud Grey', 100, 'AIO'],
            ['F0J60043PS', 'Lenovo IdeaCentre N305 1.8Ghz FHD IPS, 1x8GB DDR4, 512GB SSD, 23.8" Non Touch, HDMI, WiFi, BT, KB, Cloud Grey', 200, 'AIO'],
            ['F0HN000UAX', 'Lenovo IdeaCentre 24-AIO 3, i5-13420H, 8GB DDR5, 512SSD, 23.8" FHD (1920x1080) IPS, Wireless KB Arabic+ Mouse Camera, BT, WiFi, Cloud Grey', 12, 'AIO'],
            ['F0HN000SAX', 'Lenovo IdeaCentre 24-AIO 3, i5-13420H, 8GB DDR5, 512SSD, 23.8" FHD (1920x1080) IPS 10point Touch Screen, Wireless KB Arabic+ Mouse Camera, BT, WiFi, Cloud Grey', 5, 'AIO'],
            ['F0HN000RAX', 'Lenovo IdeaCentre 24-AIO 3, i5-13420H, 8GB DDR5, 512SSD, 23.8" FHD (1920x1080) IPS 10point Touch Screen, Wireless KB Arabic+ Mouse Camera, BT, WiFi, Luna Grey', 100, 'AIO'],
            ['F0HN000QAX', 'Lenovo IdeaCentre 24-AIO 3, i7-13620H, 8GB DDR5, 512SSD, 23.8" FHD (1920x1080) IPS, Wireless KB Arabic+ Mouse Camera, BT, WiFi, Cloud Grey', 46, 'AIO'],
            ['F0GH00V9AK', 'Lenovo IdeaCentre AIO 3 24IAP7 i7-13620H, 8GB DDR4, 512SSD, 23.8" FHD Touch Screen, DVDRW, Camera, BT, WL, White', 100, 'AIO'],
            ['F0GH010KAK', 'Lenovo IdeaCentre AIO 3 24IAP7 i7-13620H, 8GB DDR4, 512SSD, NVidia MX550 4GB Dedicated, 23.8" FHD Touch Screen, DVDRW, Camera, BT, WL, White', 100, 'AIO'],
            ['F0HN00RDAK', 'Lenovo IdeaCentre AIO 24IRH9, C5 210H, 8GB DDR5, 512GB SSD, 23.8" FHD Touch WiFi, BT, LAN, WL KB+Mouse Cloud Grey', 58, 'AIO'],
            ['F0HM00QQAK', 'Lenovo IdeaCentre AIO 27IRH9, C5 210H, 16GB DDR5, 512GB SSD, 27" FHD WiFi, BT, LAN, WL KB+Mouse Cloud Grey', 46, 'AIO'],
            ['F0HN00R9AK', 'Lenovo IdeaCentre AIO 24IRH9, C7 240H, 8GB DDR5, 512GB SSD, 23.8" FHD Touch WiFi, BT, LAN, WL KB+Mouse Cloud Grey', 111, 'AIO'],
            ['F0HN00REAK', 'Lenovo IdeaCentre AIO 24IRH9, C7 240H, 8GB DDR5, 512GB SSD, 27" FHD Touch, WiFi, BT, LAN, WL KB+Mouse Cloud Grey', 42, 'AIO'],

            // --- DESKTOPS & MONITORS (IMAGE 4) ---
            ['11SE000LGP', 'Lenovo Neo 50t G3, i5-12400, 4GB, 1TB, Integrated, No OS, 1Yr Carry-in', 100, 'Desktops'],
            ['11SE0010GP', 'Lenovo Neo 50t G3, i7-12700, 8GB, 1TB, Integrated, No OS, 1Yr Carry-in', 100, 'Desktops'],
            ['11TA001RGP', 'Lenovo M70t G3, i3-12100, 4GB, 1TB, Integrated, No OS, 1Yr Carry-in', 100, 'Desktops'],
            ['11TA001FGP', 'Lenovo M70t G3, i5-12400, 4GB, 1TB, Integrated, No OS, 1Yr Carry-in', 100, 'Desktops'],
            ['12UD00C2GP', 'Lenovo Neo 50t G5, i3-14100, 8GB, 512SSD, Integrated, No OS, 1Yr Carry-in - 14th Gen', 150, 'Desktops'],
            ['12UD008SGP', 'Lenovo Neo 50t G5, i5-14400, 8GB, 512SSD, Integrated, No OS, 1Yr Carry-in - 14th Gen', 100, 'Desktops'],
            ['90XW0045AK', 'Lenovo IdeaCentre Tower, i5-13420H, 8GB DDR5, 512SSD, KB + Mouse, BT, WiFi, Lan, Cloud Grey', 81, 'Desktops'],
            ['90X2001GAX', 'Lenovo IdeaCentre Tower, i5-14400, 8GB DDR5, 512SSD, Intel B760 Chipset, Arabic KB + Mouse, BT, WiFi, DOS, Cloud Grey', 61, 'Desktops'],
            ['90X2001FAX', 'Lenovo IdeaCentre Tower, i7-14700, 16GB DDR5, 512SSD, Intel B760 Chipset, Arabic KB + Mouse, BT, WiFi, DOS, Cloud Grey', 100, 'Desktops'],
            ['62F7KAT4UK', 'Lenovo E20-30 19.5" Monitor 1440x900 HDMI', 100, 'Monitors'],
            ['63A4MAT1UK', 'Lenovo T27i-30 27" Monitor, IPS panel, NBL, 1920x1080, Input connectors- VGA + HDMI 1.4 + DP 1.2, Cables included- VGA + DP', 55, 'Monitors'],
            ['67D5KAC6AE', 'Lenovo L22-4e, 21.5" FHD | IPS | LED Monitor', 316, 'Monitors'],
            ['67BCKAC6AE', 'Lenovo L24i-4A, 23.8" FHD | IPS | LED Monitor', 100, 'Monitors'],
            ['68CBGAC2AE', 'Lenovo Legion R24f-25 23.8" FHD Pro Gaming Monitors (IPS Panel, 144Hz, 4ms GTG, HDMI 2.1, DP 1.4, FreeSync) - Tilt', 198, 'Monitors'],
            ['66CFGAC1AE', 'Lenovo G24-20 23.8-inch, FHD | IPS | 0.5ms MPRT | 144Hz | HDMI + DP | FreeSync + G-Sync | Eye Comfort | Tilt', 58, 'Monitors'],
            ['67B7GACBAE', 'Lenovo Legion R25i-30 24.5 Inch, FHD Gaming Monitor with Eyesafe (IPS Panel, 165Hz (180Hz OD), 0.5 MPRT, HDMI, DP, FreeSync Premium, HDR400, Integrated Speakers) - Tilt/Lift/Pivot/Swivel Stand', 30, 'Monitors'],
            ['66F0GACBAE', 'Lenovo Legion Y25-30 24.5 inch FHD eSports Gaming Monitor (Fast IPS Panel, 240Hz, 0.5 MPRT, HDMI, DP, FreeSync Premium, HDR400) - Tilt/Swivel/Lift/Pivot Stand', 29, 'Monitors'],
            ['67CBKAC1AE', 'Lenovo L27i-4B, 27" FHD | IPS | 4ms | 100Hz | VGA + HDMI + Audio out | FreeSync | 3 Side Borderless | Sculptured Stand | NLBL + Eyesafe, Phone holder, Cloud Grey', 100, 'Monitors'],
            ['66F3GAC2AE', 'Lenovo G27c-30, FHD | VA | 1ms MPRT | 165Hz | 99% sRGB & 90% DCI-P3 | 2XHDMI 2.0 + DP 1.4 | FreeSync | LT | CURVED | AMD FreeSync | NBL', 17, 'Monitors'],
            ['67B5GAC1AE', 'Lenovo Legion R27i-30 27 Inch, FHD Gaming Monitor with Eyesafe (IPS Panel, 180Hz (OD), 0.5 MPRT, HDMI, DP, FreeSync Premium, HDR400, Integrated Speakers) - Tilt/Lift/Pivot/Swivel Stand', 33, 'Monitors'],
            ['66F8GAC3AE', 'Lenovo Legion Y27-30 27 Inch FHD Gaming Monitor (IPS Panel, 165Hz "OD 180Hz", 0.5 MPRT, 2xHDMI 2.0, DP 1.4, FreeSync (G-Sync Compatibility) 99% sRGB + 85% DCI-P3 - Tilt/Swivel/Lift/Pivot Stand', 28, 'Monitors'],
            ['66DEKAC2AE', 'Lenovo L27m-30, FHD | IPS | 4ms | 75Hz | VGA + HDMI + USB-C | Eyesafe with Natural Low Blue Light | FreeSync | Speakers | 3 Side Borderless | Webcam', 8, 'Monitors'],
            ['67B1GAC3AE', 'Lenovo Legion R45w-30 44.5 inch DQHD Pro Gaming Monitor (VA Panel, 165Hz, 1ms MPRT, USB-C, RJ45 2.5G with Realtek smart chip, HDMI 2.1, DP 1.4, FreeSync Premium Pro, HDR400, Speakers) - Tilt/Swivel/Lift', 8, 'Monitors'],
        ];

        foreach ($products as [$modelCode, $fullName, $qty, $catKey]) {
            // 4. Create Master Product
            $productName = Str::limit($fullName, 191, '');
            $masterProduct = Product::updateOrCreate(
                ['model_code' => $modelCode],
                [
                    'name' => $productName,
                    'brand_id' => $brand->id,
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
                    // Price is not in the image, set a placeholder or null
                    'price' => null,
                ]
            );
        }
    }
}
