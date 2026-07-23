<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function index()
    {
        return response()->json(Company::with('owner')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'nullable|string',
            'company_id' => 'nullable|string',
            'number' => 'nullable|string',
            'first_name' => 'nullable|string',
            'last_name' => 'nullable|string',
            'email' => 'nullable|email|unique:companies,email',
            'phone' => 'nullable|string',
            'salutation' => 'nullable|string',
            'job_title' => 'nullable|string',
            'description' => 'nullable|string',
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
            'opening_balance' => 'numeric',
            'show_job_amount_to_worker' => 'boolean',
            'is_client_portal_enabled' => 'boolean',
        ]);

        // Using $request->all() directly for simplicity after validation, 
        // though typically we should use $validated if all fields are listed.
        // We'll use $request->all() to capture any missing mapped fields easily for now.
        $company = Company::create($request->all());

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

    public function show(Company $company)
    {
        $company->load('owner');
        return response()->json($company);
    }

    public function update(Request $request, Company $company)
    {
        $request->validate([
            'email' => 'nullable|email|unique:companies,email,' . $company->id,
            'owner_user_id' => 'nullable|exists:users,id',
        ]);
        
        $company->update($request->all());

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
                \App\Models\User::create([
                    'email' => $company->email,
                    'company_id' => $company->id,
                    'role' => 'admin',
                    'name' => trim($company->first_name . ' ' . $company->last_name),
                    'phone' => $company->phone,
                    'password' => bcrypt('password123'), // Default temporary password
                    'is_active' => true,
                ]);
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

    public function destroy(Company $company)
    {
        $company->delete();
        return response()->json(null, 204);
    }
}
