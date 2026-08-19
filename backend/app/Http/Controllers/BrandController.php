<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BrandController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Brand::latest()->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            // Uniqueness is per tenant: one company's brand names must not
            // constrain another's.
            'name' => [
                'required',
                'string',
                Rule::unique('brands', 'name')->where('company_id', $request->user()->company_id),
            ],
            'logo' => 'nullable|string',
        ]);

        $brand = Brand::create($validated);
        return response()->json($brand);
    }
}
