<?php

namespace App\Http\Controllers;

use App\Models\MarketingSuppression;
use Illuminate\Http\Request;

class MarketingSuppressionController extends Controller
{
    public function index(Request $request)
    {
        $query = MarketingSuppression::with('creator:id,name');

        if ($request->filled('search')) {
            $query->where('value', 'like', '%' . strtolower($request->search) . '%');
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('kind') && $request->kind !== 'all') {
            $query->where('kind', $request->kind);
        }

        $suppressions = $query->latest()->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));

        return response()->json([
            'data' => $suppressions->items(),
            'total' => $suppressions->total(),
            'current_page' => $suppressions->currentPage(),
            'last_page' => $suppressions->lastPage(),
            'per_page' => $suppressions->perPage(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kind' => 'required|string|in:email,domain',
            'values' => 'required|array|min:1',
            'values.*' => 'required|string|max:191',
            'type' => 'nullable|string|in:unsubscribe,hard_bounce,spam,invalid,blocked_domain,manual',
            'notes' => 'nullable|string',
        ]);

        $kind = $validated['kind'];
        $type = $validated['type'] ?? ($kind === 'domain' ? 'blocked_domain' : 'manual');

        $created = 0;
        $invalid = [];

        foreach ($validated['values'] as $value) {
            $value = strtolower(trim($value));

            if ($kind === 'email' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                $invalid[] = $value;
                continue;
            }
            if ($kind === 'domain' && !preg_match('/^[a-z0-9.-]+\.[a-z]{2,}$/', $value)) {
                $invalid[] = $value;
                continue;
            }

            $suppression = MarketingSuppression::firstOrCreate(
                ['company_id' => $request->user()->company_id, 'kind' => $kind, 'value' => $value],
                ['type' => $type, 'notes' => $validated['notes'] ?? null, 'created_by' => $request->user()->id]
            );

            if ($suppression->wasRecentlyCreated) {
                $created++;
            }
        }

        return response()->json([
            'message' => $created . ' entr' . ($created === 1 ? 'y' : 'ies') . ' added to the suppression list',
            'created' => $created,
            'invalid' => $invalid,
        ], 201);
    }

    public function destroy(Request $request, MarketingSuppression $marketingSuppression)
    {
        $marketingSuppression->delete();

        return response()->json(['message' => 'Suppression removed']);
    }
}
