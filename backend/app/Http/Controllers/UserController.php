<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('designation', 'like', "%{$s}%");
            });
        }

        if ($request->filled('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        $users = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $users->items(),
            'total' => $users->total(),
            'current_page' => $users->currentPage(),
            'last_page' => $users->lastPage(),
            'per_page' => $users->perPage(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string',
            'designation' => 'nullable|string|max:255',
            'permissions' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['is_active'] = $validated['is_active'] ?? true;

        $user = User::create($validated);

        return response()->json($user, 201);
    }

    public function show($id)
    {
        $user = User::findOrFail($id);
        return response()->json($user);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'role' => 'sometimes|string',
            'designation' => 'nullable|string|max:255',
            'permissions' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json($user);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        
        // Prevent deleting oneself
        if (request()->user() && request()->user()->id === $user->id) {
            return response()->json(['message' => 'Cannot delete yourself'], 403);
        }

        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }

    public function updateSmtpSettings(Request $request)
    {
        $user = request()->user();
        
        $validated = $request->validate([
            'smtp_host' => 'nullable|string',
            'smtp_port' => 'nullable|integer',
            'smtp_username' => 'nullable|string',
            'smtp_password' => 'nullable|string',
            'smtp_encryption' => 'nullable|string',
            'imap_host' => 'nullable|string',
            'imap_port' => 'nullable|integer',
            'imap_username' => 'nullable|string',
            'imap_password' => 'nullable|string',
            'imap_encryption' => 'nullable|string',
        ]);

        $user->update($validated);

        return response()->json(['message' => 'Email settings updated', 'user' => $user]);
    }

    public function sendTestEmail(Request $request)
    {
        $user = request()->user();
        
        $validated = $request->validate([
            'to' => 'nullable|email'
        ]);

        $testEmail = $validated['to'] ?? $user->email;

        if (!$user->smtp_host) {
            return response()->json(['message' => 'SMTP settings not configured'], 422);
        }

        try {
            \App\Services\MailConfigService::applyUserSmtp($user);
            
            \Illuminate\Support\Facades\Mail::raw('This is a test email from Zeronix Portal to verify your SMTP settings.', function ($message) use ($user, $testEmail) {
                $message->from($user->smtp_username, $user->name)
                        ->to($testEmail)
                        ->subject('Zeronix SMTP Test');
            });

            return response()->json(['message' => 'Test email sent successfully to ' . $testEmail]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send test email: ' . $e->getMessage()], 500);
        }
    }
}
