<?php

namespace App\Services;

use App\Models\GoogleContactConnection;
use Illuminate\Support\Facades\Http;

/**
 * Fetches and normalizes contacts from the Google People API for a
 * per-tenant Google Contacts connection.
 */
class GooglePeopleContactsService
{
    private const CONNECTIONS_URL = 'https://people.googleapis.com/v1/people/me/connections';

    public function fetchPage(GoogleContactConnection $connection, GoogleOAuthService $oauth, ?string $pageToken = null): array
    {
        $accessToken = $oauth->ensureFreshToken($connection);

        $query = [
            'personFields' => 'names,emailAddresses,phoneNumbers,organizations',
            'pageSize' => 200,
        ];

        if ($pageToken) {
            $query['pageToken'] = $pageToken;
        }

        return Http::withToken($accessToken)
            ->get(self::CONNECTIONS_URL, $query)
            ->throw()
            ->json();
    }

    /**
     * Normalize one Google `person` resource into a flat contact row, or
     * null if it has no usable identifying data (no name/email/phone).
     */
    public function normalize(array $person): ?array
    {
        $hasName = !empty($person['names'][0]['displayName']);
        $hasEmail = !empty($person['emailAddresses'][0]['value']);
        $hasPhone = !empty($person['phoneNumbers'][0]['value']);

        if (!$hasName && !$hasEmail && !$hasPhone) {
            return null;
        }

        return [
            'external_id' => $person['resourceName'] ?? null,
            'name' => $person['names'][0]['displayName'] ?? ($person['emailAddresses'][0]['value'] ?? 'Unknown'),
            'company' => $person['organizations'][0]['name'] ?? null,
            'email' => $person['emailAddresses'][0]['value'] ?? null,
            'phone' => $person['phoneNumbers'][0]['value'] ?? null,
        ];
    }
}
