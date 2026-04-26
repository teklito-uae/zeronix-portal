<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Brand::latest()->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:brands',
            'logo' => 'nullable|string',
            'website' => 'nullable|string',
        ]);

        $brand = Brand::create($validated);
        return response()->json($brand);
    }
}
