<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $suppliers = Supplier::withCount(['brands', 'products'])
            ->latest()
            ->paginate($request->get('per_page', 10));

        return response()->json([
            'data' => $suppliers->items(),
            'total' => $suppliers->total(),
            'current_page' => $suppliers->currentPage(),
            'last_page' => $suppliers->lastPage(),
            'per_page' => $suppliers->perPage(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'contact_person' => 'nullable|string',
            'email' => 'required|email',
            'phone' => 'nullable|string',
            'website' => 'nullable|string',
            'address' => 'nullable|string',
        ]);

        // Wrapped in a transaction so the atomic supplier_code lock (see
        // Supplier::boot()) is held until this row is actually inserted.
        $supplier = DB::transaction(fn () => Supplier::create($validated));
        return response()->json($supplier);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'contact_person' => 'nullable|string',
            'email' => 'required|email',
            'phone' => 'nullable|string',
            'website' => 'nullable|string',
            'address' => 'nullable|string',
        ]);

        $supplier->update($validated);
        return response()->json($supplier);
    }

    public function show(Request $request, Supplier $supplier)
    {
        return response()->json([
            'supplier' => $supplier->loadCount(['brands', 'products']),
            'products' => $supplier->products()
                ->with(['product', 'category'])
                ->paginate($request->get('per_page', 10))
        ]);
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->delete();
        return response()->json(['message' => 'Supplier deleted']);
    }
}
