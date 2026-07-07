<?php

namespace App\Http\Controllers;

use App\Models\MarketingSegment;
use App\Services\MarketingAudienceService;
use Illuminate\Http\Request;

class MarketingSegmentController extends Controller
{
    public function index(Request $request)
    {
        $query = MarketingSegment::with('user:id,name');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('source') && $request->source !== 'all') {
            $query->where('source', $request->source);
        }

        $segments = $query->latest()->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));

        return response()->json([
            'data' => $segments->items(),
            'total' => $segments->total(),
            'current_page' => $segments->currentPage(),
            'last_page' => $segments->lastPage(),
            'per_page' => $segments->perPage(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateSegment($request);

        $segment = MarketingSegment::create(array_merge($validated, [
            'user_id' => $request->user()->id,
            'cached_count' => MarketingAudienceService::count(
                $request->user()->company_id,
                $validated['source'],
                $validated['filters'] ?? []
            ),
            'counted_at' => now(),
        ]));

        return response()->json($segment, 201);
    }

    public function show(Request $request, MarketingSegment $marketingSegment)
    {
        return response()->json($marketingSegment->load('user:id,name'));
    }

    public function update(Request $request, MarketingSegment $marketingSegment)
    {
        $validated = $this->validateSegment($request);

        $marketingSegment->update(array_merge($validated, [
            'cached_count' => MarketingAudienceService::count(
                $request->user()->company_id,
                $validated['source'],
                $validated['filters'] ?? []
            ),
            'counted_at' => now(),
        ]));

        return response()->json($marketingSegment->fresh());
    }

    public function destroy(Request $request, MarketingSegment $marketingSegment)
    {
        $marketingSegment->delete();

        return response()->json(['message' => 'Segment deleted']);
    }

    public function preview(Request $request, MarketingSegment $marketingSegment)
    {
        $companyId = $request->user()->company_id;
        $count = MarketingAudienceService::count($companyId, $marketingSegment->source, $marketingSegment->filters ?? []);
        $sample = MarketingAudienceService::sample($companyId, $marketingSegment->source, $marketingSegment->filters ?? []);

        $marketingSegment->update(['cached_count' => $count, 'counted_at' => now()]);

        return response()->json(['count' => $count, 'sample' => $sample]);
    }

    private function validateSegment(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'source' => 'required|string|in:leads,customers,contacts',
            'filters' => 'nullable|array',
        ]);
    }
}
