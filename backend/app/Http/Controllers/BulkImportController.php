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

    private function logPriceHistory($product)
    {
        SupplierPriceHistory::create([
            'supplier_product_id' => $product->id,
            'price' => $product->price,
            'currency' => $product->currency,
        ]);
    }
}
