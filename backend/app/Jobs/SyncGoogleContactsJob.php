<?php

namespace App\Jobs;

use App\Models\GoogleContactConnection;
use App\Models\Lead;
use App\Models\Customer;
use App\Models\CustomerContact;
use App\Services\GoogleOAuthService;
use App\Services\GooglePeopleContactsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Syncs a tenant's Google Contacts into the leads table. Runs unauthenticated
 * — all queries explicit and scoped by company_id (global scopes bypassed).
 */
class SyncGoogleContactsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;

    public function __construct(public int $connectionId)
    {
        $this->onQueue('google-sync');
    }

    public function backoff(): array
    {
        return [60, 300, 900];
    }

    public function handle(GoogleOAuthService $oauth, GooglePeopleContactsService $people): void
    {
        $connection = GoogleContactConnection::withoutGlobalScope('company')->find($this->connectionId);
        if (!$connection || !$connection->is_active) {
            return;
        }

        $connection->update(['sync_status' => 'syncing']);

        try {
            $pageToken = null;
            $pages = 0;

            do {
                $result = $people->fetchPage($connection, $oauth, $pageToken);
                $connections = $result['connections'] ?? [];

                foreach ($connections as $person) {
                    $normalized = $people->normalize($person);
                    if (!$normalized) {
                        continue;
                    }
                    $this->upsertLead($connection, $normalized);
                }

                $pageToken = $result['nextPageToken'] ?? null;
                $pages++;
            } while ($pageToken && $pages < 50);

            $connection->update([
                'sync_status' => 'idle',
                'last_synced_at' => now(),
                'consecutive_failures' => 0,
                'last_error' => null,
            ]);
        } catch (\Illuminate\Http\Client\RequestException $e) {
            $isAuthError = in_array($e->response?->status(), [401, 400], true);
            $connection->update([
                'sync_status' => 'error',
                'is_active' => $isAuthError ? false : $connection->is_active,
                'last_error' => mb_substr($e->getMessage(), 0, 2000),
                'consecutive_failures' => $connection->consecutive_failures + 1,
            ]);
            throw $e;
        } catch (\Throwable $e) {
            $connection->update([
                'sync_status' => 'error',
                'last_error' => mb_substr($e->getMessage(), 0, 2000),
                'consecutive_failures' => $connection->consecutive_failures + 1,
            ]);
            throw $e;
        }
    }

    private function upsertLead(GoogleContactConnection $connection, array $normalized): void
    {
        $companyId = $connection->company_id;

        // Already tracked by resourceName — refresh in place, never touch a converted lead.
        $existingByExternalId = Lead::withoutGlobalScope('company')
            ->where('company_id', $companyId)
            ->where('external_id', $normalized['external_id'])
            ->first();

        if ($existingByExternalId) {
            if ($existingByExternalId->status !== 'converted') {
                $existingByExternalId->update([
                    'name' => $normalized['name'],
                    'company' => $normalized['company'],
                    'email' => $normalized['email'],
                    'phone' => $normalized['phone'],
                    'synced_at' => now(),
                ]);
            }
            return;
        }

        // No email means we can't dedupe further — create fresh if we have one, else skip
        // duplicate-by-resourceName protection above already covers repeat syncs of this contact.
        if ($normalized['email']) {
            $existingByEmail = Lead::withoutGlobalScope('company')
                ->where('company_id', $companyId)
                ->where('email', $normalized['email'])
                ->first();

            if ($existingByEmail) {
                if ($existingByEmail->status !== 'converted') {
                    $existingByEmail->update([
                        'external_id' => $normalized['external_id'],
                        'name' => $normalized['name'],
                        'company' => $normalized['company'],
                        'phone' => $normalized['phone'],
                        'synced_at' => now(),
                    ]);
                }
                return;
            }

            $alreadyCustomer = Customer::withoutGlobalScope('company')
                ->where('company_id', $companyId)
                ->where('email', $normalized['email'])
                ->exists()
                || CustomerContact::withoutGlobalScope('company')
                    ->whereHas('customer', fn ($q) => $q->where('company_id', $companyId))
                    ->where('email', $normalized['email'])
                    ->exists();

            if ($alreadyCustomer) {
                return;
            }
        }

        try {
            Lead::withoutGlobalScope('company')->create([
                'company_id' => $companyId,
                'name' => $normalized['name'],
                'company' => $normalized['company'],
                'email' => $normalized['email'],
                'phone' => $normalized['phone'],
                'source' => 'google_contacts',
                'status' => 'new',
                'external_id' => $normalized['external_id'],
                'synced_at' => now(),
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            // Unique-constraint race (email or external_id already owned by another
            // row, possibly in a different tenant) — skip this contact, don't fail the sync.
            return;
        }
    }
}
