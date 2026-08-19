<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Base for feature tests that run against the complete migration history.
 *
 * Unlike Tests\Feature\SupplierBroadcast\SbTestCase — which restricts
 * migrate:fresh to a narrow --path subset — this base uses the default
 * RefreshDatabase behavior, so tests get the same schema the application
 * really has.
 */
abstract class FullSchemaTestCase extends TestCase
{
    use RefreshDatabase;

    protected function makeCompany(array $overrides = []): Company
    {
        return Company::create(array_merge([
            'name' => 'Test Company ' . uniqid(),
        ], $overrides));
    }

    protected function makeUser(Company $company, array $overrides = []): User
    {
        return User::create(array_merge([
            'name' => 'Test User',
            'email' => 'user' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'company_id' => $company->id,
            'is_active' => true,
        ], $overrides));
    }
}
