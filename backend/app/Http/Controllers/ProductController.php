<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['brand', 'category', 'supplierProducts.supplier'])
            ->withCount('supplierProducts');

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('model_code', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->get('category_id'));
        }

        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->get('brand_id'));
        }

        $products = $query->latest()
            ->paginate($request->get('per_page', config('zeronix.default_per_page', 10)));

        return response()->json([
            'data' => $products->items(),
            'total' => $products->total(),
            'current_page' => $products->currentPage(),
            'last_page' => $products->lastPage(),
            'per_page' => $products->perPage(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'model_code' => 'nullable|string',
            'brand_id' => 'nullable|exists:brands,id',
            'category_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
            'specs' => 'nullable|array',
        ]);

        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);

        $product = Product::create($validated);
        return response()->json($product->load(['brand', 'category']));
    }

    public function show(Product $product)
    {
        return response()->json([
            'product' => $product->load(['brand', 'category']),
            'suppliers' => $product->supplierProducts()
                ->with('supplier')
                ->latest()
                ->get()
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'model_code' => 'nullable|string',
            'brand_id' => 'nullable|exists:brands,id',
            'category_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
            'specs' => 'nullable|array',
        ]);

        $product->update($validated);
        return response()->json($product->load(['brand', 'category']));
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(['message' => 'Product deleted']);
    }

    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:products,id',
            'brand_id' => 'nullable|exists:brands,id',
            'category_id' => 'nullable|exists:categories,id',
        ]);

        $updateData = array_filter([
            'brand_id' => $validated['brand_id'] ?? null,
            'category_id' => $validated['category_id'] ?? null,
        ], fn($val) => !is_null($val));

        if (empty($updateData)) {
            return response()->json(['message' => 'No update data provided'], 400);
        }

        Product::whereIn('id', $validated['ids'])->update($updateData);

        return response()->json(['message' => 'Products updated successfully']);
    }
}
