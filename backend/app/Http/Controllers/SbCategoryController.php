<?php

namespace App\Http\Controllers;

use App\Models\SbCategory;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

class SbCategoryController extends Controller
{
    public function index(Request $request)
    {
        $categories = SbCategory::orderBy('sort_order')->orderBy('name')->get();

        return response()->json(['data' => $categories]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:120',
            'slug' => 'nullable|string|max:120',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
        ]);

        try {
            $category = SbCategory::create($validated);
        } catch (QueryException $e) {
            if ((int) $e->getCode() === 23000) {
                return response()->json(['message' => 'A category with this name already exists'], 422);
            }
            throw $e;
        }

        return response()->json($category, 201);
    }

    public function update(Request $request, SbCategory $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:120',
            'slug' => 'nullable|string|max:120',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
        ]);

        try {
            $category->update($validated);
        } catch (QueryException $e) {
            if ((int) $e->getCode() === 23000) {
                return response()->json(['message' => 'A category with this name already exists'], 422);
            }
            throw $e;
        }

        return response()->json($category);
    }

    public function destroy(SbCategory $category)
    {
        $category->delete();

        return response()->json(['message' => 'Category deleted']);
    }
}
