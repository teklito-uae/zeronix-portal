<?php

namespace App\Http\Controllers;

use App\Models\SbVendor;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

class SbVendorController extends Controller
{
    public function index(Request $request)
    {
        $query = SbVendor::with('category')->latest();

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $vendors = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $vendors->items(),
            'total' => $vendors->total(),
            'current_page' => $vendors->currentPage(),
            'last_page' => $vendors->lastPage(),
            'per_page' => $vendors->perPage(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'phone_raw' => 'required|string|max:50',
            'whatsapp_chat_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'category_id' => 'nullable|exists:sb_categories,id',
            'notes' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'source' => 'nullable|string|in:manual,extension',
        ]);

        $validated['phone_e164'] = SbVendor::normalizePhone($validated['phone_raw']);
        $validated['source'] = $validated['source'] ?? 'manual';
        $validated['created_by_user_id'] = $request->user()->id ?? null;

        try {
            $vendor = SbVendor::create($validated);
        } catch (QueryException $e) {
            if ((int) $e->getCode() === 23000) {
                return response()->json(['message' => 'A vendor with this phone number already exists'], 422);
            }
            throw $e;
        }

        return response()->json($vendor->load('category'), 201);
    }

    public function show(SbVendor $vendor)
    {
        return response()->json($vendor->load('category'));
    }

    public function update(Request $request, SbVendor $vendor)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'phone_raw' => 'required|string|max:50',
            'whatsapp_chat_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'category_id' => 'nullable|exists:sb_categories,id',
            'notes' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'source' => 'nullable|string|in:manual,extension',
        ]);

        if ($validated['phone_raw'] !== $vendor->phone_raw) {
            $validated['phone_e164'] = SbVendor::normalizePhone($validated['phone_raw']);
        }

        try {
            $vendor->update($validated);
        } catch (QueryException $e) {
            if ((int) $e->getCode() === 23000) {
                return response()->json(['message' => 'A vendor with this phone number already exists'], 422);
            }
            throw $e;
        }

        return response()->json($vendor->load('category'));
    }

    public function destroy(SbVendor $vendor)
    {
        $vendor->delete();

        return response()->json(['message' => 'Vendor deleted']);
    }
}
