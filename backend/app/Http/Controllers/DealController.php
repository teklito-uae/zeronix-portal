<?php

namespace App\Http\Controllers;

use App\Models\Deal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DealController extends Controller
{
    private const STAGES = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
    private const CLOSED_STAGES = ['won', 'lost'];

    public function index(Request $request)
    {
        $query = Deal::with(['lead:id,name,company', 'customer:id,name,company', 'customerContact:id,customer_id,full_name', 'user:id,name']);

        $query->forUser($request->user());

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', "%{$s}%")
                    ->orWhere('deal_code', 'like', "%{$s}%");
            });
        }

        if ($request->filled('stage') && $request->stage !== 'all') {
            $query->where('stage', $request->stage);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        $deals = $query->latest()->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));

        return response()->json([
            'data' => $deals->items(),
            'total' => $deals->total(),
            'current_page' => $deals->currentPage(),
            'last_page' => $deals->lastPage(),
            'per_page' => $deals->perPage(),
        ]);
    }

    /**
     * Deals grouped by pipeline stage, for the Kanban board.
     */
    public function pipeline(Request $request)
    {
        $deals = Deal::with(['lead:id,name,company', 'customer:id,name,company', 'customerContact:id,customer_id,full_name', 'user:id,name'])
            ->forUser($request->user())
            ->latest()
            ->get();

        $grouped = $deals->groupBy('stage');

        $pipeline = collect(self::STAGES)->mapWithKeys(function ($stage) use ($grouped) {
            $stageDeals = $grouped->get($stage, collect());

            return [
                $stage => [
                    'deals' => $stageDeals->values(),
                    'count' => $stageDeals->count(),
                    'value' => $stageDeals->sum('value'),
                ],
            ];
        });

        return response()->json(['data' => $pipeline]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'lead_id' => 'nullable|exists:leads,id',
            'customer_id' => 'nullable|exists:customers,id',
            'customer_contact_id' => 'nullable|exists:customer_contacts,id',
            'value' => 'nullable|numeric|min:0',
            'stage' => 'nullable|string|in:' . implode(',', self::STAGES),
            'expected_close_date' => 'nullable|date',
        ]);

        if (empty($validated['lead_id']) && empty($validated['customer_id'])) {
            return response()->json([
                'message' => 'A deal must be linked to a lead or a customer.',
            ], 422);
        }

        $validated['user_id'] = $request->user()->id ?? null;

        DB::beginTransaction();
        try {
            $deal = Deal::create($validated);
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create deal', 'error' => $e->getMessage()], 500);
        }

        return response()->json($deal->load(['lead', 'customer', 'customerContact', 'user']), 201);
    }

    public function show(Request $request, Deal $deal)
    {
        $this->authorize('view', $deal);

        return response()->json($deal->load(['lead', 'customer', 'customerContact', 'user', 'activities.user']));
    }

    public function update(Request $request, Deal $deal)
    {
        $this->authorize('update', $deal);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'lead_id' => 'nullable|exists:leads,id',
            'customer_id' => 'nullable|exists:customers,id',
            'customer_contact_id' => 'nullable|exists:customer_contacts,id',
            'value' => 'nullable|numeric|min:0',
            'stage' => 'nullable|string|in:' . implode(',', self::STAGES),
            'expected_close_date' => 'nullable|date',
            'lost_reason' => 'nullable|string|max:255',
        ]);

        if (array_key_exists('stage', $validated)) {
            $validated['closed_at'] = in_array($validated['stage'], self::CLOSED_STAGES) ? now() : null;
        }

        $deal->update($validated);

        return response()->json($deal->load(['lead', 'customer', 'customerContact', 'user']));
    }

    public function destroy(Request $request, Deal $deal)
    {
        $this->authorize('delete', $deal);

        $deal->delete();

        return response()->json(['message' => 'Deal deleted']);
    }

    public function addActivity(Request $request, Deal $deal)
    {
        $this->authorize('update', $deal);

        $validated = $request->validate([
            'type' => 'required|string|in:call,email,meeting,note,task',
            'notes' => 'nullable|string',
            'due_date' => 'nullable|date',
        ]);

        $validated['deal_id'] = $deal->id;
        $validated['user_id'] = $request->user()->id ?? null;

        $activity = $deal->activities()->create($validated);

        return response()->json($activity->load('user'), 201);
    }
}
