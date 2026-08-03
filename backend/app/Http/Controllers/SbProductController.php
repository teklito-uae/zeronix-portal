<?php

namespace App\Http\Controllers;

use App\Models\SbProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class SbProductController extends Controller
{
    public function index(Request $request)
    {
        $query = SbProduct::with('vendor', 'category', 'broadcast')->latest();

        $this->applyFilters($query, $request);

        $products = $query->paginate($request->get('per_page', 15));

        return response()->json($products);
    }

    public function search(Request $request)
    {
        $query = SbProduct::with('vendor', 'category', 'broadcast')->latest();

        $this->applyFilters($query, $request);

        if ($request->filled('q') && Schema::getConnection()->getDriverName() === 'mysql') {
            $query->whereFullText(['product_name', 'specs_text', 'raw_line'], $request->q);
        }

        $products = $query->paginate($request->get('per_page', 15));

        return response()->json($products);
    }

    private function applyFilters($query, Request $request): void
    {
        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', $request->vendor_id);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }
    }

    public function update(Request $request, SbProduct $product)
    {
        $validated = $request->validate([
            'product_name' => 'nullable|string|max:255',
            'specs_text' => 'nullable|string|max:500',
            'spec_ram' => 'nullable|string|max:20',
            'spec_storage' => 'nullable|string|max:20',
            'spec_cpu' => 'nullable|string|max:60',
            'price' => 'nullable|numeric',
            'currency' => 'nullable|string|max:6',
            'quantity_note' => 'nullable|string|max:100',
            'vendor_id' => 'nullable|exists:sb_vendors,id',
            'category_id' => 'nullable|exists:sb_categories,id',
            'is_reviewed' => 'nullable|boolean',
        ]);

        $product->update($validated);

        return response()->json($product->fresh()->load('vendor', 'category'));
    }

    public function destroy(SbProduct $product)
    {
        $product->delete();

        return response()->json(['message' => 'Product deleted']);
    }
}
