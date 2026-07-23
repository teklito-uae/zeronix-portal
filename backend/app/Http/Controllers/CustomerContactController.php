<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerContact;
use App\Models\Deal;
use App\Models\Invoice;
use App\Models\Quote;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerContactController extends Controller
{
    public function index(Request $request, Customer $customer)
    {
        $query = $customer->contacts();

        if ($request->boolean('active')) {
            $query->where('is_active', true);
        }

        return response()->json($query->orderByDesc('is_primary')->get());
    }

    public function store(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'designation' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'mobile' => 'nullable|string|max:50',
            'extension' => 'nullable|string|max:20',
            'is_primary' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        $isFirstContact = $customer->contacts()->count() === 0;
        $validated['is_primary'] = $validated['is_primary'] ?? $isFirstContact;
        $validated['is_active'] = $validated['is_active'] ?? true;

        $contact = $customer->contacts()->create($validated);

        return response()->json($contact, 201);
    }

    public function update(Request $request, Customer $customer, CustomerContact $contact)
    {
        $validated = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'designation' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'mobile' => 'nullable|string|max:50',
            'extension' => 'nullable|string|max:20',
            'is_primary' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        $contact->update($validated);

        return response()->json($contact);
    }

    public function destroy(Request $request, Customer $customer, CustomerContact $contact)
    {
        $contact->delete();
        return response()->json(['message' => 'Contact deleted']);
    }

    public function setPrimary(Request $request, Customer $customer, CustomerContact $contact)
    {
        $contact->update(['is_primary' => true]);
        return response()->json($customer->contacts()->orderByDesc('is_primary')->get());
    }

    public function show(Request $request, CustomerContact $contact)
    {
        $contact->load('customer:id,name,company,website,industry', 'tags');

        $contact->deals_count = (int) Deal::where('customer_contact_id', $contact->id)->count();
        $contact->deals_value = (float) Deal::where('customer_contact_id', $contact->id)->sum('value');
        $contact->quotes_count = (int) Quote::where('customer_contact_id', $contact->id)->count();
        $contact->invoices_count = (int) Invoice::where('customer_contact_id', $contact->id)->count();
        $contact->lifetime_value = (float) Invoice::where('customer_contact_id', $contact->id)
            ->where('status', '!=', 'cancelled')
            ->sum('total');

        return response()->json([
            'contact' => $contact,
            'deals' => $contact->deals()->latest()->limit(10)->get(),
            'quotes' => $contact->quotes()->latest()->limit(10)->get(),
            'invoices' => $contact->invoices()->latest()->limit(10)->get(),
            'activities' => $contact->activities()->with('user')->latest()->limit(30)->get(),
        ]);
    }

    public function addActivity(Request $request, CustomerContact $contact)
    {
        $validated = $request->validate([
            'type' => 'required|string|in:call,email,meeting,note,task',
            'notes' => 'nullable|string',
            'due_date' => 'nullable|date',
        ]);

        $validated['user_id'] = $request->user()->id ?? null;

        $activity = $contact->activities()->create($validated);

        return response()->json($activity->load('user'), 201);
    }

    public function attachTag(Request $request, CustomerContact $contact)
    {
        $validated = $request->validate([
            'tag_id' => 'required|exists:tags,id',
        ]);

        $contact->tags()->syncWithoutDetaching([$validated['tag_id']]);

        return response()->json($contact->tags()->get());
    }

    public function detachTag(CustomerContact $contact, Tag $tag)
    {
        $contact->tags()->detach($tag->id);

        return response()->json($contact->tags()->get());
    }

    public function indexAll(Request $request)
    {
        $query = CustomerContact::with('customer:id,name,company')
            ->withCount(['deals as deals_count'])
            ->whereHas('customer', fn ($q) => $q->forUser($request->user()));

        $lifetimeValueSub = DB::table('invoices')
            ->selectRaw('COALESCE(SUM(total), 0)')
            ->whereColumn('invoices.customer_contact_id', 'customer_contacts.id')
            ->where('invoices.status', '!=', 'cancelled');

        $query->addSelect(['lifetime_value' => $lifetimeValueSub]);

        if ($request->filled('search')) {
            $s = $request->get('search');
            $query->where(fn ($q) => $q->where('full_name', 'like', "%{$s}%")
                ->orWhere('email', 'like', "%{$s}%")
                ->orWhere('designation', 'like', "%{$s}%")
                ->orWhereHas('customer', fn ($q2) => $q2->where('name', 'like', "%{$s}%")
                    ->orWhere('company', 'like', "%{$s}%")));
        }
        if ($request->filled('customer_id')) {
            $customerIds = explode(',', $request->get('customer_id'));
            $query->whereIn('customer_id', $customerIds);
        }

        if ($request->filled('department')) {
            $departments = explode(',', $request->get('department'));
            $query->whereIn('department', $departments);
        }

        if ($request->filled('is_active')) {
            $statuses = explode(',', $request->get('is_active'));
            $bools = array_map(fn ($s) => $s === 'active', $statuses);
            $query->whereIn('is_active', $bools);
        }

        if ($request->filled('tag_id')) {
            $tagIds = explode(',', $request->get('tag_id'));
            $query->whereHas('tags', fn ($q) => $q->whereIn('tags.id', $tagIds));
        }

        $contacts = $query->orderByDesc('is_primary')->latest()
            ->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));

        return response()->json([
            'data' => $contacts->items(), 'total' => $contacts->total(),
            'current_page' => $contacts->currentPage(), 'last_page' => $contacts->lastPage(),
            'per_page' => $contacts->perPage(),
        ]);
    }

    public function departments(Request $request)
    {
        $departments = CustomerContact::whereHas('customer', fn ($q) => $q->forUser($request->user()))
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->distinct()
            ->orderBy('department')
            ->pluck('department');

        return response()->json($departments);
    }
}
