<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class CustomerAuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $customer = Customer::where('email', $request->email)->first();

        if ($customer) {
            $check = Hash::check($request->password, $customer->password);

            if ($check) {
                if (!$customer->is_portal_active) {
                    return response()->json([
                        'message' => 'Your portal access has been disabled. Please contact support.'
                    ], 403);
                }

                $token = $customer->createToken('customer-token', ['role:customer'])->plainTextToken;

                return response()->json([
                    'customer' => $customer->load('assigned_users'),
                    'token' => $token
                ]);
            }
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
            'customer' => $request->user()->load('assigned_users')
        ]);
    }
}
