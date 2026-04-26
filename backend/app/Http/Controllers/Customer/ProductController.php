<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = \App\Models\Product::with(['category', 'brand']);

        if ($request->filled('search')) {
            $s = trim($request->search);
            // Elastic-like multi-word search
            $words = array_filter(explode(' ', $s));
            
            $query->where(function($q) use ($words) {
                foreach ($words as $word) {
                    $q->where(function($sub) use ($word) {
                        $sub->where('name', 'like', "%{$word}%")
                           ->orWhere('model_code', 'like', "%{$word}%")
                           ->orWhereHas('brand', function($b) use ($word) {
                               $b->where('name', 'like', "%{$word}%");
                           });
                    });
                }
            });
        }

        if ($request->filled('category')) {
            $query->where('category_id', $request->category);
        }

        $products = $query->latest()->paginate($request->get('per_page', 20));

        // Transform to hide sensitive data
        $products->getCollection()->transform(function($product) {
            $data = $product->toArray();
            unset($data['price']); // Hide purchase price
            unset($data['supplier_id']);
            unset($data['supplier']);
            return $data;
        });

        return response()->json($products);
    }

    public function show($id)
    {
        $product = \App\Models\Product::with(['category', 'brand'])->findOrFail($id);
        
        $data = $product->toArray();
        unset($data['price']); // Hide purchase price
        unset($data['supplier_id']);
        unset($data['supplier']);

        return response()->json($data);
    }
}
