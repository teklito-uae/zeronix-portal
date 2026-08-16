<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Customer;
use App\Models\CustomerContact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Tag;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DealController extends Controller
{
    private const SOURCES = ['manual', 'website', 'email', 'referral', 'import', 'other'];
    private const STAGES = ['new', 'qualified', 'requirement', 'proposal_sent', 'negotiation', 'won', 'lost', 'cancelled'];
    private const LOST_REASONS = ['price', 'competitor', 'no_budget', 'requirements_changed', 'customer_cancelled', 'no_response', 'duplicate', 'other'];
    private const CLOSED_STAGES = ['won', 'lost', 'cancelled'];

    /**
     * Resolve a brand-new contact (no customer_id supplied) to, in priority order:
     * an existing Customer Contact (dedup by email — a known contact at a company
     * must not spawn a duplicate Lead), an existing Customer without contacts yet
     * (backward compatibility for pre-Contact-feature customers), or a Lead (a new
     * prospect, not yet an accounting entity).
     *
     * @return array{customer_id: int|null, lead_id: int|null, contact_id: int|null}
     */
    private function resolveContact(?string $email, array $attrs): array
    {
        if (empty($email)) {
            return ['customer_id' => null, 'lead_id' => null, 'contact_id' => null];
        }

        $contact = CustomerContact::where('email', $email)->where('is_active', true)->first();
        if ($contact) {
            return ['customer_id' => $contact->customer_id, 'lead_id' => null, 'contact_id' => $contact->id];
        }

        $customer = Customer::where('email', $email)->first();
        if ($customer) {
            return ['customer_id' => $customer->id, 'lead_id' => null, 'contact_id' => $customer->primaryContact()?->id];
        }

        $lead = Lead::firstOrCreate(
            ['email' => $email],
            [
                'name' => $attrs['name'] ?? 'Unknown',
                'phone' => $attrs['phone'] ?? null,
                'company' => $attrs['company'] ?? null,
                'source' => $attrs['source'] ?? null,
                'user_id' => $attrs['user_id'] ?? null,
            ]
        );
        return ['customer_id' => null, 'lead_id' => $lead->id, 'contact_id' => null];
    }

    public function index(Request $request)
    {
        $request->validate([
            'owner_id' => 'nullable|exists:users,id',
            'tag_id' => 'nullable|exists:tags,id',
            'company_id' => 'nullable|exists:customers,id',
        ]);

        $query = Deal::with(['customer', 'lead', 'customerContact', 'user', 'assigned_users', 'tags'])->withCount('items');

        // Data Scoping
        $query->forUser($request->user());

        $this->applySharedFilters($query, $request);

        if ($request->filled('stage') && $request->stage !== 'all') {
            $query->orderBy('position');
        } else {
            $query->latest();
        }

        $deals = $query->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));

        return response()->json([
            'data' => $deals->items(),
            'total' => $deals->total(),
            'current_page' => $deals->currentPage(),
            'last_page' => $deals->lastPage(),
            'per_page' => $deals->perPage(),
        ]);
    }

    /**
     * Search/priority/source/owner/tag filters shared by index() and
     * pipelineStats(). Assumes forUser() scoping has already been applied
     * to $query — these filters only ever narrow visibility further.
     */
    private function applySharedFilters(Builder $query, Request $request): void
    {
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function($q) use ($s) {
                $q->whereHas('customer', function ($q2) use ($s) {
                    $q2->where('name', 'like', "%{$s}%")
                      ->orWhere('company', 'like', "%{$s}%")
                      ->orWhere('email', 'like', "%{$s}%");
                })->orWhere('id', 'like', "%{$s}%")
                  ->orWhere('deal_code', 'like', "%{$s}%");
            });
        }

        if ($request->filled('stage') && $request->stage !== 'all') {
            $query->where('stage', $request->stage);
        }

        if ($request->filled('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('source') && $request->source !== 'all') {
            $query->where('source', $request->source);
        }

        if ($request->filled('owner_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('user_id', $request->owner_id)
                    ->orWhereHas('assigned_users', fn ($sub) => $sub->where('users.id', $request->owner_id));
            });
        }

        if ($request->filled('tag_id')) {
            $query->whereHas('tags', fn ($q) => $q->where('tags.id', $request->tag_id));
        }

        // "Company" in the UI filter means the linked customer/account
        // (Deal::customer_id) — not the tenant. Tenant scoping is handled
        // separately by forUser()/BelongsToCompany.
        if ($request->filled('company_id')) {
            $query->where('customer_id', $request->company_id);
        }
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

    /**
     * Aggregate counts/values per pipeline stage (no deal rows), for the
     * new Kanban board which fetches each column's cards separately/paged
     * via index(). Kept alongside the older pipeline() method, which still
     * has another caller (Calendar.tsx's follow-up buckets) that needs the
     * full deal records.
     */
    public function pipelineStats(Request $request): JsonResponse
    {
        $query = Deal::query()->forUser($request->user());
        $this->applySharedFilters($query, $request);

        $rows = $query->selectRaw('stage, COUNT(*) as count, COALESCE(SUM(value),0) as value')
            ->groupBy('stage')
            ->get()
            ->keyBy('stage');

        $stats = collect(self::STAGES)->mapWithKeys(fn ($stage) => [
            $stage => [
                'count' => (int) ($rows[$stage]->count ?? 0),
                'value' => (float) ($rows[$stage]->value ?? 0),
            ],
        ]);

        return response()->json(['data' => $stats]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'customer_contact_id' => 'nullable|exists:customer_contacts,id',
            'customer_name' => 'required_without:customer_id|string|max:255',
            'customer_email' => 'required_without:customer_id|email',
            'customer_phone' => 'nullable|string|max:50',
            'customer_company' => 'nullable|string|max:255',
            'source' => 'nullable|string|in:' . implode(',', self::SOURCES),
            'priority' => 'nullable|string',
            'notes' => 'nullable|string',
            'title' => 'nullable|string|max:255',
            'value' => 'nullable|numeric|min:0',
            'stage' => 'nullable|string|in:' . implode(',', self::STAGES),
            'expected_close_date' => 'nullable|date',
            'probability' => 'nullable|integer|min:0|max:100',
            'next_action_at' => 'nullable|date',
            'next_action_note' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.description' => 'nullable|string',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'items.*.tax_percent' => 'nullable|numeric|min:0',
            'items.*.discount_percent' => 'nullable|numeric|min:0|max:100',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        DB::beginTransaction();
        try {
            $customerId = $validated['customer_id'] ?? null;
            $contactId = $validated['customer_contact_id'] ?? null;
            $leadId = null;

            // CRM Flow: resolve a brand-new contact to an existing Customer Contact
            // (dedup), an existing Customer without contacts yet, or a new Lead — a
            // prospect is not an accounting entity until converted.
            if (!$customerId && !empty($validated['customer_email'])) {
                $resolved = $this->resolveContact($validated['customer_email'], [
                    'name' => $validated['customer_name'] ?? 'Unknown',
                    'phone' => $validated['customer_phone'] ?? null,
                    'company' => $validated['customer_company'] ?? null,
                    'source' => $validated['source'] ?? 'manual',
                    'user_id' => $request->user()->id ?? null,
                ]);
                $customerId = $resolved['customer_id'];
                $contactId = $resolved['contact_id'];
                $leadId = $resolved['lead_id'];
            }

            $attachmentPaths = [];
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $attachmentPaths[] = $file->store('enquiry_attachments', 'public');
                }
            }

            $stage = $validated['stage'] ?? 'new';
            $companyId = $request->user()->company_id ?? null;
            $position = (Deal::where('company_id', $companyId)->where('stage', $stage)->max('position') ?? 0) + 1000;

            $deal = Deal::create([
                'customer_id' => $customerId,
                'lead_id' => $leadId,
                'customer_contact_id' => $contactId,
                'user_id' => $request->user()->id ?? null,
                'source' => $validated['source'] ?? 'manual',
                'priority' => $validated['priority'] ?? 'normal',
                'notes' => $validated['notes'] ?? null,
                'attachments' => $attachmentPaths,
                'title' => $validated['title'] ?? null,
                'value' => $validated['value'] ?? null,
                'stage' => $stage,
                'position' => $position,
                'expected_close_date' => $validated['expected_close_date'] ?? null,
                'probability' => $validated['probability'] ?? 50,
                'next_action_at' => $validated['next_action_at'] ?? null,
                'next_action_note' => $validated['next_action_note'] ?? null,
            ]);

            if ($request->user()) {
                $deal->assigned_users()->attach([$request->user()->id]);
            }

            if (!empty($validated['items'])) {
                foreach ($validated['items'] as $item) {
                    $quantity = $item['quantity'];
                    $unitPrice = $item['unit_price'] ?? 0;
                    $discountPercent = $item['discount_percent'] ?? 0;
                    $taxPercent = $item['tax_percent'] ?? 5;

                    $lineSubtotal = $quantity * $unitPrice;
                    $discountAmount = $lineSubtotal * ($discountPercent / 100);
                    $taxable = $lineSubtotal - $discountAmount;
                    $taxAmount = $taxable * ($taxPercent / 100);
                    $total = $taxable + $taxAmount;

                    $deal->items()->create([
                        'product_id' => $item['product_id'] ?? null,
                        'quantity' => $quantity,
                        'description' => $item['description'] ?? null,
                        'unit_price' => $unitPrice,
                        'tax_percent' => $taxPercent,
                        'tax_amount' => $taxAmount,
                        'discount_percent' => $discountPercent,
                        'discount_amount' => $discountAmount,
                        'total' => $total,
                    ]);
                }
            }

            DB::commit();

            $deal->load(['customer', 'lead', 'customerContact', 'items.product', 'user', 'assigned_users']);

            return response()->json($deal, 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Failed to create deal: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Failed to create deal.'], 500);
        }
    }

    public function show(Request $request, Deal $deal)
    {
        $this->authorize('view', $deal);
        return response()->json($deal->load(['lead', 'customer', 'customerContact', 'user', 'assigned_users', 'items.product', 'additionalContacts', 'activities.user', 'quotes']));
    }

    public function update(Request $request, Deal $deal)
    {
        $this->authorize('update', $deal);

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'value' => 'nullable|numeric|min:0',
            'stage' => 'nullable|string|in:' . implode(',', self::STAGES),
            'priority' => 'nullable|string',
            'notes' => 'nullable|string',
            'customer_contact_id' => 'nullable|exists:customer_contacts,id',
            'expected_close_date' => 'nullable|date',
            'probability' => 'nullable|integer|min:0|max:100',
            'next_action_at' => 'nullable|date',
            'next_action_note' => 'nullable|string',
            'lost_reason' => 'required_if:stage,lost|nullable|string|in:' . implode(',', self::LOST_REASONS),
            'lost_notes' => 'nullable|string',
            'cancellation_reason' => 'required_if:stage,cancelled|string|nullable',
        ]);

        if (isset($validated['stage']) && $validated['stage'] === 'cancelled' && $deal->stage !== 'cancelled') {
            $validated['cancelled_at'] = now();
        }

        if (array_key_exists('stage', $validated)) {
            $validated['closed_at'] = in_array($validated['stage'], self::CLOSED_STAGES) ? now() : null;
        }

        $deal->update($validated);

        return response()->json($deal->load(['lead', 'customer', 'customerContact', 'user', 'assigned_users']));
    }

    public function destroy(Request $request, Deal $deal)
    {
        $this->authorize('delete', $deal);
        $deal->delete();
        return response()->json(['message' => 'Deal deleted']);
    }

    public function assign(Request $request, Deal $deal)
    {
        $this->authorize('update', $deal);

        $validated = $request->validate([
            'user_ids'   => 'nullable|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $deal->assigned_users()->sync($validated['user_ids'] ?? []);
        $deal->load(['customer', 'user', 'assigned_users']);

        return response()->json($deal);
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

    public function uploadAttachment(Request $request, Deal $deal)
    {
        $this->authorize('update', $deal);

        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $path = $request->file('file')->store('deal-attachments', 'public');

        $attachments = $deal->attachments ?? [];
        $attachments[] = [
            'name' => $request->file('file')->getClientOriginalName(),
            'path' => $path,
            'size' => $request->file('file')->getSize(),
            'uploaded_at' => now()->toIso8601String(),
        ];

        $deal->update(['attachments' => $attachments]);

        return response()->json($deal->fresh());
    }

    public function removeAttachment(Request $request, Deal $deal, int $index)
    {
        $this->authorize('update', $deal);

        $attachments = $deal->attachments ?? [];
        if (isset($attachments[$index])) {
            Storage::disk('public')->delete($attachments[$index]['path']);
            unset($attachments[$index]);
            $deal->update(['attachments' => array_values($attachments)]);
        }

        return response()->json($deal->fresh());
    }

    public function attachContact(Request $request, Deal $deal, CustomerContact $contact)
    {
        $this->authorize('update', $deal);

        $deal->additionalContacts()->syncWithoutDetaching([$contact->id]);

        return response()->json($deal->load('additionalContacts'));
    }

    public function detachContact(Request $request, Deal $deal, CustomerContact $contact)
    {
        $this->authorize('update', $deal);

        $deal->additionalContacts()->detach($contact->id);

        return response()->json($deal->load('additionalContacts'));
    }

    /**
     * Read-only merged timeline: this Deal's own DealActivity entries plus
     * matching ActivityLog rows (edits to the deal itself, or to its parent
     * Customer), normalized into a common {type, description, user, at}
     * shape and sorted newest-first. No pagination given current data
     * volumes.
     */
    public function timeline(Request $request, Deal $deal)
    {
        $this->authorize('view', $deal);

        $dealActivities = $deal->activities()->with('user')->get()->map(function ($activity) {
            return [
                'type' => $activity->type,
                'description' => $activity->notes,
                'user' => $activity->user,
                'at' => $activity->created_at,
            ];
        });

        $activityLogs = ActivityLog::where(function ($q) use ($deal) {
                $q->where('subject_type', Deal::class)->where('subject_id', $deal->id);
            })
            ->orWhere(function ($q) use ($deal) {
                $q->where('subject_type', Customer::class)->where('customer_id', $deal->customer_id);
            })
            ->with('user')
            ->get()
            ->map(function ($log) {
                return [
                    'type' => $log->action,
                    'description' => $log->description,
                    'user' => $log->user,
                    'at' => $log->created_at,
                ];
            });

        $timeline = $dealActivities->concat($activityLogs)->sortByDesc('at')->values();

        return response()->json($timeline);
    }

    /**
     * Moves a deal to a (possibly new) stage and/or reorders it within a
     * stage column, for the Kanban board's drag-and-drop. `before_id` is
     * the id of the neighboring deal that sits immediately ABOVE the drop
     * point in the target column (the row with the smaller `position`);
     * `after_id` is the neighboring deal immediately BELOW the drop point
     * (the row with the larger `position`). The new position is the
     * midpoint between the two — either may be omitted for a drop at the
     * very top/bottom/only-item of a column.
     */
    public function move(Request $request, Deal $deal): JsonResponse
    {
        $this->authorize('update', $deal);

        $validated = $request->validate([
            'stage' => 'required|string|in:' . implode(',', self::STAGES),
            'before_id' => 'nullable|integer|exists:enquiries,id',
            'after_id' => 'nullable|integer|exists:enquiries,id',
            'lost_reason' => 'required_if:stage,lost|nullable|string|in:' . implode(',', self::LOST_REASONS),
            'lost_notes' => 'nullable|string',
            'cancellation_reason' => 'required_if:stage,cancelled|string|nullable',
        ]);

        DB::beginTransaction();
        try {
            $companyId = $deal->company_id;
            $targetStage = $validated['stage'];

            [$prevPos, $nextPos] = $this->resolveNeighborPositions($validated['before_id'] ?? null, $validated['after_id'] ?? null);

            if ($prevPos !== null && $nextPos !== null && ($nextPos - $prevPos) <= 1) {
                $this->renormalizeColumn($companyId, $targetStage);
                [$prevPos, $nextPos] = $this->resolveNeighborPositions($validated['before_id'] ?? null, $validated['after_id'] ?? null);
            }

            $newPosition = match (true) {
                $prevPos === null && $nextPos === null => 1000,
                $prevPos === null => intdiv($nextPos, 2),
                $nextPos === null => $prevPos + 1000,
                default => intdiv($prevPos + $nextPos, 2),
            };

            $update = ['stage' => $targetStage, 'position' => $newPosition];

            if ($targetStage === 'cancelled' && $deal->stage !== 'cancelled') {
                $update['cancelled_at'] = now();
                $update['cancellation_reason'] = $validated['cancellation_reason'] ?? null;
            }
            if (in_array($targetStage, self::CLOSED_STAGES, true)) {
                $update['closed_at'] = now();
            } elseif ($deal->stage !== $targetStage) {
                $update['closed_at'] = null;
            }
            if ($targetStage === 'lost') {
                $update['lost_reason'] = $validated['lost_reason'];
                $update['lost_notes'] = $validated['lost_notes'] ?? null;
            }

            $deal->update($update);
            DB::commit();

            return response()->json($deal->fresh(['customer', 'lead', 'customerContact', 'user', 'assigned_users', 'tags']));
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Failed to move deal: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Failed to move deal.'], 500);
        }
    }

    private function resolveNeighborPositions(?int $beforeId, ?int $afterId): array
    {
        $prev = $beforeId ? Deal::where('id', $beforeId)->value('position') : null;
        $next = $afterId ? Deal::where('id', $afterId)->value('position') : null;
        return [$prev, $next];
    }

    private function renormalizeColumn(?int $companyId, string $stage): void
    {
        $ids = Deal::where('company_id', $companyId)->where('stage', $stage)
            ->orderBy('position')->pluck('id');
        $pos = 1000;
        foreach ($ids as $id) {
            Deal::where('id', $id)->update(['position' => $pos]);
            $pos += 1000;
        }
    }

    public function attachTag(Request $request, Deal $deal): JsonResponse
    {
        $this->authorize('update', $deal);
        $validated = $request->validate(['tag_id' => 'required|exists:tags,id']);
        $deal->tags()->syncWithoutDetaching([$validated['tag_id']]);
        return response()->json($deal->tags()->get());
    }

    public function detachTag(Deal $deal, Tag $tag): JsonResponse
    {
        $this->authorize('update', $deal);
        $deal->tags()->detach($tag->id);
        return response()->json($deal->tags()->get());
    }
}
