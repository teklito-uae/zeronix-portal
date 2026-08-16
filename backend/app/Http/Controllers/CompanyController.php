<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class CompanyController extends Controller
{
    /**
     * Fields an admin is allowed to set on a company profile via store()/update().
     * Deliberately excludes 'status' and 'rejection_reason' (managed only via
     * approve()/reject()/suspend()) and attachment paths (managed via file upload
     * flows in publicStore()).
     */
    private const ASSIGNABLE_FIELDS = [
        'name' => 'nullable|string',
        'company_id' => 'nullable|string',
        'number' => 'nullable|string',
        'first_name' => 'nullable|string',
        'last_name' => 'nullable|string',
        'phone' => 'nullable|string',
        'salutation' => 'nullable|string',
        'job_title' => 'nullable|string',
        'description' => 'nullable|string',
        'industry' => 'nullable|string',
        'address' => 'nullable|string',
        'tax_number' => 'nullable|string',
        'website' => 'nullable|string',
        'owner_user_id' => 'nullable|exists:users,id',
        'currency' => 'nullable|string',
        'internal_notes' => 'nullable|string',
        'profile_image' => 'nullable|string',
        'instagram' => 'nullable|string',
        'facebook' => 'nullable|string',
        'linkedin' => 'nullable|string',
        'twitter' => 'nullable|string',
        'opening_balance' => 'nullable|numeric',
        'show_job_amount_to_worker' => 'boolean',
        'is_client_portal_enabled' => 'boolean',
        'settings' => 'nullable|array',
    ];

    /**
     * True platform staff — the only role allowed to list, create, or delete
     * arbitrary tenant companies. A tenant's own "admin" role is scoped to
     * their own company record only (see ensureOwnCompanyOrSuperAdmin()).
     */
    private function isSuperAdmin(Request $request): bool
    {
        return $request->user()?->role === 'super_admin';
    }

    private function ensureOwnCompanyOrSuperAdmin(Request $request, Company $company): void
    {
        if ($this->isSuperAdmin($request)) {
            return;
        }

        if ($company->id !== $request->user()->company_id) {
            abort(403, 'Forbidden. You may only access your own company record.');
        }
    }

    public function index(Request $request)
    {
        if (!$this->isSuperAdmin($request)) {
            return response()->json(['message' => 'Forbidden. Super Admin access required.'], 403);
        }

        return response()->json(Company::with('owner')->get());
    }

    public function store(Request $request)
    {
        if (!$this->isSuperAdmin($request)) {
            return response()->json(['message' => 'Forbidden. Super Admin access required.'], 403);
        }

        $validated = $request->validate(array_merge(self::ASSIGNABLE_FIELDS, [
            'email' => 'nullable|email|unique:companies,email',
        ]));

        $company = Company::create($validated);

        return response()->json($company, 201);
    }

    public function publicStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'number' => 'nullable|string',
            'tax_number' => 'nullable|string',
            'website' => 'nullable|string',
            'description' => 'nullable|string',
            'industry' => 'nullable|string',
            'address' => 'nullable|string',
            'first_name' => 'required|string',
            'last_name' => 'nullable|string',
            'email' => 'required|email|unique:companies,email|unique:users,email',
            'phone' => 'nullable|string',
            'salutation' => 'nullable|string',
            'job_title' => 'nullable|string',
            'instagram' => 'nullable|string',
            'facebook' => 'nullable|string',
            'linkedin' => 'nullable|string',
            'twitter' => 'nullable|string',
            'currency' => 'nullable|string',
            'password' => 'required|string|min:8|confirmed',
            'license_attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'vat_attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $password = $validated['password'];
        unset($validated['password'], $validated['password_confirmation']);

        if ($request->hasFile('license_attachment')) {
            $validated['license_attachment'] = $request->file('license_attachment')->store('company_documents', 'public');
        }

        if ($request->hasFile('vat_attachment')) {
            $validated['vat_attachment'] = $request->file('vat_attachment')->store('company_documents', 'public');
        }

        // Set default values for public registration
        $validated['is_client_portal_enabled'] = true;

        $company = \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $password) {
            $company = Company::create($validated);

            $user = \App\Models\User::create([
                'name' => trim($validated['first_name'] . ' ' . ($validated['last_name'] ?? '')),
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => $password,
                'role' => 'admin',
                'company_id' => $company->id,
                // Locked out until an admin approves the company.
                'is_active' => false,
            ]);

            $company->update(['owner_user_id' => $user->id]);

            return $company;
        });

        return response()->json([
            'message' => 'Company registration successful. Your account will be activated once an administrator approves your registration.',
            'company' => $company
        ], 201);
    }

    public function show(Request $request, Company $company)
    {
        $this->ensureOwnCompanyOrSuperAdmin($request, $company);

        $company->load('owner');
        return response()->json($company);
    }

    public function update(Request $request, Company $company)
    {
        $this->ensureOwnCompanyOrSuperAdmin($request, $company);

        $validated = $request->validate(array_merge(self::ASSIGNABLE_FIELDS, [
            'email' => 'nullable|email|unique:companies,email,' . $company->id,
        ]));

        $company->update($validated);

        return response()->json($company);
    }

    public function approve($id)
    {
        if (!in_array(auth()->user()->role, ['super_admin', 'admin'])) {
            return response()->json(['message' => 'Unauthorized. Super Admin access required.'], 403);
        }

        $company = Company::findOrFail($id);
        $company->update(['status' => 'approved', 'is_client_portal_enabled' => true]);

        // Activate the company admin's account, creating it if it doesn't exist yet
        // (covers companies that registered before accounts were created at signup time).
        if ($company->email) {
            $user = \App\Models\User::where('email', $company->email)->first();

            if ($user) {
                $user->update(['is_active' => true]);
            } else {
                // New tenant admin accounts are created with a random, unusable
                // password (never surfaced to anyone) rather than a guessable
                // hardcoded one. They can't log in with it, so we immediately
                // send them a "set your password" email via the standard
                // Laravel password-reset broker (see AdminAuthController's
                // forgot/reset-password endpoints and
                // User::sendPasswordResetNotification()).
                $newAdmin = \App\Models\User::create([
                    'email' => $company->email,
                    'company_id' => $company->id,
                    'role' => 'admin',
                    'name' => trim($company->first_name . ' ' . $company->last_name),
                    'phone' => $company->phone,
                    'password' => bcrypt(Str::random(32)),
                    'is_active' => true,
                ]);

                Password::sendResetLink(['email' => $newAdmin->email]);
            }
        }

        return response()->json(['message' => 'Company approved successfully', 'company' => $company]);
    }

    public function reject(Request $request, $id)
    {
        if (!in_array(auth()->user()->role, ['super_admin', 'admin'])) {
            return response()->json(['message' => 'Unauthorized. Super Admin access required.'], 403);
        }

        $company = Company::findOrFail($id);
        $company->update([
            'status' => 'rejected',
            'rejection_reason' => $request->reason,
            'is_client_portal_enabled' => false
        ]);

        if ($company->email) {
            \App\Models\User::where('email', $company->email)->update(['is_active' => false]);
        }

        return response()->json(['message' => 'Company rejected', 'company' => $company]);
    }

    public function suspend($id)
    {
        if (!in_array(auth()->user()->role, ['super_admin', 'admin'])) {
            return response()->json(['message' => 'Unauthorized. Super Admin access required.'], 403);
        }

        $company = Company::findOrFail($id);
        $company->update(['status' => 'suspended', 'is_client_portal_enabled' => false]);

        if ($company->email) {
            \App\Models\User::where('email', $company->email)->update(['is_active' => false]);
        }

        return response()->json(['message' => 'Company suspended', 'company' => $company]);
    }

    public function destroy(Request $request, Company $company)
    {
        if (!$this->isSuperAdmin($request)) {
            return response()->json(['message' => 'Forbidden. Super Admin access required.'], 403);
        }

        $company->delete();
        return response()->json(null, 204);
    }
}
