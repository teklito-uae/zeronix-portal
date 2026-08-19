<?php

namespace App\Services;

use App\Models\GoogleContactConnection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Handles the Google OAuth2 authorization-code flow and token refresh
 * for per-tenant Google Contacts connections.
 */
class GoogleOAuthService
{
    private const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';
    private const USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
    private const SCOPE = 'https://www.googleapis.com/auth/contacts.readonly';

    public function getAuthorizationUrl(string $state): string
    {
        $params = [
            'client_id' => config('services.google.client_id'),
            'redirect_uri' => config('services.google.redirect'),
            'response_type' => 'code',
            'scope' => self::SCOPE,
            'access_type' => 'offline',
            'prompt' => 'consent',
            'state' => $state,
        ];

        return self::AUTH_URL . '?' . http_build_query($params);
    }

    public function exchangeCode(string $code): array
    {
        return Http::asForm()->post(self::TOKEN_URL, [
            'grant_type' => 'authorization_code',
            'code' => $code,
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'redirect_uri' => config('services.google.redirect'),
        ])->throw()->json();
    }

    public function refreshAccessToken(GoogleContactConnection $connection): void
    {
        if (!$connection->refresh_token) {
            throw new \RuntimeException('Google contact connection has no refresh token.');
        }

        $response = Http::asForm()->post(self::TOKEN_URL, [
            'grant_type' => 'refresh_token',
            'refresh_token' => $connection->refresh_token,
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
        ])->throw()->json();

        $update = [
            'access_token' => $response['access_token'],
            'token_expires_at' => now()->addSeconds($response['expires_in'] ?? 3600),
        ];

        // Refresh responses don't always include a new refresh_token.
        if (!empty($response['refresh_token'])) {
            $update['refresh_token'] = $response['refresh_token'];
        }

        $connection->update($update);
    }

    public function ensureFreshToken(GoogleContactConnection $connection): string
    {
        if (!$connection->token_expires_at || now()->addSeconds(60)->greaterThanOrEqualTo($connection->token_expires_at)) {
            $this->refreshAccessToken($connection);
            $connection->refresh();
        }

        return $connection->access_token;
    }

    public function fetchAccountEmail(string $accessToken): ?string
    {
        try {
            $response = Http::withToken($accessToken)->get(self::USERINFO_URL);
            return $response->json('email');
        } catch (\Throwable $e) {
            // The account email is only a display label, so a failure here must not
            // abort the connection — but it should be traceable.
            Log::warning('Google Contacts: failed to fetch account email', ['error' => $e->getMessage()]);
            return null;
        }
    }
}
