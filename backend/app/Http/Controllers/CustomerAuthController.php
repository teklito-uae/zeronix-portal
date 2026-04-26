<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class CustomerAuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:customers',
            'password' => 'required|string|min:8',
            'company' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $customer = Customer::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'company' => $validated['company'] ?? null,
            'phone' => $validated['phone'] ?? null,
        ]);

        // Notify Admins
        $admins = \App\Models\User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            $admin->notify(new \App\Notifications\AdminNotification(
                'New Customer Registration',
                "{$customer->name} from {$customer->company} has registered on the portal.",
                'info',
                "/admin/customers/{$customer->id}"
            ));
        }

        $token = $customer->createToken('customer-token', ['role:customer'])->plainTextToken;

        return response()->json([
            'user' => $customer,
            'token' => $token
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        \Log::info('Login attempt', ['email' => $request->email]);

        $customer = Customer::where('email', $request->email)->first();

        if ($customer) {
            $check = Hash::check($request->password, $customer->password);
            \Log::info('Password check result', ['matches' => $check]);

            if ($check) {
                if (!$customer->is_portal_active) {
                    return response()->json([
                        'message' => 'Your portal access has been disabled. Please contact support.'
                    ], 403);
                }

                $token = $customer->createToken('customer-token', ['role:customer'])->plainTextToken;

                return response()->json([
                    'customer' => $customer->load('assignedUser'),
                    'token' => $token
                ]);
            }
        } else {
            \Log::info('Customer not found for email', ['email' => $request->email]);
        }

        return response()->json([
            'message' => 'The provided credentials do not match our records.'
        ], 401);
    }

    public function logout(Request $request)
    {
        Auth::guard('customer')->logout();

        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        return response()->json([
            'customer' => $request->user()->load('assignedUser')
        ]);
    }
}
