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

    /**
     * Auth here is stateless (Bearer-token Sanctum, no session middleware on
     * api.php), and Google's redirect back to callback() is a bare browser
     * navigation carrying no Authorization header at all — so the CSRF state
     * and the identity of who's connecting both have to travel inside the
     * `state` param itself rather than in a server-side session.
     */
    public function connect(Request $request)
    {
        $user = $request->user();

        $state = encrypt([
            'company_id' => $user->company_id,
            'user_id' => $user->id,
            'nonce' => bin2hex(random_bytes(16)),
            'expires_at' => now()->addMinutes(10)->timestamp,
        ]);

        return response()->json(['auth_url' => $this->oauth->getAuthorizationUrl($state)]);
    }

    public function callback(Request $request)
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        $stateRaw = $request->query('state');
        if (!$stateRaw) {
            return redirect($frontendUrl . '/workspace/settings?google=denied');
        }

        try {
            $state = decrypt($stateRaw);
        } catch (\Throwable $e) {
            return redirect($frontendUrl . '/workspace/settings?google=state_mismatch');
        }

        if (!is_array($state) || ($state['expires_at'] ?? 0) < now()->timestamp) {
            return redirect($frontendUrl . '/workspace/settings?google=expired');
        }

        if (!$request->query('code')) {
            return redirect($frontendUrl . '/workspace/settings?google=denied');
        }

        try {
            $tokens = $this->oauth->exchangeCode($request->query('code'));
        } catch (\Throwable $e) {
            return redirect($frontendUrl . '/workspace/settings?google=error');
        }

        $companyId = $state['company_id'];

        $connection = GoogleContactConnection::withoutGlobalScope('company')->updateOrCreate(
            ['company_id' => $companyId],
            array_filter([
                'connected_user_id' => $state['user_id'],
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
