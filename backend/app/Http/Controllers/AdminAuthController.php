<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class AdminAuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $request->email)
                    ->whereIn('role', ['admin', 'staff', 'salesman', 'super_admin'])
                    ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'The provided credentials do not match our records.'
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Your company registration is still pending approval. We\'ll email you once an administrator activates your account.'
            ], 403);
        }

        $token = $user->createToken('admin-token', ['role:' . $user->role])->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        return response()->json([
            'user' => $request->user()
        ]);
    }

    /**
     * Send a password reset link to the given email, if it belongs to a
     * staff/admin account. Always returns a generic success message
     * regardless of whether the email exists, to avoid leaking which
     * addresses are registered.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        // There's no logged-in user at this point (they're locked out), so
        // MailConfigService::applyUserSmtp() — the "send as yourself"
        // per-staff SMTP used everywhere else in this app — can't be applied
        // ahead of time. Laravel's Password::sendResetLink() calls
        // $user->sendPasswordResetNotification() internally once it resolves
        // the matching User row; passing a callback lets us apply *that*
        // user's own SMTP credentials right before it sends, instead of
        // silently falling back to the global MAIL_MAILER (which is `log`
        // in this app, meaning the email would never actually go out).
        Password::sendResetLink($request->only('email'), function (User $user, string $token) {
            \App\Services\MailConfigService::applyUserSmtp($user);
            $user->sendPasswordResetNotification($token);
        });

        return response()->json([
            'message' => 'If an account exists for that email, a password reset link has been sent.'
        ]);
    }

    /**
     * Reset a staff/admin password using the token emailed by forgotPassword().
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => __($status)
            ], 422);
        }

        return response()->json([
            'message' => 'Your password has been reset successfully.'
        ]);
    }
}
