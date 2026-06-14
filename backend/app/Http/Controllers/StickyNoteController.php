<?php

namespace App\Http\Controllers;

use App\Models\StickyNote;
use Illuminate\Http\Request;

class StickyNoteController extends Controller
{
    public function index(Request $request)
    {
        return response()->json($request->user()->stickyNotes()->orderBy('position_index')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'content' => 'nullable|string',
            'color' => 'nullable|string',
            'position_index' => 'nullable|integer',
        ]);

        $note = $request->user()->stickyNotes()->create($validated);
        return response()->json($note, 201);
    }

    public function update(Request $request, StickyNote $stickyNote)
    {
        if ($stickyNote->user_id !== $request->user()->id)
            abort(403);

        $validated = $request->validate([
            'content' => 'sometimes|nullable|string',
            'color' => 'nullable|string',
            'position_index' => 'nullable|integer',
        ]);

        $stickyNote->update($validated);
        return response()->json($stickyNote);
    }

    public function destroy(Request $request, StickyNote $stickyNote)
    {
        if ($stickyNote->user_id !== $request->user()->id)
            abort(403);
        $stickyNote->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
