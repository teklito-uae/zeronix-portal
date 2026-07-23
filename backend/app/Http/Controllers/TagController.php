<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Http\Request;

class TagController extends Controller
{
    public function index()
    {
        return response()->json(Tag::latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'color' => 'nullable|string|max:50',
        ]);

        $tag = Tag::firstOrCreate(
            ['name' => $validated['name']],
            ['color' => $validated['color'] ?? null]
        );
        
        if ($tag->wasRecentlyCreated === false && isset($validated['color'])) {
            $tag->update(['color' => $validated['color']]);
        }

        return response()->json($tag, 201);
    }
}
