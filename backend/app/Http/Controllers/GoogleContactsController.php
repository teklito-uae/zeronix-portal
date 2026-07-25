<?php

namespace App\Http\Controllers;

use App\Jobs\SyncGoogleContactsJob;
use App\Models\GoogleContactConnection;
use App\Models\Lead;
use App\Services\GoogleOAuthService;
use Illuminate\Http\Request;

class GoogleContactsController extends Controller
{
    public function __construct(private GoogleOAuthService $oauth)
    {
    }

    public function connect(Request $request)
    {
        $state = bin2hex(random_bytes(16));
        $request->session()->put('google_oauth_state', $state);

        return response()->json(['auth_url' => $this->oauth->getAuthorizationUrl($state)]);
    }

    public function callback(Request $request)
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        if (!auth()->check()) {
            return redirect($frontendUrl . '/login');
        }

        $expectedState = $request->session()->pull('google_oauth_state');
        if (!$request->query('state') || $request->query('state') !== $expectedState) {
            return redirect($frontendUrl . '/workspace/settings?google=state_mismatch');
        }

        if (!$request->query('code')) {
            return redirect($frontendUrl . '/workspace/settings?google=denied');
        }

        try {
            $tokens = $this->oauth->exchangeCode($request->query('code'));
        } catch (\Throwable $e) {
            return redirect($frontendUrl . '/workspace/settings?google=error');
        }

        $user = auth()->user();
        $companyId = $user->company_id;

        $connection = GoogleContactConnection::withoutGlobalScope('company')->updateOrCreate(
            ['company_id' => $companyId],
            array_filter([
                'connected_user_id' => $user->id,
                'access_token' => $tokens['access_token'] ?? null,
                'refresh_token' => $tokens['refresh_token'] ?? null,
                'token_expires_at' => now()->addSeconds($tokens['expires_in'] ?? 3600),
                'is_active' => true,
                'sync_status' => 'idle',
                'consecutive_failures' => 0,
                'last_error' => null,
            ], fn ($v) => $v !== null)
        );

        $email = $this->oauth->fetchAccountEmail($tokens['access_token'] ?? '');
        if ($email) {
            $connection->update(['google_account_email' => $email]);
        }

        SyncGoogleContactsJob::dispatch($connection->id);

        return redirect($frontendUrl . '/workspace/settings?google=connected');
    }

    public function status(Request $request)
    {
        $connection = GoogleContactConnection::first();

        if (!$connection) {
            return response()->json([
                'connected' => false,
                'google_account_email' => null,
                'sync_status' => null,
                'last_synced_at' => null,
                'last_error' => null,
                'pending_leads_count' => 0,
            ]);
        }

        return response()->json([
            'connected' => $connection->is_active,
            'google_account_email' => $connection->google_account_email,
            'sync_status' => $connection->sync_status,
            'last_synced_at' => $connection->last_synced_at,
            'last_error' => $connection->last_error,
            'pending_leads_count' => Lead::where('source', 'google_contacts')->where('status', 'new')->count(),
        ]);
    }

    public function sync(Request $request)
    {
        $connection = GoogleContactConnection::first();
        if (!$connection || !$connection->is_active) {
            return response()->json(['message' => 'No active Google connection.'], 404);
        }

        SyncGoogleContactsJob::dispatch($connection->id);

        return response()->json(['message' => 'Sync started.']);
    }

    public function disconnect(Request $request)
    {
        $connection = GoogleContactConnection::first();
        if (!$connection) {
            return response()->json(['message' => 'No connection to disconnect.'], 404);
        }

        $connection->update(['is_active' => false, 'sync_status' => 'idle']);

        return response()->json(['message' => 'Disconnected.']);
    }
}
