<?php

namespace App\Http\Controllers;

use App\Models\SupplierProduct;
use App\Models\SupplierPriceHistory;
use Illuminate\Http\Request;

class SupplierProductController extends Controller
{
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'price' => 'required|numeric',
        ]);

        $item = SupplierProduct::findOrFail($id);
        $oldPrice = $item->price;
        
        $item->update([
            'price' => $validated['price'],
            'last_pasted_at' => now(),
        ]);

        if ($oldPrice != $validated['price']) {
            SupplierPriceHistory::create([
                'supplier_product_id' => $item->id,
                'price' => $item->price,
                'currency' => $item->currency,
            ]);
        }

        return response()->json([
            'message' => 'Price updated successfully',
            'data' => $item
        ]);
    }
}
