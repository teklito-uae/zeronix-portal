<?php

namespace App\Http\Controllers;

use App\Models\SupplierProduct;
use App\Models\SupplierPriceHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BulkImportController extends Controller
{
    public function sync(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'products' => 'required|array',
            'products.*.name' => 'required|string',
            'products.*.model_code' => 'nullable|string',
            'products.*.identifier_hash' => 'required|string',
            'products.*.price' => 'nullable|numeric',
            'products.*.currency' => 'string',
            'products.*.category_id' => 'nullable|exists:categories,id',
            'products.*.raw_text' => 'required|string',
            'products.*.specs' => 'nullable|array',
        ]);

        $supplierId = $validated['supplier_id'];
        $results = [
            'created' => 0,
            'updated' => 0,
            'skipped' => 0
        ];

        DB::transaction(function () use ($supplierId, $validated, &$results) {
            foreach ($validated['products'] as $item) {
                // 1. Master Product Logic: Find or create a global product entry
                $product = null;
                if (!empty($item['model_code'])) {
                    $product = \App\Models\Product::where('model_code', $item['model_code'])->first();
                }
                
                if (!$product) {
                    $product = \App\Models\Product::where('name', $item['name'])->first();
                }

                if (!$product) {
                    $product = \App\Models\Product::create([
                        'name' => $item['name'],
                        'model_code' => $item['model_code'],
                        'brand_id' => $item['brand_id'] ?? $this->detectBrand($item['name']),
                        'category_id' => $item['category_id'] ?? null,
                        'specs' => $item['specs'],
                        'slug' => Str::slug($item['name']) . '-' . Str::random(5),
                    ]);
                }

                // 2. Supplier Product Logic: Find existing entry for this supplier
                $existing = null;
                if (!empty($item['model_code'])) {
                    $existing = SupplierProduct::where('supplier_id', $supplierId)
                        ->where('model_code', $item['model_code'])
                        ->first();
                }

                if (!$existing) {
                    $existing = SupplierProduct::where('supplier_id', $supplierId)
                        ->where('identifier_hash', $item['identifier_hash'])
                        ->first();
                }

                if ($existing) {
                    $oldPrice = $existing->price;
                    
                    $existing->update([
                        'product_id' => $product->id,
                        'category_id' => $item['category_id'] ?? $existing->category_id,
                        'name' => $item['name'],
                        'price' => $item['price'],
                        'raw_text' => $item['raw_text'],
                        'specs' => $item['specs'],
                        'is_active' => true,
                        'availability' => true,
                        'last_pasted_at' => now(),
                    ]);

                    if ($oldPrice != $item['price']) {
                        $this->logPriceHistory($existing);
                    }

                    $results['updated']++;
                } else {
                    $newProduct = SupplierProduct::create([
                        'supplier_id' => $supplierId,
                        'product_id' => $product->id,
                        'category_id' => $item['category_id'] ?? null,
                        'name' => $item['name'],
                        'model_code' => $item['model_code'],
                        'identifier_hash' => $item['identifier_hash'],
                        'price' => $item['price'],
                        'currency' => $item['currency'] ?? 'AED',
                        'raw_text' => $item['raw_text'],
                        'specs' => $item['specs'],
                        'is_active' => true,
                        'availability' => true,
                        'last_pasted_at' => now(),
                    ]);

                    if ($newProduct->price) {
                        $this->logPriceHistory($newProduct);
                    }

                    $results['created']++;
                }
            }
        });

        return response()->json([
            'message' => 'Sync completed successfully',
            'results' => $results
        ]);
    }

    private function detectBrand($name)
    {
        if (empty($name)) return null;

        $brandMap = [
            'HP' => ['HP', 'Hewlett Packard'],
            'HPE' => ['HPE', 'HP Enterprise'],
            'Dell' => ['Dell'],
            'Asus' => ['Asus'],
            'Lenovo' => ['Lenovo'],
            'Cisco' => ['Cisco'],
            'Synology' => ['Synology'],
            'Mikrotik' => ['Mikrotik'],
            'TP-Link' => ['TP-Link', 'TP Link', 'TPLink'],
            'Aruba' => ['Aruba'],
            'Ubiquiti' => ['Ubiquiti', 'UBNT', 'UniFi'],
            'Microsoft' => ['Microsoft', 'MS', 'Surface'],
            'Apple' => ['Apple', 'MacBook', 'iPhone', 'iPad'],
            'Samsung' => ['Samsung'],
            'Intel' => ['Intel', 'Xeon'],
            'AMD' => ['AMD', 'Ryzen', 'EPYC'],
            'NVIDIA' => ['NVIDIA', 'GeForce', 'Quadro', 'Tesla', 'Mellanox'],
            'Western Digital' => ['Western Digital', 'WD', 'HGST', 'G-Technology'],
            'Seagate' => ['Seagate', 'LaCie'],
            'Kingston' => ['Kingston', 'HyperX'],
            'SanDisk' => ['SanDisk'],
            'Crucial' => ['Crucial', 'Micron'],
            'Corsair' => ['Corsair'],
            'Logitech' => ['Logitech', 'Logi'],
            'Razer' => ['Razer'],
            'Acer' => ['Acer', 'Predator'],
            'MSI' => ['MSI'],
            'Sony' => ['Sony', 'PlayStation'],
            'Toshiba' => ['Toshiba'],
            'Fujitsu' => ['Fujitsu'],
            'Brother' => ['Brother'],
            'Canon' => ['Canon'],
            'Epson' => ['Epson'],
            'Xerox' => ['Xerox'],
            'APC' => ['APC', 'Schneider'],
            'Eaton' => ['Eaton'],
            'Netgear' => ['Netgear', 'NightHawk'],
            'D-Link' => ['D-Link', 'DLink'],
            'Linksys' => ['Linksys'],
            'Juniper' => ['Juniper'],
            'Sophos' => ['Sophos'],
            'Fortinet' => ['Fortinet', 'FortiGate', 'FortiSwitch'],
            'Palo Alto' => ['Palo Alto', 'PAN-OS'],
            'Check Point' => ['Check Point'],
            'Zyxel' => ['Zyxel'],
            'QNAP' => ['QNAP'],
            'Buffalo' => ['Buffalo'],
            'Transcend' => ['Transcend'],
            'Lexar' => ['Lexar'],
            'PNY' => ['PNY'],
            'BenQ' => ['BenQ'],
            'ViewSonic' => ['ViewSonic'],
            'Philips' => ['Philips'],
            'LG' => ['LG'],
            'Panasonic' => ['Panasonic', 'Toughbook'],
            'Sharp' => ['Sharp'],
            'NEC' => ['NEC'],
            'Kyocera' => ['Kyocera'],
            'Ricoh' => ['Ricoh'],
            'Zebra' => ['Zebra', 'Motorola'],
            'Honeywell' => ['Honeywell'],
            'Poly' => ['Poly', 'Polycom'],
            'Jabra' => ['Jabra'],
            'Sennheiser' => ['Sennheiser'],
            'Hikvision' => ['Hikvision'],
            'Dahua' => ['Dahua'],
            'Grandstream' => ['Grandstream'],
            'Yealink' => ['Yealink'],
            'HUAWEI' => ['HUAWEI', 'Huawei'],
            'Supermicro' => ['Supermicro'],
            'NetApp' => ['NetApp'],
            'Pure Storage' => ['Pure Storage', 'PureStorage'],
            'Nutanix' => ['Nutanix'],
            'VMware' => ['VMware', 'ESXi'],
            'Veeam' => ['Veeam'],
            'Veritas' => ['Veritas', 'BackupExec'],
            'Commvault' => ['Commvault'],
            'Allied Telesis' => ['Allied Telesis', 'AlliedTelesis'],
            'Ruckus' => ['Ruckus', 'CommScope'],
            'Cambium' => ['Cambium'],
            'Peplink' => ['Peplink'],
            'Riverbed' => ['Riverbed'],
            'F5' => ['F5', 'Big-IP'],
            'Citrix' => ['Citrix'],
            'CrowdStrike' => ['CrowdStrike'],
            'SentinelOne' => ['SentinelOne'],
            'Symantec' => ['Symantec'],
            'McAfee' => ['McAfee', 'Trellix'],
            'Kaspersky' => ['Kaspersky'],
        ];

        foreach ($brandMap as $brandName => $aliases) {
            foreach ($aliases as $alias) {
                // Case insensitive match with word boundaries or start/end of string
                $pattern = "/(^|[^a-z0-9])" . preg_quote($alias, '/') . "([^a-z0-9]|$)/i";
                if (preg_match($pattern, $name)) {
                    $brand = \App\Models\Brand::firstOrCreate(
                        ['name' => $brandName],
                        ['slug' => Str::slug($brandName)]
                    );
                    return $brand->id;
                }
            }
        }

        return null;
    }
    private function logPriceHistory($product)
    {
        SupplierPriceHistory::create([
            'supplier_product_id' => $product->id,
            'price' => $product->price,
            'currency' => $product->currency,
        ]);
    }
}
